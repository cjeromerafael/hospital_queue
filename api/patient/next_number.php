<?php
/**
 * Returns the next patient_number that will be assigned.
 * Uses the same logic as create.php: 1 + MAX(CAST(patient_number AS UNSIGNED)).
 * If there are no patients, returns 1.
 */
require_once("../config.php");

header('Content-Type: application/json');

$next = 1;
$res = $conn->query("SELECT IFNULL(MAX(CAST(patient_number AS UNSIGNED)), 0) + 1 AS next_num FROM patient");
if ($res) {
    $row = $res->fetch_assoc();
    if ($row && isset($row['next_num'])) {
        $val = (int)$row['next_num'];
        if ($val > 0) {
            $next = $val;
        }
    }
}

echo json_encode(['next_number' => $next]);

