<?php
/**
 * User-id–based registration: creates a patient from staff user_id (department from role),
 * auto-generates patient_number (uniqid), and adds the patient to the queue.
 * Not used by any current page; kept for future kiosk/self-service flows.
 */
require_once("../config.php");

$user_id = $_POST['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(["status"=>"error","message"=>"User ID required"]);
    exit;
}

/* find department via role */
$r = $conn->prepare("SELECT department_id FROM role WHERE user_id=? LIMIT 1");
$r->bind_param("i",$user_id);
$r->execute();
$res = $r->get_result();
$row = $res->fetch_assoc();

$department_id = $row['department_id'];

/* create patient */
$patient_number = uniqid("P");

$stmt = $conn->prepare("
INSERT INTO patient(patient_number, department_id)
VALUES(?,?)
");
$stmt->bind_param("si",$patient_number,$department_id);
$stmt->execute();

$patient_id = $conn->insert_id;

/* generate queue number per department */
$q = $conn->prepare("
SELECT IFNULL(MAX(queue_number),0)+1 AS next_num
FROM queueing WHERE department_id=?
");
$q->bind_param("i",$department_id);
$q->execute();
$next = $q->get_result()->fetch_assoc()['next_num'];

/* insert queue */
$ins = $conn->prepare("
INSERT INTO queueing(queue_number, patient_id, department_id, status)
VALUES(?,?,?, 'waiting')
");
$ins->bind_param("iii",$next,$patient_id,$department_id);
$ins->execute();

echo json_encode([
    "status"=>"success",
    "patient_id"=>$patient_id,
    "queue_number"=>$next
]);
