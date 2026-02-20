<?php
/**
 * Returns patients assigned to specific departments used for finance queues:
 * Billing - Admission, Billing - OPD, Cashier, Medical Social Services Department.
 * Only patients NOT currently in queue (waiting/serving) are returned.
 */
require_once("../config.php");

$sql = "SELECT p.patient_id, p.patient_number, p.patient_name, p.department_id, d.department_name
        FROM patient p
        LEFT JOIN department d ON d.department_id = p.department_id
        LEFT JOIN queueing q 
            ON q.patient_id = p.patient_id 
           AND (q.status = 'waiting' OR q.status = 'serving')
        WHERE q.queue_id IS NULL
          AND d.department_name IN ('Billing - Admission', 'Billing - OPD', 'Cashier', 'Medical Social Services Department')
        ORDER BY p.patient_id";
$res = $conn->query($sql);
echo json_encode($res->fetch_all(MYSQLI_ASSOC));
