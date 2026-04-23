<?php
/**
 * Department CRUD: GET list, POST create, PUT update, DELETE.
 * Used by: admin dashboard.
 */
require_once("../config.php");

requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== "GET") {
    requireRole(['sysadmin']);
}

/* READ */
if ($method === "GET") {
    $res = $conn->query("SELECT * FROM department");
    echo json_encode($res ? $res->fetch_all(MYSQLI_ASSOC) : []);
    exit;
}

/* CREATE */
if ($method === "POST") {
    $name  = trim($_POST['department_name'] ?? '');
    $color = trim($_POST['department_color'] ?? '#3b82f6');

    if (!$name) {
        echo json_encode(["status" => "error", "message" => "Department name required"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO department(department_name, department_color) VALUES(?, ?)");
    $stmt->bind_param("ss", $name, $color);
    $stmt->execute();
    echo json_encode(["status" => "success"]);
    exit;
}

/* UPDATE */
if ($method === "PUT") {
    parse_str(file_get_contents("php://input"), $_PUT);
    $id    = (int)($_PUT['department_id'] ?? 0);
    $name  = trim($_PUT['department_name'] ?? '');
    $color = trim($_PUT['department_color'] ?? '#3b82f6');

    if (!$id || !$name) {
        echo json_encode(["status" => "error", "message" => "Department ID and name required"]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE department SET department_name=?, department_color=? WHERE department_id=?");
    $stmt->bind_param("ssi", $name, $color, $id);
    $stmt->execute();
    echo json_encode(["status" => "success"]);
    exit;
}

/* DELETE */
if ($method === "DELETE") {
    parse_str(file_get_contents("php://input"), $_DELETE);
    $id = (int)($_DELETE['department_id'] ?? 0);

    if (!$id) {
        echo json_encode(["status" => "error", "message" => "Department ID required"]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM department WHERE department_id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(["status" => "success"]);
    exit;
}

echo json_encode(["status" => "error", "message" => "Method not allowed"]);
