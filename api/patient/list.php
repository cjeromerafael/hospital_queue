<?php
/**
 * Returns all patients with department name for dropdowns and lists.
 * Used in staff dashboard (create queue dropdown), patient manage page.
 */
require_once("../config.php");

$sql = "SELECT p.patient_id, p.patient_number, p.patient_name, p.department_id, d.department_name
        FROM patient p
        LEFT JOIN department d ON d.department_id = p.department_id
        ORDER BY p.patient_id";
$res = $conn->query($sql);
echo json_encode($res->fetch_all(MYSQLI_ASSOC));
