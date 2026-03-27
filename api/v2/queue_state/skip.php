<?php
require_once(__DIR__ . "/queue_state_helpers.php");

ensureQueueStateTable($conn);

$department_id = (int)($_POST["department_id"] ?? 0);
if (!$department_id) {
    echo json_encode(["status" => "error", "message" => "Department ID required"]);
    exit;
}

$conn->begin_transaction();
try {
    $result = advanceSkip($conn, $department_id);
    $conn->commit();
    echo json_encode(["status" => "success"] + $result);
} catch (Throwable $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

