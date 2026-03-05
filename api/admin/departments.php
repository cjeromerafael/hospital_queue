<?php
/**
 * Department CRUD: GET list, POST create, PUT update, DELETE. Used by: admin dashboard.
 */
require_once("../config.php");
require_once("../helpers/department_queue.php");

$method = $_SERVER['REQUEST_METHOD'];

ensureDepartmentCodeColumn($conn);

/* READ */
if ($method === "GET") {
    $res = $conn->query("SELECT * FROM department");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
}

/* CREATE */
if ($method === "POST") {
    $name = $_POST['department_name'] ?? '';
    $code = isset($_POST['department_code']) ? trim($_POST['department_code']) : null;
    if ($code !== null && $code !== '') {
        $code = strtoupper(substr($code, 0, 3));
    } else {
        $code = null;
    }
    $stmt = $conn->prepare("INSERT INTO department(department_name, department_code) VALUES(?, ?)");
    $stmt->bind_param("ss", $name, $code);
    $stmt->execute();
    echo json_encode(["status"=>"success"]);
}

/* UPDATE */
if ($method === "PUT") {
    parse_str(file_get_contents("php://input"), $_PUT);
    $id = $_PUT['department_id'];
    $name = $_PUT['department_name'];
    $code = isset($_PUT['department_code']) ? trim($_PUT['department_code']) : null;
    if ($code !== null && $code !== '') {
        $code = strtoupper(substr($code, 0, 3));
    } else {
        $code = null;
    }

    $stmt = $conn->prepare("UPDATE department SET department_name=?, department_code=? WHERE department_id=?");
    $stmt->bind_param("ssi", $name, $code, $id);
    $stmt->execute();
    echo json_encode(["status"=>"updated"]);
}

/* DELETE */
if ($method === "DELETE") {
    parse_str(file_get_contents("php://input"), $_DELETE);
    $id = $_DELETE['department_id'];

    $stmt = $conn->prepare("DELETE FROM department WHERE department_id=?");
    $stmt->bind_param("i",$id);
    $stmt->execute();
    echo json_encode(["status"=>"deleted"]);
}
