<?php
/**
 * Department CRUD: GET list, POST create, PUT update, DELETE. Used by: admin dashboard.
 */
require_once("../config.php");
require_once("../helpers/department_queue.php");

$method = $_SERVER['REQUEST_METHOD'];

ensureDepartmentCodeColumn($conn);
ensureDepartmentColorColumn($conn);

/* READ */
if ($method === "GET") {
    $res = $conn->query("SELECT * FROM department");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
}

/* CREATE */
if ($method === "POST") {
    $name  = $_POST['department_name'] ?? '';
    $code  = isset($_POST['department_code']) ? trim($_POST['department_code']) : null;
    $is_finance = isset($_POST['is_finance']) ? (int)$_POST['is_finance'] : 0;
    $color = isset($_POST['department_color']) ? trim($_POST['department_color']) : '#3b82f6';

    if ($code !== null && $code !== '') {
        $code = strtoupper(substr($code, 0, 3));
    } else {
        $code = null;
    }

    // Types: s=name, s=code, i=is_finance, s=color  ← correct order
    $stmt = $conn->prepare("INSERT INTO department(department_name, department_code, is_finance, department_color) VALUES(?, ?, ?, ?)");
    $stmt->bind_param("ssis", $name, $code, $is_finance, $color);
    $stmt->execute();
    echo json_encode(["status" => "success"]);
}

/* UPDATE */
if ($method === "PUT") {
    parse_str(file_get_contents("php://input"), $_PUT);
    $id         = (int)($_PUT['department_id'] ?? 0);
    $name       = $_PUT['department_name'] ?? '';
    $code       = isset($_PUT['department_code']) ? trim($_PUT['department_code']) : null;
    $is_finance = isset($_PUT['is_finance']) ? (int)$_PUT['is_finance'] : 0;
    $color      = isset($_PUT['department_color']) ? trim($_PUT['department_color']) : '#3b82f6';

    if ($code !== null && $code !== '') {
        $code = strtoupper(substr($code, 0, 3));
    } else {
        $code = null;
    }

    // Types: s=name, s=code, i=is_finance, s=color, i=id  ← fixed (was "sssii" before)
    $stmt = $conn->prepare("UPDATE department SET department_name=?, department_code=?, is_finance=?, department_color=? WHERE department_id=?");
    $stmt->bind_param("ssisi", $name, $code, $is_finance, $color, $id);
    $stmt->execute();
    echo json_encode(["status" => "updated"]);
}

/* DELETE */
if ($method === "DELETE") {
    parse_str(file_get_contents("php://input"), $_DELETE);
    $id = (int)($_DELETE['department_id'] ?? 0);

    $stmt = $conn->prepare("DELETE FROM department WHERE department_id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(["status" => "deleted"]);
}