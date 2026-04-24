<?php
/**
 * User CRUD: GET list, POST create, PUT update, DELETE.
 * Used by: public/admin/dashboard.html (admin.js).
 */
require_once("../config.php");

requireAuth();
requireRole(['sysadmin']);

$method = $_SERVER['REQUEST_METHOD'];
$ALLOWED_ROLES = ['staff', 'admin', 'sysadmin'];

/* READ */
if ($method === "GET") {
    $res = $conn->query("
        SELECT u.user_id, u.username, u.department_id, u.role, d.department_name
        FROM user u
        LEFT JOIN department d ON d.department_id = u.department_id
        ORDER BY u.user_id ASC
    ");
    echo json_encode($res ? $res->fetch_all(MYSQLI_ASSOC) : []);
    exit;
}

/* CREATE */
if ($method === "POST") {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $dept     = (int)($_POST['department_id'] ?? 0);
    $role     = trim($_POST['role'] ?? 'staff');

    if (!$username || !$password) {
        echo json_encode(["status" => "error", "message" => "Username and password required"]);
        exit;
    }
    if (!in_array($role, $ALLOWED_ROLES, true)) {
        echo json_encode(["status" => "error", "message" => "Invalid role"]);
        exit;
    }

    $dept = $dept === 0 ? null : $dept;

    $check = $conn->prepare("SELECT user_id FROM user WHERE username = ? LIMIT 1");
    $check->bind_param("s", $username);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "Username already exists"]);
        exit;
    }
    $check->close();

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO user (username, password, department_id, role) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssis", $username, $hash, $dept, $role);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "user_id" => $conn->insert_id]);
    } else {
        echo json_encode(["status" => "error", "message" => "Insert failed: " . $stmt->error]);
    }
    exit;
}

/* UPDATE */
if ($method === "PUT") {
    parse_str(file_get_contents("php://input"), $_PUT);

    $id       = (int)($_PUT['user_id'] ?? 0);
    $username = trim($_PUT['username'] ?? '');
    $password = trim($_PUT['password'] ?? '');
    $dept     = isset($_PUT['department_id']) ? (int)$_PUT['department_id'] : null;
    $role     = trim($_PUT['role'] ?? '');

    if (!$id) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit;
    }
    if ($role !== '' && !in_array($role, $ALLOWED_ROLES, true)) {
        echo json_encode(["status" => "error", "message" => "Invalid role"]);
        exit;
    }

    $dept = ($dept === 0) ? null : $dept;

    $fields = [];
    $params = [];
    $types  = "";

    if ($username !== '') { $fields[] = "username=?";      $params[] = $username; $types .= "s"; }
    if ($dept !== null)   { $fields[] = "department_id=?"; $params[] = $dept;     $types .= "i"; }
    if ($role !== '')     { $fields[] = "role=?";          $params[] = $role;     $types .= "s"; }

    if ($password !== '') {
        $hash     = password_hash($password, PASSWORD_DEFAULT);
        $fields[] = "password=?";
        $params[] = $hash;
        $types   .= "s";
    }

    if (count($fields) === 0) {
        echo json_encode(["status" => "error", "message" => "No fields to update"]);
        exit;
    }

    $params[] = $id;
    $types   .= "i";
    $stmt = $conn->prepare("UPDATE user SET " . implode(", ", $fields) . " WHERE user_id=?");
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Update failed: " . $stmt->error]);
    }
    exit;
}

/* DELETE */
if ($method === "DELETE") {
    parse_str(file_get_contents("php://input"), $_DELETE);
    $id = (int)($_DELETE['user_id'] ?? 0);

    if (!$id) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM user WHERE user_id=?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Delete failed: " . $stmt->error]);
    }
    exit;
}

echo json_encode(["status" => "error", "message" => "Method not allowed"]);
