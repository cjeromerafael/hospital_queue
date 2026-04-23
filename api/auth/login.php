<?php
/**
 * Staff login by username and password. Looks up department and role; returns user info
 * for redirect to admin or staff dashboard. Used by: index.html (auth.js).
 *
 * Important: this endpoint must return JSON even when the DB/schema is wrong,
 * otherwise the frontend fails with "Unexpected token '<' ... is not valid JSON".
 */
header("Content-Type: application/json");
ini_set('display_errors', '0'); // Prevent HTML error output from breaking JSON parsing.
error_reporting(E_ALL);

// Capture any stray output so we can decide what to return to the client.
ob_start();

require_once("../config.php");

try {
    $username = $_POST['username'] ?? null;
    $password = $_POST['password'] ?? null;

    if (!$username || !$password) {
        ob_end_clean();
        echo json_encode(["status"=>"error","message"=>"Username and password required"]);
        exit;
    }

    $sql = "
SELECT user_id, username, password, department_id, role
FROM user
WHERE username = ?
LIMIT 1
";

    // Using bind_result() avoids mysqli->get_result() which depends on mysqlnd.
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("DB prepare failed: " . ($conn->error ?: "unknown error"));
    }

    $stmt->bind_param("s", $username);
    if (!$stmt->execute()) {
        throw new Exception("DB execute failed: " . ($stmt->error ?: $conn->error ?: "unknown error"));
    }

    $stmt->bind_result($user_id, $db_username, $password_hash, $department_id, $role);
    $fetched = $stmt->fetch();

    if (!$fetched) {
        ob_end_clean();
        echo json_encode(["status"=>"error","message"=>"Invalid username or password"]);
        exit;
    }

    // Verify password (must be bcrypt hash stored in `user.password`)
    if (!password_verify($password, $password_hash)) {
        ob_end_clean();
        echo json_encode(["status"=>"error","message"=>"Invalid username or password"]);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = $user_id;
    $_SESSION['username'] = $db_username;
    $_SESSION['department_id'] = $department_id;
    $_SESSION['role'] = $role;

    ob_end_clean();
    echo json_encode([
        "status" => "success",
        "user_id" => $user_id,
        "username" => $db_username,
        "department_id" => $department_id,
        "department_role" => $role
    ]);
} catch (Throwable $e) {
    ob_end_clean();
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ]);
}
