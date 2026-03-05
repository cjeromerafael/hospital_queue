<?php
/**
 * Creates a new patient record. Requires department_id.
 * patient_number is auto-generated per department in format XXX-NNN (e.g. LAB-001).
 * patient_name is optional.
 * Used in patient registration page (register.html), staff manage patients.
 */
require_once("../config.php");
require_once("../helpers/department_queue.php");

// Ensure patient_name column exists (add if missing so names are stored)
$check = $conn->query("SHOW COLUMNS FROM patient LIKE 'patient_name'");
if ($check && $check->num_rows === 0) {
    $conn->query("ALTER TABLE patient ADD COLUMN patient_name VARCHAR(255) DEFAULT '' AFTER patient_number");
}

$patient_name   = $_POST['patient_name'] ?? null;
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

// Name is optional; use empty string when not provided so table shows blank.
$patient_name = ($patient_name !== null && trim((string)$patient_name) !== '') ? trim((string)$patient_name) : '';

$stmt = $conn->prepare("
    INSERT INTO patient(patient_number, patient_name, department_id)
    VALUES(?, ?, ?)
");
$stmt->bind_param("ssi", $patient_number, $patient_name, $department_id);
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

