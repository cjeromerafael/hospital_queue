<?php
/**
 * Creates a new patient record. Requires patient_number and department_id.
 * patient_name is optional; stored as empty string when not provided (shows blank in lists).
 * Used in patient registration page (register.html), staff manage patients.
 */
require_once("../config.php");

// Ensure patient_name column exists (add if missing so names are stored)
$check = $conn->query("SHOW COLUMNS FROM patient LIKE 'patient_name'");
if ($check && $check->num_rows === 0) {
    $conn->query("ALTER TABLE patient ADD COLUMN patient_name VARCHAR(255) DEFAULT '' AFTER patient_number");
}

$patient_number = $_POST['patient_number'] ?? null;
$patient_name   = $_POST['patient_name'] ?? null;
$department_id  = $_POST['department_id'] ?? null;

if (!$patient_number || !$department_id) {
    echo json_encode([
        "status"  => "error",
        "message" => "Patient number and department are required"
    ]);
    exit;
}

// Name is optional; use empty string when not provided so table shows blank
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

