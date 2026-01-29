<?php
require_once("../config.php");

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

/* insert patient; current schema stores patient_number and department_id.
   patient_name is accepted but ignored if the column does not exist. */

try {
    // attempt insert with optional name column first
    $stmt = $conn->prepare("
        INSERT INTO patient(patient_number, department_id)
        VALUES(?,?)
    ");
    $stmt->bind_param("si", $patient_number, $department_id);
    $stmt->execute();
} catch (Throwable $e) {
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

