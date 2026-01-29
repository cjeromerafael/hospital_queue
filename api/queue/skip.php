<?php
require_once("../config.php");

$department_id = $_POST['department_id'] ?? null;

if (!$department_id) {
    echo json_encode(["status" => "error", "message" => "Department ID required"]);
    exit;
}

/* find current serving queue */
$current = $conn->query("
SELECT queue_id FROM queueing
WHERE department_id=$department_id AND status='serving'
ORDER BY queue_number LIMIT 1
");

if (!$current || $current->num_rows === 0) {
    echo json_encode(["status" => "empty"]);
    exit;
}

$current_id = $current->fetch_assoc()['queue_id'];

/* mark current as skipped */
$conn->query("UPDATE queueing SET status='skipped' WHERE queue_id=$current_id");

/* move to next waiting */
$res = $conn->query("
SELECT queue_id FROM queueing
WHERE department_id=$department_id AND status='waiting'
ORDER BY queue_number LIMIT 1
");

if ($res->num_rows === 0) {
    echo json_encode(["status" => "skipped_no_next", "skipped_id" => $current_id]);
    exit;
}

$next_id = $res->fetch_assoc()['queue_id'];
$conn->query("UPDATE queueing SET status='serving' WHERE queue_id=$next_id");

echo json_encode([
    "status"     => "skipped",
    "skipped_id" => $current_id,
    "next_id"    => $next_id
]);
