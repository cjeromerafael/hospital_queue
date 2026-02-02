<?php
/**
 * Returns patients assigned to specific departments: Billing - Admission, Billing - OPD, Cashier, Medical Social Services.
 * Used in staff dashboard for special create queue entry.
 */
require_once("../config.php");

$sql = "SELECT p.patient_id, p.patient_number, p.patient_name, p.department_id, d.department_name
        FROM patient p
        LEFT JOIN department d ON d.department_id = p.department_id
        WHERE d.department_name IN ('Billing - Admission', 'Billing - OPD', 'Cashier', 'Medical Social Services')
        ORDER BY p.patient_number";
$res = $conn->query($sql);
echo json_encode($res->fetch_all(MYSQLI_ASSOC));
