<?php
/**
 * Returns patients assigned to specific departments used for finance queues:
 * Billing - Admission, Billing - OPD, Cashier, Medical Social Services Department.
 * Only patients NOT currently in queue (waiting/serving) are returned.
 * Supports filtering by department_id for staff segregation.
 */
require_once("../config.php");

$department_id = isset($_GET['department_id']) ? (int)$_GET['department_id'] : 0;
$role          = isset($_GET['role']) ? trim($_GET['role']) : '';

$where_clauses = ["q.queue_id IS NULL", "d.department_name IN ('Billing - Admission', 'Billing - OPD', 'Cashier', 'Medical Social Services Department')"];

// Admins see everything, but staff only see their own department's patients
if ($role !== 'admin' && $department_id > 0) {
    $where_clauses[] = "p.department_id = $department_id";
}

$where_sql = "WHERE " . implode(" AND ", $where_clauses);

$sql = "SELECT p.patient_id, p.patient_number, p.department_id, d.department_name
        FROM patient p
        LEFT JOIN department d ON d.department_id = p.department_id
        LEFT JOIN queueing q 
            ON q.patient_id = p.patient_id 
           AND (q.status = 'waiting' OR q.status = 'serving')
        $where_sql
        ORDER BY p.patient_id";
$res = $conn->query($sql);
echo json_encode($res->fetch_all(MYSQLI_ASSOC));
