<?php
/**
 * Updates patient name and/or department. Expects PUT with patient_id and optional
 * patient_name, department_id. Used in patient manage page (edit row).
 * When department_id is changed (transfer), assigns new patient_number (XXX-NNN) for the new department.
 */
require_once("../config.php");
require_once("../helpers/department_queue.php");

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'PUT') {
    echo json_encode(["status"=>"error","message"=>"Use PUT to update"]);
    exit;
}

parse_str(file_get_contents('php://input'), $_PUT);
$patient_id = $_PUT['patient_id'] ?? null;
$patient_name = trim($_PUT['patient_name'] ?? '');
$department_id = isset($_PUT['department_id']) && $_PUT['department_id'] !== '' ? (int)$_PUT['department_id'] : null;

if (!$patient_id) {
    echo json_encode(["status"=>"error","message"=>"patient_id required"]);
    exit;
}

$fields = [];
$params = [];
$types = '';

if ($patient_name !== '') {
    $fields[] = "patient_name=?";
    $params[] = $patient_name;
    $types .= 's';
}

if (!is_null($department_id)) {
    $curr = $conn->query("SELECT department_id FROM patient WHERE patient_id = " . (int)$patient_id);
    $current_dept = ($curr && $row = $curr->fetch_assoc()) ? (int)$row['department_id'] : null;
    if ($current_dept !== $department_id) {
        ensureDepartmentCodeColumn($conn);
        $new_patient_number = getNextPatientNumberForDepartment($conn, $department_id);
        $fields[] = "patient_number=?";
        $params[] = $new_patient_number;
        $types .= 's';
    }
    $fields[] = "department_id=?";
    $params[] = $department_id;
    $types .= 'i';
}

if (count($fields) === 0) {
    echo json_encode(["status"=>"error","message"=>"No fields to update"]);
    exit;
}

$sql = "UPDATE patient SET " . implode(", ", $fields) . " WHERE patient_id=?";
$stmt = $conn->prepare($sql);
$params[] = (int)$patient_id;
$types .= 'i';

$stmt->bind_param($types, ...$params);
$stmt->execute();

echo json_encode(["status"=>"success"]);
