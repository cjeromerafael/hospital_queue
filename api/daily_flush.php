<?php
/**
 * Handles the daily and manual wiping of patient and queue data.
 * - GET (Automatic): Checks `last_flush_date.txt`. If the current date is newer, it
 *   wipes all patient and queue data to start the day fresh.
 * - POST (Manual): If called with `manual=1` by an admin, it performs the wipe immediately.
 * Used by the Admin Dashboard and triggered on load by staff-facing pages.
 */
require_once("config.php");

requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

$data_dir = __DIR__ . '/data';
$flush_date_file = $data_dir . '/last_flush_date.txt';
$events_dir = __DIR__ . '/queue/events';

function runFlush($conn, $flush_date_file, $events_dir) {
    // v2 queue_state (number-only) is the active queue model; clear it when flushing.
    $qs = $conn->query("SHOW TABLES LIKE 'queue_state'");
    if ($qs && $qs->num_rows > 0) {
        $conn->query("DELETE FROM queue_state");
    }
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
