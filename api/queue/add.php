<?php
/**
 * Adds a patient to the queue as waiting. Accepts department_id and patient_id or patient_number.
 * Assigns next queue_number for the department. Used by: staff dashboard "Create Queue Entry".
 */
require_once("../config.php");

$department_id  = $_POST['department_id'] ?? null;
$patient_number = trim($_POST['patient_number'] ?? '');
$patient_id_post = $_POST['patient_id'] ?? null;

if (!$department_id || ($patient_number === '' && !$patient_id_post)) {
    echo json_encode([
        "status"  => "error",
        "message" => "Department ID and Patient Number or Patient ID are required"
    ]);
    exit;
}

/* Resolve patient_id either from provided patient_id or by patient_number */
if ($patient_id_post) {
    $patient_id = (int)$patient_id_post;
    // verify exists
    $check = $conn->prepare("SELECT patient_id FROM patient WHERE patient_id=? LIMIT 1");
    $check->bind_param("i", $patient_id);
    $check->execute();
    $cres = $check->get_result();
    if ($cres->num_rows === 0) {
        echo json_encode([
            "status"  => "error",
            "message" => "Patient ID not found"
        ]);
        exit;
    }
} else {
    /* Look up patient_id by patient_number */
    $lookup = $conn->prepare("SELECT patient_id FROM patient WHERE patient_number=? LIMIT 1");
    $lookup->bind_param("s", $patient_number);
    $lookup->execute();
    $res = $lookup->get_result();
    if ($res->num_rows === 0) {
        echo json_encode([
            "status"  => "error",
            "message" => "Patient number not found"
        ]);
        exit;
    }
    $patient_id = (int) $res->fetch_assoc()['patient_id'];
}

/* Generate next queue number for this department */
$stmt = $conn->prepare("
    SELECT IFNULL(MAX(queue_number),0)+1 AS next_num
    FROM queueing
    WHERE department_id=?
");
$stmt->bind_param("i", $department_id);
$stmt->execute();
$next = $stmt->get_result()->fetch_assoc()['next_num'];

/* Insert to queue row as waiting */
$ins = $conn->prepare("
    INSERT INTO queueing(queue_number, patient_id, department_id, status)
    VALUES(?, ?, ?, 'waiting')
");
$ins->bind_param("iii", $next, $patient_id, $department_id);
$ins->execute();

// Return success with new queue ID and number
echo json_encode([
    "status"       => "success",
    "queue_id"     => $conn->insert_id,
    "queue_number" => $next
]);

