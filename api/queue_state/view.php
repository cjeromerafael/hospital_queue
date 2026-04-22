<?php
require_once(__DIR__ . "/queue_state_helpers.php");

requireAuth();
ensureQueueStateTable($conn);

$data = loadAllDepartmentsWithCurrentNumbers($conn);
echo json_encode($data);

