<?php
/**
 * Shared helpers for department-based queue identifiers (XXX-NNN format).
 * - ensureDepartmentCodeColumn: adds department_code to department table if missing
 * - getDepartmentCode: returns 3-letter code for a department (from DB or fallback)
 * - getNextPatientNumberForDepartment: returns next patient_number for a department (e.g. LAB-001)
 */

/**
 * Ensures the department table has a department_code column. Safe to call repeatedly.
 * @param mysqli $conn
 */
function ensureDepartmentCodeColumn($conn) {
    $check = $conn->query("SHOW COLUMNS FROM department LIKE 'department_code'");
    if ($check && $check->num_rows === 0) {
        $conn->query("ALTER TABLE department ADD COLUMN department_code VARCHAR(3) DEFAULT NULL");
    }
}

/**
 * Returns 3-letter uppercase code for a department. Uses department_code if set,
 * otherwise fallback: first 3 letters of first word of department_name, or D + zero-padded id.
 * @param mysqli $conn
 * @param int $department_id
 * @return string
 */
function getDepartmentCode($conn, $department_id) {
    $stmt = $conn->prepare("SELECT department_id, department_name, department_code FROM department WHERE department_id = ?");
    $stmt->bind_param("i", $department_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    if (!$row) {
        return 'D' . sprintf('%02d', (int)$department_id);
    }
    $code = $row['department_code'];
    if ($code !== null && trim($code) !== '') {
        return strtoupper(substr(trim($code), 0, 3));
    }
    $name = $row['department_name'];
    if ($name !== null && trim($name) !== '') {
        $first = preg_replace('/\s+/', ' ', trim($name));
        $words = explode(' ', $first);
        $firstWord = $words[0];
        if (strlen($firstWord) >= 3) {
            return strtoupper(substr($firstWord, 0, 3));
        }
        return strtoupper(str_pad($firstWord, 3, 'X'));
    }
    return 'D' . sprintf('%02d', (int)$row['department_id']);
}

/**
 * Returns the next patient_number for the given department in format XXX-NNN (e.g. LAB-001).
 * Only considers existing patient_numbers that match the pattern XXX-NNN for this department.
 * @param mysqli $conn
 * @param int $department_id
 * @return string
 */
function getNextPatientNumberForDepartment($conn, $department_id) {
    $code = getDepartmentCode($conn, $department_id);
    $stmt = $conn->prepare("
        SELECT patient_number FROM patient
        WHERE department_id = ? AND patient_number REGEXP '^[A-Z0-9]{3}-[0-9]{3}$'
    ");
    $stmt->bind_param("i", $department_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $max = 0;
    $prefix = $code . '-';
    $prefixLen = strlen($prefix);
    while ($row = $res->fetch_assoc()) {
        $pn = $row['patient_number'];
        if (substr($pn, 0, $prefixLen) === $prefix) {
            $num = (int) substr($pn, $prefixLen);
            if ($num > $max) {
                $max = $num;
            }
        }
    }
    $next = $max + 1;
    return $code . '-' . sprintf('%03d', $next);
}
