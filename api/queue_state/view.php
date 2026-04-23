<?php
require_once(__DIR__ . "/queue_state_helpers.php");

try {
    requireAuth();
    ensureQueueStateTable($conn);

    $data = loadAllDepartmentsWithCurrentNumbers($conn);
    echo json_encode($data);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error"]);
}

