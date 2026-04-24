<?php
/**
 * daily_flush_cron.php
 *
 * Server-side autonomous daily reset for the queue system.
 * Intended to be run by Windows Task Scheduler (or cron on Linux) once per day,
 * typically at midnight or just before the hospital opens.
 *
 * Uses the same lock file as daily_flush.php so a cron run and a simultaneous
 * staff login at midnight cannot both flush at the same time.
 *
 * SECURITY: Exits immediately if called over HTTP — CLI only.
 *
 * Usage (Laragon):
 *   "C:\laragon\bin\php\php-8.x.x\php.exe" C:\laragon\www\hospital_queue\api\daily_flush_cron.php
 *
 * Usage (XAMPP):
 *   C:\xampp\php\php.exe C:\xampp\htdocs\hospital_queue\api\daily_flush_cron.php
 */

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "CLI only"]);
    exit;
}

// Bootstrap DB connection without the HTTP-specific config side-effects.
// Default credentials work for both Laragon and XAMPP out of the box.
// If your setup differs, update these to match api/config.php.
$conn = new mysqli("localhost", "root", "", "hospital_queue");
if ($conn->connect_error) {
    fwrite(STDERR, "[daily_flush] DB connection failed: " . $conn->connect_error . PHP_EOL);
    exit(1);
}

$flush_date_file = __DIR__ . '/data/last_flush_date.txt';
$lock_file       = $flush_date_file . '.lock';
$today           = date('Y-m-d');

if (!is_dir(dirname($flush_date_file))) {
    mkdir(dirname($flush_date_file), 0755, true);
}

// Acquire the same lock used by daily_flush.php so HTTP and CLI flushes
// can never run simultaneously.
$lh = fopen($lock_file, 'c');
if (!$lh) {
    fwrite(STDERR, "[daily_flush] Could not open lock file, proceeding without lock." . PHP_EOL);
}

if ($lh) flock($lh, LOCK_EX);

// Clear the active queue state table inside a transaction.
$qs = $conn->query("SHOW TABLES LIKE 'queue_state'");
if ($qs && $qs->num_rows > 0) {
    $conn->begin_transaction();
    if (!$conn->query("DELETE FROM queue_state")) {
        $conn->rollback();
        if ($lh) { flock($lh, LOCK_UN); fclose($lh); }
        fwrite(STDERR, "[daily_flush] Failed to clear queue_state: " . $conn->error . PHP_EOL);
        exit(1);
    }
    $conn->commit();
}

$conn->close();

// Update the flush date so the HTTP flush check also knows today is done.
file_put_contents($flush_date_file, $today);

if ($lh) { flock($lh, LOCK_UN); fclose($lh); }

echo "[daily_flush] Queue reset complete for {$today}" . PHP_EOL;
exit(0);
