<?php
require_once("../config.php");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === "GET") {
    $res = $conn->query("SELECT * FROM user");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
}

if ($method === "POST") {
    $name = $_POST['name'];
    $dept = $_POST['department_id'];

    $stmt = $conn->prepare("INSERT INTO user(name, department_id) VALUES(?,?)");
    $stmt->bind_param("si",$name,$dept);
    $stmt->execute();

    echo json_encode(["status"=>"success"]);
}

/* UPDATE */
if ($method === "PUT") {
    parse_str(file_get_contents("php://input"), $_PUT);

    $id   = $_PUT['user_id'] ?? null;
    $name = $_PUT['name'] ?? null;
    $dept = $_PUT['department_id'] ?? null;

    if (!$id || !$name || !$dept) {
        echo json_encode(["status" => "error", "message" => "Missing fields"]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE user SET name=?, department_id=? WHERE user_id=?");
    $stmt->bind_param("sii", $name, $dept, $id);
    $stmt->execute();

    echo json_encode(["status" => "updated"]);
}

/* DELETE */
if ($method === "DELETE") {
    parse_str(file_get_contents("php://input"), $_DELETE);

    $id = $_DELETE['user_id'] ?? null;

    if (!$id) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM user WHERE user_id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    echo json_encode(["status" => "deleted"]);
}
