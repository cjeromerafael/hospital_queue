<?php
/**
 * Returns patients with department name.
 * Supports filtering by department_id for staff segregation.
 * When GET for_queue=1: only patients NOT currently in queue (waiting/serving).
 */
require_once("../config.php");

$for_queue     = isset($_GET['for_queue']) ? trim($_GET['for_queue']) : '';
$department_id = isset($_GET['department_id']) ? (int)$_GET['department_id'] : 0;
$role          = isset($_GET['role']) ? trim($_GET['role']) : '';

$finance_depts = ["Billing - Admission", "Billing - OPD", "Cashier", "Medical Social Services Department"];

$where_clauses = [];
if ($for_queue === '1') {
    $where_clauses[] = "q.queue_id IS NULL";
}

// Admins see everything
if ($role !== 'admin' && $department_id > 0) {
    // Check if user's department is a finance department
    $stmt_dept = $conn->prepare("SELECT department_name FROM department WHERE department_id = ?");
    $stmt_dept->bind_param("i", $department_id);
    $stmt_dept->execute();
    $res_dept = $stmt_dept->get_result();
    $user_dept_name = $res_dept && ($row = $res_dept->fetch_assoc()) ? trim($row['department_name']) : '';

    $is_finance = false;
    foreach ($finance_depts as $fd) {
        if (strtolower($fd) === strtolower($user_dept_name)) {
            $is_finance = true;
            break;
        }
    }

    if ($is_finance) {
        // Finance staff see ONLY their own department
        $where_clauses[] = "p.department_id = $department_id";
    } else {
        // Main staff see ALL patients EXCEPT those in finance departments
        $placeholders = str_repeat('?,', count($finance_depts) - 1) . '?';
        $sql_finance_ids = "SELECT department_id FROM department WHERE department_name IN ($placeholders)";
        $stmt_f = $conn->prepare($sql_finance_ids);
        $stmt_f->bind_param(str_repeat('s', count($finance_depts)), ...$finance_depts);
        $stmt_f->execute();
        $res_f = $stmt_f->get_result();
        $finance_ids = [];
        while ($row_f = $res_f->fetch_assoc()) {
            $finance_ids[] = (int)$row_f['department_id'];
        }
        
        if (count($finance_ids) > 0) {
            $where_clauses[] = "p.department_id NOT IN (" . implode(",", $finance_ids) . ")";
        }
    }
}

$where_sql = count($where_clauses) > 0 ? "WHERE " . implode(" AND ", $where_clauses) : "";

if ($for_queue === '1') {
    $sql = "SELECT p.patient_id, p.patient_number, p.department_id, d.department_name
            FROM patient p
            LEFT JOIN department d ON d.department_id = p.department_id
            LEFT JOIN queueing q 
                ON q.patient_id = p.patient_id 
               AND (q.status = 'waiting' OR q.status = 'serving')
            $where_sql
            ORDER BY p.patient_id";
} else {
    $sql = "SELECT p.patient_id, p.patient_number, p.department_id, d.department_name
            FROM patient p
            LEFT JOIN department d ON d.department_id = p.department_id
            $where_sql
            ORDER BY p.patient_id";
}

$res = $conn->query($sql);
echo json_encode($res->fetch_all(MYSQLI_ASSOC));
