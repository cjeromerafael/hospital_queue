<?php
/**
 * One-shot read of skip event for a department (used by queue display for skip banner/sound).
 * Event file is deleted after read.
 */
require_once("../config.php");

$department_id = $_GET['department_id'] ?? null;
if (!$department_id) {
    echo json_encode(null);
    exit;
}

$events_dir = __DIR__ . '/events';
$path = $events_dir . "/event_" . (int)$department_id . ".json";
if (!file_exists($path)) {
    echo json_encode(null);
    exit;
}

$data = file_get_contents($path);
@unlink($path);
header('Content-Type: application/json');
echo $data;