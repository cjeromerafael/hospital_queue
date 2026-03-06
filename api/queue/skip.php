<?php
/**
 * Skips current serving: marks skipped, requeues patient at end, promotes next waiting.
 * Writes skip event for display screen. Used by: staff dashboard "Skip Current".
 */
require_once("../config.php");

$department_id = $_POST['department_id'] ?? null;

if (!$department_id) {
    echo json_encode(["status" => "error", "message" => "Department ID required"]);
    exit;
}

/* We'll mark the current as skipped, requeue the patient at the end, then promote the next waiting */
$conn->begin_transaction();

/* Find current serving queue */
$current = $conn->query("SELECT queue_id, patient_id, queue_number FROM queueing
    WHERE department_id=" . (int)$department_id . " AND status='serving' ORDER BY queue_number LIMIT 1");

if (!$current || $current->num_rows === 0) {
    $conn->rollback();
    echo json_encode(["status" => "empty"]);
    exit;
}

$current_row = $current->fetch_assoc();
$current_id = (int)$current_row['queue_id'];
$patient_id = (int)$current_row['patient_id'];

/* Mark current as skipped (keeps historical record) */
$upd = $conn->prepare("UPDATE queueing SET status='skipped' WHERE queue_id=?");
$upd->bind_param("i", $current_id);
$upd->execute();

/* Compute next queue number for department (place at end) */
$qr = $conn->query("SELECT IFNULL(MAX(queue_number),0)+1 AS next_num FROM queueing WHERE department_id=" . (int)$department_id);
$next_num = (int)$qr->fetch_assoc()['next_num'];

/* Insert new waiting row for the same patient at the end */
$ins = $conn->prepare("INSERT INTO queueing(queue_number, patient_id, department_id, status) VALUES(?, ?, ?, 'waiting')");
$ins->bind_param("iii", $next_num, $patient_id, $department_id);
$ins->execute();
$requeued_id = $conn->insert_id;

/* Write a simple event file for displays to pick up */
$events_dir = __DIR__ . '/events';
if (!is_dir($events_dir)) mkdir($events_dir, 0755, true);
$event = [
    'type' => 'skipped',
    'department_id' => (int)$department_id,
    'skipped_id' => $current_id,
    'skipped_number' => (int)$current_row['queue_number'],
    'requeued_id' => $requeued_id,
    'requeued_number' => $next_num,
    'timestamp' => time()
];
file_put_contents($events_dir . "/event_" . (int)$department_id . ".json", json_encode($event));

/* Get next waiting (the one with lowest queue_number) */
$res = $conn->query("SELECT queue_id FROM queueing WHERE department_id=" . (int)$department_id . " AND status='waiting' ORDER BY queue_number LIMIT 1");

if ($res->num_rows === 0) {
    $conn->commit();
    echo json_encode(["status" => "skipped_no_next", "skipped_id" => $current_id, "requeued_id" => $requeued_id, "requeued_number" => $next_num]);
    exit;
}

$next_id = (int)$res->fetch_assoc()['queue_id'];

/* Set next as serving */
$set = $conn->prepare("UPDATE queueing SET status='serving' WHERE queue_id=?");
$set->bind_param("i", $next_id);
$set->execute();

$conn->commit();

echo json_encode([
    "status" => "skipped",
    "skipped_id" => $current_id,
    "skipped_number" => (int)$current_row['queue_number'],
    "requeued_id" => $requeued_id,
    "requeued_number" => $next_num,
    "next_id" => $next_id
]);
