 <?php
/**
 * User CRUD: GET list (with department name), POST create, PUT update, DELETE. Used by: admin dashboard.
 */
require_once("../config.php");

$method = $_SERVER['REQUEST_METHOD'];

/* READ */
if ($method === "GET") {
    $res = $conn->query("
        SELECT u.user_id, u.username, u.department_id, u.role, u.raw_password, d.department_name
        FROM user u
        LEFT JOIN department d ON d.department_id = u.department_id
    ");
    $users = $res->fetch_all(MYSQLI_ASSOC);
    
    // Decrypt passwords for admin visibility
    foreach ($users as &$u) {
        $dec = decrypt_password($u['raw_password']);
        if ($dec !== null) {
            $u['raw_password'] = $dec;
        }
        // If decryption fails, it's either null or old plain text.
    }
    
    echo json_encode($users);
}

/* CREATE*/
if ($method === "POST") {
    $username = $_POST['username'] ?? null;
    $password = $_POST['password'] ?? null;
    $dept     = $_POST['department_id'] ?? 0;
    $role     = $_POST['role'] ?? 'staff';

    if (!$username || !$password) {
        echo json_encode(["status" => "error", "message" => "Username and password required"]);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $encPassword = encrypt_password($password);

    $stmt = $conn->prepare("INSERT INTO user(username, password, raw_password, department_id, role) VALUES(?,?,?,?,?)");
    $stmt->bind_param("sssis", $username, $hashedPassword, $encPassword, $dept, $role);
    $stmt->execute();

    echo json_encode(["status"=>"success"]);
}

/* UPDATE */
if ($method === "PUT") {
    parse_str(file_get_contents("php://input"), $_PUT);

    $id       = $_PUT['user_id'] ?? null;
    $username = $_PUT['username'] ?? null;
    $password = $_PUT['password'] ?? null;
    $dept     = $_PUT['department_id'] ?? null;
    $role     = $_PUT['role'] ?? null;

    if (!$id) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit;
    }

    $fields = [];
    $params = [];
    $types = "";

    if ($username) { $fields[] = "username=?"; $params[] = $username; $types .= "s"; }
    if ($dept !== null) { $fields[] = "department_id=?"; $params[] = $dept; $types .= "i"; }
    if ($role) { $fields[] = "role=?"; $params[] = $role; $types .= "s"; }
    
    // Only update password if provided
    if ($password && trim($password) !== "") {
        $fields[] = "password=?";
        $params[] = password_hash($password, PASSWORD_DEFAULT);
        $types .= "s";

        $fields[] = "raw_password=?";
        $params[] = encrypt_password($password);
        $types .= "s";
    }

    if (count($fields) === 0) {
        echo json_encode(["status" => "error", "message" => "No fields to update"]);
        exit;
    }

    $sql = "UPDATE user SET " . implode(", ", $fields) . " WHERE user_id=?";
    $params[] = $id;
    $types .= "i";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    echo json_encode(["status" => "updated"]);
}

/* DELETE */
if ($method === "DELETE") {
    parse_str(file_get_contents("php://input"), $_DELETE);

    $id = $_DELETE['user_id'] ?? null;

    if (!$id) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM user WHERE user_id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    echo json_encode(["status" => "deleted"]);
}
