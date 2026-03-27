<?php
/**
 * Deletes a patient by patient_id. Used in patient manage page (delete button).
 * After delete, renumbers remaining patients in that department so there are no gaps.
 */
require_once("../config.php");
require_once("../helpers/department_queue.php");

$patient_id = $_POST['patient_id'] ?? null;
if (!$patient_id) {
    echo json_encode(["status"=>"error","message"=>"patient_id required"]);
    exit;
}

$patient_id = (int) $patient_id;
$res = $conn->query("SELECT department_id FROM patient WHERE patient_id = $patient_id");
$row = $res ? $res->fetch_assoc() : null;
$department_id = $row ? (int)$row['department_id'] : null;

$stmt = $conn->prepare("DELETE FROM patient WHERE patient_id=?");
$stmt->bind_param("i", $patient_id);
$stmt->execute();

if ($department_id !== null) {
    ensureDepartmentCodeColumn($conn);
    renumberDepartmentPatients($conn, $department_id);
}

echo json_encode(["status"=>"success"]);
