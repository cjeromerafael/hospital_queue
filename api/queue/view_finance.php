<?php
/**
 * Returns queue for finance departments: Billing - Admission, Billing - OPD, Cashier, Medical Social Services.
 * Used in staff dashboard for finance queue view.
 */
require_once("../config.php");

$finance_departments = ["Billing - Admission", "Billing - OPD", "Cashier", "Medical Social Services"];

$placeholders = str_repeat('?,', count($finance_departments) - 1) . '?';
$sql = "SELECT q.queue_id, q.queue_number, q.patient_id, q.status, p.patient_number, p.patient_name, d.department_name
        FROM queueing q
        LEFT JOIN patient p ON p.patient_id = q.patient_id
        LEFT JOIN department d ON d.department_id = p.department_id
        WHERE d.department_name IN ($placeholders)
        ORDER BY q.queue_number";

$stmt = $conn->prepare($sql);
$stmt->bind_param(str_repeat('s', count($finance_departments)), ...$finance_departments);
$stmt->execute();
$result = $stmt->get_result();
echo json_encode($result->fetch_all(MYSQLI_ASSOC));
