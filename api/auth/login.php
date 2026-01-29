<?php
require_once("../config.php");

$user_id = $_POST['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(["status"=>"error","message"=>"User ID required"]);
    exit;
}

// get first role of user (simple version)
$sql = "
SELECT r.department_id, r.department_role
FROM role r
WHERE r.user_id = ?
LIMIT 1
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode(["status"=>"error","message"=>"User not found or no role"]);
    exit;
}

$row = $res->fetch_assoc();

echo json_encode([
    "status" => "success",
    "user_id" => $user_id,
    "department_id" => $row['department_id'],
    "department_role" => $row['department_role']
]);
