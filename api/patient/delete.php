<?php
/**
 * Deletes a patient by patient_id. Used in patient manage page (delete button).
 */
require_once("../config.php");

$patient_id = $_POST['patient_id'] ?? null;
if (!$patient_id) {
    echo json_encode(["status"=>"error","message"=>"patient_id required"]);
    exit;
}

$stmt = $conn->prepare("DELETE FROM patient WHERE patient_id=?");
$stmt->bind_param("i", $patient_id);
$stmt->execute();

echo json_encode(["status"=>"success"]);
