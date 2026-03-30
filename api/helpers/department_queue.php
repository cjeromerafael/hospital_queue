<?php
/**
 * Shared helpers for the active department workflow.
 * - ensureDepartmentColorColumn: adds department_color to department table if missing
 */

/**
 * Ensures the department table has a department_color column. Safe to call repeatedly.
 * @param mysqli $conn
 */
function ensureDepartmentColorColumn($conn) {
    $check = $conn->query("SHOW COLUMNS FROM department LIKE 'department_color'");
    if ($check && $check->num_rows === 0) {
        $conn->query("ALTER TABLE department ADD COLUMN department_color VARCHAR(7) DEFAULT '#3b82f6'");
    }
}
