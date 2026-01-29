<?php
require_once("../config.php");

$department_id = $_POST['department_id'] ?? null;

if (!$department_id) {
    echo json_encode(["status" => "error", "message" => "Department ID required"]);
    exit;
}

/* find current serving */
$currentRes = $conn->query("
SELECT queue_id, queue_number 
FROM queueing 
WHERE department_id = ".(int)$department_id." AND status='serving'
ORDER BY queue_number DESC
LIMIT 1
");

if ($currentRes->num_rows === 0) {
    echo json_encode(["status" => "empty"]);
    exit;
}

$current = $currentRes->fetch_assoc();
$currentId = (int)$current['queue_id'];
$currentNo = (int)$current['queue_number'];

/* find previous queue entry */
$prevRes = $conn->query("
SELECT queue_id 
FROM queueing 
WHERE department_id = ".(int)$department_id." 
AND queue_number < $currentNo
ORDER BY queue_number DESC
LIMIT 1
");

if ($prevRes->num_rows === 0) {
    echo json_encode(["status" => "no_previous"]);
    exit;
}

$prevId = (int)$prevRes->fetch_assoc()['queue_id'];

/* move current back to waiting and set previous as serving */
$conn->query("UPDATE queueing SET status='waiting' WHERE queue_id=$currentId");
$conn->query("UPDATE queueing SET status='serving' WHERE queue_id=$prevId");

echo json_encode(["status" => "success", "queue_id" => $prevId]);

