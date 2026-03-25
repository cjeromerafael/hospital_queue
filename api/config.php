<?php
/**
 * Shared API configuration. All API endpoints require this file.
 * Purpose: Set JSON response header and establish DB connection for hospital_queue.
 */
header("Content-Type: application/json");

// --- Encryption for Reversible Passwords (Admin Visibility) ---
// Note: This allows admins to see passwords while they're encrypted in the DB.
// Passwords are still hashed separately for authentication.
define('ENCRYPTION_KEY', 'hospital-queue-secret-key-32-chars-!!'); // Change this for production!

function encrypt_password($password) {
    if (!$password) return null;
    $iv_len = openssl_cipher_iv_length('aes-256-cbc');
    $iv = openssl_random_pseudo_bytes($iv_len);
    // Use OPENSSL_RAW_DATA to get binary output
    $encrypted = openssl_encrypt($password, 'aes-256-cbc', ENCRYPTION_KEY, OPENSSL_RAW_DATA, $iv);
    return base64_encode($iv . $encrypted);
}

function decrypt_password($data) {
    if (!$data) return null;
    $data = base64_decode($data);
    $iv_len = openssl_cipher_iv_length('aes-256-cbc');
    if (strlen($data) <= $iv_len) return null;
    $iv = substr($data, 0, $iv_len);
    $encrypted = substr($data, $iv_len);
    // Use OPENSSL_RAW_DATA to decrypt binary input
    $decrypted = openssl_decrypt($encrypted, 'aes-256-cbc', ENCRYPTION_KEY, OPENSSL_RAW_DATA, $iv);
    return $decrypted === false ? null : $decrypted;
}
// -------------------------------------------------------------

$conn = new mysqli("localhost:3307", "root", "", "hospital_queue");

if ($conn->connect_error) {
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed"
    ]);
    exit;
}
