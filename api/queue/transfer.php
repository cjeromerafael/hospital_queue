<?php
require_once("../config.php");

$patient_id = $_POST['patient_id'];
$new_department = $_POST['department_id'];

/* update patient */
$conn->query("
UPDATE patient SET department_id=$new_department
WHERE patient_id=$patient_id
");

/* new queue number */
$r = $conn->query("
SELECT IFNULL(MAX(queue_number),0)+1 AS n
FROM queueing WHERE department_id=$new_department
");
$next = $r->fetch_assoc()['n'];

/* insert new queue */
$conn->query("
INSERT INTO queueing(queue_number, patient_id, department_id, status)
VALUES($next,$patient_id,$new_department,'waiting')
");

echo json_encode(["status"=>"transferred","queue_number"=>$next]);
