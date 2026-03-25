<?php
/**
 * Helpers for v2 queue state (number-only, per department).
 *
 * Semantics implemented:
 * - State: current_number, next_number (next sequential), skipped_numbers queue (FIFO).
 * - Next:
 *   - If skipped_numbers has items, serve the oldest skipped number.
 *   - Else serve next_number (and increment next_number).
 * - Skip:
 *   - If current_number > 0, enqueue it into skipped_numbers.
 *   - Serve next_number immediately (and increment next_number).
 * - Reset:
 *   - current_number = 0, next_number = 1, skipped_numbers = []
 */

require_once(__DIR__ . "/../../config.php");

function ensureQueueStateTable($conn) {
    // Idempotently create the queue_state table for v2.
    $conn->query("
        CREATE TABLE IF NOT EXISTS queue_state (
            department_id INT(11) NOT NULL,
            current_number INT(11) NOT NULL DEFAULT 0,
            next_number INT(11) NOT NULL DEFAULT 1,
            skipped_numbers_json LONGTEXT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (department_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");
}

function parseSkippedNumbers($skippedJson) {
    if ($skippedJson === null || trim($skippedJson) === "") return [];
    $arr = json_decode($skippedJson, true);
    if (!is_array($arr)) return [];

    // Normalize to positive ints (0 is not a meaningful queued number in our model).
    $out = [];
    foreach ($arr as $v) {
        $n = (int)$v;
        if ($n > 0) $out[] = $n;
    }
    return array_values($out);
}

function encodeSkippedNumbers($arr) {
    if (!is_array($arr)) $arr = [];
    return json_encode(array_values($arr));
}

function ensureDepartmentQueueStateRow($conn, $department_id) {
    $stmt = $conn->prepare("SELECT current_number, next_number, skipped_numbers_json FROM queue_state WHERE department_id=? LIMIT 1");
    $stmt->bind_param("i", $department_id);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res && $row = $res->fetch_assoc()) {
        return $row;
    }

    $ins = $conn->prepare("
        INSERT INTO queue_state(department_id, current_number, next_number, skipped_numbers_json)
        VALUES(?, 0, 1, '[]')
    ");
    $ins->bind_param("i", $department_id);
    $ins->execute();

    return [
        "current_number" => 0,
        "next_number" => 1,
        "skipped_numbers_json" => "[]"
    ];
}

function loadAllDepartmentsWithCurrentNumbers($conn) {
    // Exclude the internal Admin "department" row.
    $sql = "
        SELECT d.department_id,
               d.department_name,
               d.is_finance,
               COALESCE(qs.current_number, 0) AS current_number
        FROM department d
        LEFT JOIN queue_state qs ON qs.department_id = d.department_id
        WHERE LOWER(d.department_name) <> 'admin'
        ORDER BY d.department_id
    ";
    $res = $conn->query($sql);
    return $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
}

function resetDepartmentState($conn, $department_id) {
    ensureDepartmentQueueStateRow($conn, $department_id);

    $upd = $conn->prepare("
        UPDATE queue_state
        SET current_number = 0,
            next_number = 1,
            skipped_numbers_json = '[]'
        WHERE department_id=?
    ");
    $upd->bind_param("i", $department_id);
    $upd->execute();
}

function advanceNext($conn, $department_id) {
    ensureDepartmentQueueStateRow($conn, $department_id);

    // Lock row for consistent Next/Skip/Reset updates.
    $sel = $conn->prepare("SELECT current_number, next_number, skipped_numbers_json FROM queue_state WHERE department_id=? FOR UPDATE");
    $sel->bind_param("i", $department_id);
    $sel->execute();
    $row = $sel->get_result()->fetch_assoc();

    $current = (int)($row["current_number"] ?? 0);
    $next = (int)($row["next_number"] ?? 1);
    $skipped = parseSkippedNumbers($row["skipped_numbers_json"] ?? "[]");

    if (count($skipped) > 0) {
        $newCurrent = (int)array_shift($skipped);
        // When serving from skipped queue, next_number stays as-is.
        $newNext = $next;
    } else {
        $newCurrent = $next;
        $newNext = $next + 1;
    }

    $upd = $conn->prepare("
        UPDATE queue_state
        SET current_number = ?,
            next_number = ?,
            skipped_numbers_json = ?
        WHERE department_id=?
    ");
    $skippedJson = encodeSkippedNumbers($skipped);
    // Types: i (current), i (next), s (skipped JSON), i (department_id)
    $upd->bind_param("iisi", $newCurrent, $newNext, $skippedJson, $department_id);
    $upd->execute();

    return [
        "current_number" => $newCurrent,
        "next_number" => $newNext,
        "skipped_count" => count($skipped)
    ];
}

function advanceSkip($conn, $department_id) {
    ensureDepartmentQueueStateRow($conn, $department_id);

    // Lock row for consistent Next/Skip/Reset updates.
    $sel = $conn->prepare("SELECT current_number, next_number, skipped_numbers_json FROM queue_state WHERE department_id=? FOR UPDATE");
    $sel->bind_param("i", $department_id);
    $sel->execute();
    $row = $sel->get_result()->fetch_assoc();

    $current = (int)($row["current_number"] ?? 0);
    $next = (int)($row["next_number"] ?? 1);
    $skipped = parseSkippedNumbers($row["skipped_numbers_json"] ?? "[]");

    // Skip schedules the CURRENT number to reappear on the next Next().
    if ($current > 0) {
        $skipped[] = $current;
    }

    $newCurrent = $next;      // Move forward immediately to the next sequential number.
    $newNext = $next + 1;

    $upd = $conn->prepare("
        UPDATE queue_state
        SET current_number = ?,
            next_number = ?,
            skipped_numbers_json = ?
        WHERE department_id=?
    ");
    $skippedJson = encodeSkippedNumbers($skipped);
    // Types: i (current), i (next), s (skipped JSON), i (department_id)
    $upd->bind_param("iisi", $newCurrent, $newNext, $skippedJson, $department_id);
    $upd->execute();

    return [
        "current_number" => $newCurrent,
        "next_number" => $newNext,
        "skipped_count" => count($skipped)
    ];
}

?>

