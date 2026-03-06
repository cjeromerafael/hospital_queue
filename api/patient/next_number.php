<?php
/**
 * Returns the next patient_number that will be assigned for a department.
 * Expects department_id (GET or POST). Returns XXX-NNN format (e.g. LAB-001).
 * If department_id is missing, returns next_number: null so UI can show "Select department".
 */
require_once("../config.php");
require_once("../helpers/department_queue.php");

header('Content-Type: application/json');

$department_id = isset($_GET['department_id']) ? (int)$_GET['department_id'] : (isset($_POST['department_id']) ? (int)$_POST['department_id'] : 0);

if (!$department_id) {
    echo json_encode(['next_number' => null]);
    exit;
}

ensureDepartmentCodeColumn($conn);
$next_number = getNextPatientNumberForDepartment($conn, $department_id);
echo json_encode(['next_number' => $next_number]);

