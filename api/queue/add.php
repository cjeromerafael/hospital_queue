<?php
require_once("../config.php");

$department_id = $_POST['department_id'] ?? null;
$patient_id    = $_POST['patient_id'] ?? null;

if (!$department_id || !$patient_id) {
    echo json_encode([
        "status"  => "error",
        "message" => "Department ID and Patient ID are required"
    ]);
    exit;
}

/* generate next queue number for this department */
$stmt = $conn->prepare("
    SELECT IFNULL(MAX(queue_number),0)+1 AS next_num
    FROM queueing
    WHERE department_id=?
");
$stmt->bind_param("i", $department_id);
$stmt->execute();
$next = $stmt->get_result()->fetch_assoc()['next_num'];

/* insert queue row as waiting */
$ins = $conn->prepare("
    INSERT INTO queueing(queue_number, patient_id, department_id, status)
    VALUES(?, ?, ?, 'waiting')
");
$ins->bind_param("iii", $next, $patient_id, $department_id);
$ins->execute();

echo json_encode([
    "status"       => "success",
    "queue_id"     => $conn->insert_id,
    "queue_number" => $next
]);

