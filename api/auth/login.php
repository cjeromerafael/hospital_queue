<?php
/**
 * Staff login by username and password. Looks up department and role; returns user info
 * for redirect to admin or staff dashboard. Used by: index.html (auth.js).
 */
require_once("../config.php");

$username = $_POST['username'] ?? null;
$password = $_POST['password'] ?? null;

if (!$username || !$password) {
    echo json_encode(["status"=>"error","message"=>"Username and password required"]);
    exit;
}

$sql = "
SELECT user_id, username, password, department_id, role
FROM user
WHERE username = ?
LIMIT 1
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode(["status"=>"error","message"=>"Invalid username or password"]);
    exit;
}

$row = $res->fetch_assoc();

// Verify password
if (!password_verify($password, $row['password'])) {
    echo json_encode(["status"=>"error","message"=>"Invalid username or password"]);
    exit;
}

echo json_encode([
    "status" => "success",
    "user_id" => $row['user_id'],
    "username" => $row['username'],
    "department_id" => $row['department_id'],
    "department_role" => $row['role']
]);
