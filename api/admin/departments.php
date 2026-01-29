<?php
require_once("../config.php");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === "GET") {
    $res = $conn->query("SELECT * FROM department");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
}

/* CREATE */
if ($method === "POST") {
    $name = $_POST['department_name'];
    $stmt = $conn->prepare("INSERT INTO department(department_name) VALUES(?)");
    $stmt->bind_param("s",$name);
    $stmt->execute();
    echo json_encode(["status"=>"success"]);
}

/* UPDATE */
if ($method === "PUT") {
    parse_str(file_get_contents("php://input"), $_PUT);
    $id = $_PUT['department_id'];
    $name = $_PUT['department_name'];

    $stmt = $conn->prepare("UPDATE department SET department_name=? WHERE department_id=?");
    $stmt->bind_param("si",$name,$id);
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
