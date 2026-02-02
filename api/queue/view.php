<?php
/**
 * Returns queue entries for a department (serving + waiting) with patient and department info.
 * Used by: staff dashboard, patient queue status, queue display screen.
 * When department_id is omitted or empty, returns all queue entries (all departments).
 */
require_once("../config.php");

$department_id = isset($_GET['department_id']) ? trim($_GET['department_id']) : '';

if ($department_id !== '') {
    $sql = "SELECT q.*, p.patient_number, p.patient_name, p.department_id AS patient_department_id, pd.department_name AS patient_department_name
            FROM queueing q
            LEFT JOIN patient p ON p.patient_id = q.patient_id
            LEFT JOIN department pd ON pd.department_id = p.department_id
            WHERE q.department_id = ?
            ORDER BY q.queue_number";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $department_id);
    $stmt->execute();
    $res = $stmt->get_result();
} else {
    $sql = "SELECT q.*, p.patient_number, p.patient_name, p.department_id AS patient_department_id, pd.department_name AS patient_department_name,
            dq.department_name AS queue_department_name
            FROM queueing q
            LEFT JOIN patient p ON p.patient_id = q.patient_id
            LEFT JOIN department pd ON pd.department_id = p.department_id
            LEFT JOIN department dq ON dq.department_id = q.department_id
            ORDER BY q.department_id, q.queue_number";
    $res = $conn->query($sql);
}

echo json_encode($res->fetch_all(MYSQLI_ASSOC));
