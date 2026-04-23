<?php
/**
 * Shared API configuration. All API endpoints require this file.
 * Purpose: Set JSON response header and establish DB connection for hospital_queue.
 */
header("Content-Type: application/json");

// Secure session handling for API auth
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
session_name('hospital_queue_session');
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function isLoggedIn() {
    return !empty($_SESSION['user_id']);
}

function requireAuth() {
    if (!isLoggedIn()) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Authentication required"]);
        exit;
    }
}

function requireRole(array $allowedRoles) {
    requireAuth();
    $currentRole = strtolower(trim($_SESSION['role'] ?? ''));
    $allowed = array_map('strtolower', $allowedRoles);
    if (!in_array($currentRole, $allowed, true)) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Forbidden"]);
        exit;
    }
}

function requireDepartmentAccess(int $departmentId) {
    requireAuth();
    $role = strtolower(trim($_SESSION['role'] ?? ''));
    if ($role === 'admin' || $role === 'sysadmin') {
        return;
    }

    $ownDepartmentId = (int)($_SESSION['department_id'] ?? 0);
    if ($ownDepartmentId !== $departmentId) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Forbidden"]);
        exit;
    }
}

function getAuthUserId() {
    return $_SESSION['user_id'] ?? null;
}

function getAuthRole() {
    return $_SESSION['role'] ?? null;
}

function getAuthDepartmentId() {
    return $_SESSION['department_id'] ?? null;
}

// --- Encryption for Reversible Passwords (Admin Visibility) ---
// Note: This allows admins to see passwords while they're encrypted in the DB.
// Passwords are still hashed separately for authentication.
define('ENCRYPTION_KEY', 'hospital-queue-secure-key-32-chars!!!');

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

$conn = new mysqli("localhost", "root", "", "hospital_queue");

if ($conn->connect_error) {
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed"
    ]);
    exit;
}
