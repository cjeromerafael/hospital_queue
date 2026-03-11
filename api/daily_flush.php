<?php
/**
 * Handles the daily and manual wiping of patient and queue data.
 * - GET (Automatic): Checks `last_flush_date.txt`. If the current date is newer, it
 *   wipes all patient and queue data to start the day fresh.
 * - POST (Manual): If called with `manual=1` by an admin, it performs the wipe immediately.
 * Used by the Admin Dashboard and triggered on load by staff-facing pages.
 */
require_once("config.php");

$method = $_SERVER['REQUEST_METHOD'];

$data_dir = __DIR__ . '/data';
$flush_date_file = $data_dir . '/last_flush_date.txt';
$events_dir = __DIR__ . '/queue/events';

function runFlush($conn, $flush_date_file, $events_dir) {
    $conn->query("DELETE FROM queueing");
    $conn->query("DELETE FROM patient");
    if (is_dir($events_dir)) {
        foreach (glob($events_dir . '/event_*.json') as $f) {
            @unlink($f);
        }
    }
    if (!is_dir(dirname($flush_date_file))) {
        mkdir(dirname($flush_date_file), 0755, true);
    }
    $today = date('Y-m-d');
    file_put_contents($flush_date_file, $today);
}

function getLastFlushDate($flush_date_file) {
    if (!is_file($flush_date_file)) {
        return null;
    }
    $s = trim(file_get_contents($flush_date_file));
    return $s !== '' ? $s : null;
}

$today = date('Y-m-d');
$today_display = date('F j, Y');

if ($method === 'POST') {
    $manual = isset($_POST['manual']) ? $_POST['manual'] : (isset($_GET['manual']) ? $_GET['manual'] : null);
    $user_id_raw = isset($_POST['user_id']) ? $_POST['user_id'] : (isset($_GET['user_id']) ? $_GET['user_id'] : null);
    $user_id = (int)$user_id_raw;
    if (($manual !== '1' && $manual !== 1) || !$user_id_raw) {
        echo json_encode(["status" => "error", "message" => "manual=1 and user_id required"]);
        exit;
    }
    $stmt = $conn->prepare("SELECT department_role FROM role WHERE user_id = ? LIMIT 1");
    $stmt->bind_param("s", $user_id_raw);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    if (!$row || (isset($row['department_role']) && strtolower(trim($row['department_role'])) !== 'admin')) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Admin only"]);
        exit;
    }
    runFlush($conn, $flush_date_file, $events_dir);
    echo json_encode([
        "current_date" => $today,
        "current_date_display" => $today_display,
        "flushed" => true
    ]);
    exit;
}

// GET: auto daily check
$last = getLastFlushDate($flush_date_file);
$flushed = false;
if ($last === null || $today > $last) {
    runFlush($conn, $flush_date_file, $events_dir);
    $flushed = true;
}

echo json_encode([
    "current_date" => $today,
    "current_date_display" => $today_display,
    "flushed" => $flushed
]);
