<?php
/**
 * Completes current serving: removes it from queue, promotes next waiting to serving.
 * Used by: staff dashboard "Next (Complete Current)".
 */
require_once("../config.php");

$department_id = $_POST['department_id'];

/* Find current serving */
$current = $conn->query("
SELECT queue_id FROM queueing
WHERE department_id=$department_id AND status='serving'
ORDER BY queue_number LIMIT 1
");

if ($current && $current->num_rows > 0) {
    $current_id = $current->fetch_assoc()['queue_id'];

    /* remove completed queue from table */
    $conn->query("DELETE FROM queueing WHERE queue_id=$current_id");
}

/* get next waiting */
$res = $conn->query("
SELECT queue_id FROM queueing
WHERE department_id=$department_id AND status='waiting'
ORDER BY queue_number LIMIT 1
");

if($res->num_rows==0){
    echo json_encode(["status"=>"empty"]);
    exit;
}

$id = $res->fetch_assoc()['queue_id'];

/* set as serving */
$conn->query("UPDATE queueing SET status='serving' WHERE queue_id=$id");

echo json_encode(["status"=>"success","queue_id"=>$id]);
