<?php
require_once("../config.php");

requireAuth();

echo json_encode([
    "status" => "success",
    "user_id" => $_SESSION['user_id'] ?? null,
    "username" => $_SESSION['username'] ?? null,
    "department_id" => $_SESSION['department_id'] ?? null,
    "department_role" => $_SESSION['role'] ?? null
]);
