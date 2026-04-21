<?php
/**
 * Handles the daily and manual wiping of patient and queue data.
 * - GET (Automatic): Checks `last_flush_date.txt`. If the current date is newer, it
 *   wipes all queue data to start the day fresh.
 * - POST (Manual): If called with `manual=1` by an admin, it performs the wipe immediately.
 * Used by the Admin Dashboard and triggered on load by staff-facing pages.
 *
 * Concurrency: file locking on last_flush_date.txt.lock prevents duplicate flushes
 * when multiple staff members log in simultaneously at the start of a new day.
 */
require_once("config.php");

requireAuth();

$method          = $_SERVER['REQUEST_METHOD'];
$flush_date_file = __DIR__ . '/data/last_flush_date.txt';

/**
 * Core flush: clears queue_state inside a DB transaction, then updates the date file.
 * The DB clear and file write are kept as close together as possible to minimise
 * the window where they could be out of sync.
 */
function runFlush($conn, $flush_date_file) {
    $qs = $conn->query("SHOW TABLES LIKE 'queue_state'");
    if ($qs && $qs->num_rows > 0) {
        $conn->begin_transaction();
        if (!$conn->query("DELETE FROM queue_state")) {
            $conn->rollback();
            throw new RuntimeException("Failed to clear queue_state: " . $conn->error);
        }
        $conn->commit();
    }

    if (!is_dir(dirname($flush_date_file))) {
        mkdir(dirname($flush_date_file), 0755, true);
    }
    file_put_contents($flush_date_file, date('Y-m-d'));
}

function getLastFlushDate($flush_date_file) {
    if (!is_file($flush_date_file)) return null;
    $s = trim(file_get_contents($flush_date_file));
    return $s !== '' ? $s : null;
}

/**
 * Auto-flush with exclusive file lock so only one concurrent request flushes per day.
 * The date is re-read inside the lock (TOCTOU-safe).
 * Returns true if a flush was performed.
 */
function tryAutoFlush($conn, $flush_date_file) {
    if (!is_dir(dirname($flush_date_file))) {
        mkdir(dirname($flush_date_file), 0755, true);
    }

    $lock_file = $flush_date_file . '.lock';
    $lh = fopen($lock_file, 'c');
    if (!$lh) {
        // Can't open lock file — best-effort flush without locking.
        $today = date('Y-m-d');
        $last  = getLastFlushDate($flush_date_file);
        if ($last === null || $today > $last) {
            runFlush($conn, $flush_date_file);
            return true;
        }
        return false;
    }

    flock($lh, LOCK_EX);

    $today   = date('Y-m-d');
    $last    = getLastFlushDate($flush_date_file);
    $flushed = false;

    if ($last === null || $today > $last) {
        runFlush($conn, $flush_date_file);
        $flushed = true;
    }

    flock($lh, LOCK_UN);
    fclose($lh);

    return $flushed;
}

$today         = date('Y-m-d');
$today_display = date('F j, Y');

if ($method === 'POST') {
    $manual = $_POST['manual'] ?? $_GET['manual'] ?? null;
    if ($manual !== '1' && $manual !== 1) {
        echo json_encode(["status" => "error", "message" => "manual=1 required"]);
        exit;
    }

    $allowedRoles = ['admin', 'sysadmin'];
    if (!in_array(strtolower(trim(getAuthRole() ?? '')), $allowedRoles, true)) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Admin only"]);
        exit;
    }

    runFlush($conn, $flush_date_file);
    echo json_encode([
        "current_date"         => $today,
        "current_date_display" => $today_display,
        "flushed"              => true
    ]);
    exit;
}

// GET: auto daily check with race-condition protection.
$flushed = tryAutoFlush($conn, $flush_date_file);

echo json_encode([
    "current_date"         => $today,
    "current_date_display" => $today_display,
    "flushed"              => $flushed
]);
