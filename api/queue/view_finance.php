<?php
/**
 * Returns queue for finance departments: Billing - Admission, Billing - OPD, Cashier, Medical Social Services.
 * Used in staff dashboard for finance queue view.
 */
require_once("../config.php");

$sql = "SELECT q.queue_id, q.queue_number, q.patient_id, q.status, q.department_id, p.patient_number, d.department_name
        FROM queueing q
        LEFT JOIN patient p ON p.patient_id = q.patient_id
        LEFT JOIN department d ON d.department_id = q.department_id
        WHERE d.is_finance = 1
        ORDER BY q.queue_number";

$result = $conn->query($sql);
echo json_encode($result->fetch_all(MYSQLI_ASSOC));
