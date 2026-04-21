# Hospital Queue System

Queue management for departments: staff dashboard (next/skip/create entry), patient registration, queue display, and admin (departments/users).

## Setup Instructions

To set up this project on a new machine and avoid environment-related issues:

### Prerequisites
- XAMPP (or similar Apache + MySQL stack)
- PHP 8.2+
- MySQL 8.0+

### Installation Steps
1. **Clone/Download the project** to your web server root (e.g., `C:\xampp\htdocs\hospital_queue`)

2. **Database Setup**
   - Start XAMPP MySQL
   - Create database: `hospital_queue`
   - Import the schema: Run `backup_db/hospital_queue_full.sql` in phpMyAdmin or MySQL command line (includes all constraints)
   - Alternative: Use `backup_db/hospital_queue.sql` for basic structure (may miss some constraints)

3. **Configuration**
   - Update `api/config.php` with your database credentials if different from localhost/root/no password
   - Change the `ENCRYPTION_KEY` for production security

4. **Access the Application**
   - Start Apache in XAMPP
   - Visit `http://localhost/hospital_queue/public/index.html`

### Development Best Practices
- **Version Control:** Use Git to track changes and avoid code conflicts
- **Database Migrations:** When schema changes, update `backup_db/hospital_queue_full.sql` and commit to Git
- **Environment Consistency:** Use the same XAMPP version across machines
- **Testing:** Test user creation/editing on a fresh database import to catch constraint issues early
- **Backup:** Regularly export the full database schema with constraints for accurate backups

### Autonomous Daily Queue Reset (Task Scheduler)

The queue resets itself every day via `api/daily_flush_cron.php`, which must be scheduled through Windows Task Scheduler on the server machine.

**Find your paths first**

The PHP executable and project root differ depending on your stack:

| Stack | PHP path | Project root |
|---|---|---|
| Laragon | `C:\laragon\bin\php\php-8.x.x\php.exe` | `C:\laragon\www\hospital_queue` |
| XAMPP | `C:\xampp\php\php.exe` | `C:\xampp\htdocs\hospital_queue` |

For Laragon, the PHP folder name includes the version (e.g. `php-8.2.x`). Open `C:\laragon\bin\php\` in Explorer to confirm the exact folder name. HeidiSQL is only a DB management GUI and does not affect these paths.

**One-time Task Scheduler setup:**

1. Open **Task Scheduler** (search for it in the Start menu)
2. Click **Create Basic Task**
3. Fill in the fields:
   - Name: `Hospital Queue Daily Reset`
   - Trigger: **Daily** at `00:00` (midnight) or just before the hospital opens
   - Action: **Start a program**
     - Program: *(your PHP path from the table above)*
     - Arguments: *(your project root from the table above)*`\api\daily_flush_cron.php`
4. Finish and confirm the task is enabled

**Laragon example:**
```
Program:   C:\laragon\bin\php\php-8.2.x\php.exe
Arguments: C:\laragon\www\hospital_queue\api\daily_flush_cron.php
```

**XAMPP example:**
```
Program:   C:\xampp\php\php.exe
Arguments: C:\xampp\htdocs\hospital_queue\api\daily_flush_cron.php
```

**To verify it works**, run the command manually in a Command Prompt:
```
"C:\laragon\bin\php\php-8.2.x\php.exe" C:\laragon\www\hospital_queue\api\daily_flush_cron.php
```
You should see: `[daily_flush] Queue reset complete for YYYY-MM-DD`

> The script also updates `api/data/last_flush_date.txt`, so the client-side flush check on staff login will correctly see that today's flush already ran and skip it.

### Troubleshooting
- If user creation fails with JSON parsing errors, check database foreign key constraints
- Ensure `department_id` assignments match your database schema (admin=22, sysadmin=null, staff=valid dept)
- Verify PHP error logs if requests fail silently

## Structure

- **public/** – Front-end: `index.html` (staff login), `admin/dashboard.html`, `staff/dashboard.html`, `patient/index.html` (queue status), `patient/register.html` (register patient), `patient/manage.html` (staff manage patients), `patient/display.html` (queue display screen).
- **public/assets/js/** – Scripts: `auth.js` (login), `admin.js` (admin CRUD), `staff.js` (queue + create entry), `patient-queue.js` (patient queue status), `patient-register.js` (register form), `patient-manage.js` (manage patients), `patient-display.js` (display screen).
- **api/** – Back-end: `config.php` (DB + JSON header), `auth/login.php`, `admin/departments.php`, `admin/users.php`, `patient/create.php`, `patient/list.php`, `patient/update.php`, `patient/delete.php`, `patient/register.php` (user-id flow; no current page), `queue/view.php`, `queue/add.php`, `queue/next.php`, `queue/skip.php`, `queue/event.php`.

## Important flows

1. **Login** – `auth.js` → `api/auth/login.php`; stores `department_id`, redirects to admin or staff dashboard.
2. **Staff queue** – `staff.js` polls `queue/view.php`, calls `queue/next.php` / `queue/skip.php` / `queue/add.php` for actions; create-queue dropdown filled from `patient/list.php`.
3. **Patient registration** – `patient/register.html` + `patient-register.js` → `patient/create.php`; `patient/manage.html` + `patient-manage.js` for staff-side list/edit/delete.
4. **Queue display** – `patient/display.html` + `patient-display.js`; department from `?dept=` or localStorage; polls `queue/view.php` and `queue/event.php` for skip banner.

Comments in each API file and JS file describe purpose and usage.
