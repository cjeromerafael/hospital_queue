<?php
require_once("../config.php");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

session_unset();
session_destroy();
setcookie(session_name(), '', time() - 3600, '/');

echo json_encode(["status" => "success", "message" => "Logged out"]);
