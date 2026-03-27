<?php
/**
 * Creates a new patient record. Requires department_id.
 * patient_number is auto-generated per department in format XXX-NNN (e.g. LAB-001).
 * Used in patient registration page (register.html), staff manage patients.
 */
require_once("../config.php");
require_once("../helpers/department_queue.php");

$department_id  = (int)($_POST['department_id'] ?? 0);

if (!$department_id) {
    echo json_encode([
        "status"  => "error",
        "message" => "Department is required"
    ]);
    exit;
}

ensureDepartmentCodeColumn($conn);
$patient_number = getNextPatientNumberForDepartment($conn, $department_id);

$stmt = $conn->prepare("
    INSERT INTO patient(patient_number, department_id)
    VALUES(?, ?)
");
$stmt->bind_param("si", $patient_number, $department_id);
if (!$stmt->execute()) {
    echo json_encode([
        "status"  => "error",
        "message" => "Failed to create patient"
    ]);
    exit;
}

$patient_id = $conn->insert_id;

echo json_encode([
    "status"        => "success",
    "patient_id"    => $patient_id,
    "patient_number"=> $patient_number
]);

