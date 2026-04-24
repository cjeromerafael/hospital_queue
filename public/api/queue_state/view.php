<?php
// view.php is intentionally public — the queue display screen is unauthenticated.
require_once(__DIR__ . "/queue_state_helpers.php");

$data = loadAllDepartmentsWithCurrentNumbers($conn);
echo json_encode($data);

