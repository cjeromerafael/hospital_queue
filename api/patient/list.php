<?php
/**
 * Returns patients with department name.
 * Default: all patients (used by patient manage page).
 * When GET for_queue=1: only patients NOT currently in queue (waiting/serving),
 * used by staff dashboard create queue dropdown.
 */
require_once("../config.php");

$for_queue = isset($_GET['for_queue']) ? trim($_GET['for_queue']) : '';

if ($for_queue === '1') {
    $sql = "SELECT p.patient_id, p.patient_number, p.patient_name, p.department_id, d.department_name
            FROM patient p
            LEFT JOIN department d ON d.department_id = p.department_id
            LEFT JOIN queueing q 
                ON q.patient_id = p.patient_id 
               AND (q.status = 'waiting' OR q.status = 'serving')
            WHERE q.queue_id IS NULL
            ORDER BY p.patient_id";
    $res = $conn->query($sql);
} else {
    $sql = "SELECT p.patient_id, p.patient_number, p.patient_name, p.department_id, d.department_name
            FROM patient p
            LEFT JOIN department d ON d.department_id = p.department_id
            ORDER BY p.patient_id";
    $res = $conn->query($sql);
}

echo json_encode($res->fetch_all(MYSQLI_ASSOC));
