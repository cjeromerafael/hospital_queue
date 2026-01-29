<?php
require_once("../config.php");

$department_id = $_GET['department_id'];

$sql = "SELECT * FROM queueing WHERE department_id=? ORDER BY queue_number";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i",$department_id);
$stmt->execute();

$res = $stmt->get_result();
echo json_encode($res->fetch_all(MYSQLI_ASSOC));
