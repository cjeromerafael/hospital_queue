<?php
/**
 * Shared API configuration. All API endpoints require this file.
 * Purpose: Set JSON response header and establish DB connection for hospital_queue.
 */
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "hospital_queue");

if ($conn->connect_error) {
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed"
    ]);
    exit;
}
