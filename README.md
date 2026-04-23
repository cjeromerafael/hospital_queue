# Hospital Queue System

Queue management for hospital departments. Staff control queues per department (Next / Skip / Reset). The patient-facing display screen shows currently serving numbers. Admins manage departments and user accounts.

## Setup Instructions

### Prerequisites
- **Laragon** or **XAMPP** (Apache + MySQL + PHP)
- PHP 8.2+
- MySQL 8.0+
- HeidiSQL (for database import)

### Installation Steps

1. **Clone or copy the project** into your web server root:
   - Laragon: `C:\laragon\www\hospital_queue`
   - XAMPP: `C:\xampp\htdocs\hospital_queue`

2. **Database Setup**
   - Open HeidiSQL and connect to your local MySQL server
   - Create a new database named `hospital_queue`
   - Import `backup_db/hospital_queue.sql`

3. **Configure database credentials** (if different from defaults)
   - Open `api/config.php`
   - Update the `mysqli` connection at the bottom if your MySQL username, password, or host differs from `root / (no password) / localhost`
   - Do the same in `api/daily_flush_cron.php`

4. **Enable mod_rewrite (XAMPP only)**
   - Open `C:\xampp\apache\conf\httpd.conf`
   - Uncomment: `LoadModule rewrite_module modules/mod_rewrite.so`
   - Find the `<Directory "C:/xampp/htdocs">` block and change `AllowOverride None` to `AllowOverride All`

5. **Set up the virtual host** so the system is accessible at `hospitalqueue.local`

   Add the following to your vhosts config:
   - Laragon: `C:\laragon\etc\apache2\sites-enabled\hospitalqueue.local.conf`
   - XAMPP: `C:\xampp\apache\conf\extra\httpd-vhosts.conf`

   ```apache
   <VirtualHost *:80>
       ServerName hospitalqueue.local
       DocumentRoot "C:/xampp/htdocs/hospital_queue"
       <Directory "C:/xampp/htdocs/hospital_queue">
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```
   *(Replace the path with your Laragon equivalent if needed)*

6. **Add the local DNS entry**
   - Open `C:\Windows\System32\drivers\etc\hosts` as Administrator
   - Add: `127.0.0.1 hospitalqueue.local`

7. **Restart Apache** and visit `http://hospitalqueue.local`
   - `/` → Queue display screen (public, no login required)
   - `/login` → Staff login page

---

### Autonomous Daily Queue Reset (Task Scheduler)

The queue resets itself every day via `api/daily_flush_cron.php`. Schedule it through Windows Task Scheduler.

**PHP paths by stack:**

| Stack | PHP executable | Project root |
|---|---|---|
| Laragon | `C:\laragon\bin\php\php-8.x.x\php.exe` | `C:\laragon\www\hospital_queue` |
| XAMPP | `C:\xampp\php\php.exe` | `C:\xampp\htdocs\hospital_queue` |

For Laragon, confirm the exact PHP folder name by opening `C:\laragon\bin\php\` in Explorer.

**Task Scheduler setup:**

1. Open **Task Scheduler** → **Create Basic Task**
2. Name: `Hospital Queue Daily Reset`
3. Trigger: **Daily** at `00:00` (midnight)
4. Action: **Start a program**
   - Program: *(PHP path from table above)*
   - Arguments: *(project root)*`\api\daily_flush_cron.php`
5. Save and confirm the task is enabled

**XAMPP example:**
```
Program:   C:\xampp\php\php.exe
Arguments: C:\xampp\htdocs\hospital_queue\api\daily_flush_cron.php
```

**Laragon example:**
```
Program:   C:\laragon\bin\php\php-8.2.x\php.exe
Arguments: C:\laragon\www\hospital_queue\api\daily_flush_cron.php
```

**To verify**, run manually in Command Prompt:
```
& "C:\xampp\php\php.exe" C:\xampp\htdocs\hospital_queue\api\daily_flush_cron.php
```
Expected output: `[daily_flush] Queue reset complete for YYYY-MM-DD`

---

### Troubleshooting
- **500 error on root URL** — `mod_rewrite` is not enabled or `AllowOverride All` is not set. See step 4.
- **Login page shows instead of display** — Check that the virtual host `DocumentRoot` points to the project root, not the `public/` subfolder.
- **Database connection failed** — Ensure MySQL is running and credentials in `api/config.php` match your setup.
- **User creation fails** — Check that `department_id` assignments are valid. Admin role uses the `admin` department; sysadmin uses no department.

---

## Project Structure

```
hospital_queue/
├── api/
│   ├── auth/           login, logout, session status
│   ├── admin/          department and user CRUD (sysadmin only)
│   ├── queue_state/    next, skip, reset, view (per department)
│   ├── config.php      DB connection and shared auth helpers
│   ├── daily_flush.php auto/manual daily queue reset
│   └── daily_flush_cron.php  CLI script for Task Scheduler
├── public/
│   ├── index.html      Login page (/login)
│   ├── patient/
│   │   └── display.html  Queue display screen (/)
│   ├── staff/
│   │   └── dashboard.html  Staff queue controls
│   └── admin/
│       └── dashboard.html  Admin panel (departments + users)
├── backup_db/
│   └── hospital_queue.sql  Full database schema + seed data
└── .htaccess           URL routing rules
```

## URL Routes

| URL | Page | Auth required |
|---|---|---|
| `hospitalqueue.local/` | Queue display | No |
| `hospitalqueue.local/login` | Staff login | No |
| `hospitalqueue.local/public/staff/dashboard.html` | Staff dashboard | Yes |
| `hospitalqueue.local/public/admin/dashboard.html` | Admin panel | Yes (sysadmin) |
