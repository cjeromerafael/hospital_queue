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
   - Open `public/api/config.php`
   - Update the `mysqli` connection if your MySQL username, password, or host differs from `root / (no password) / localhost`
   - Do the same in `public/api/daily_flush_cron.php`

4. **Enable mod_rewrite (XAMPP only)**
   - Open `C:\xampp\apache\conf\httpd.conf`
   - Uncomment: `LoadModule rewrite_module modules/mod_rewrite.so`
   - Find the `<Directory "C:/xampp/htdocs">` block and change `AllowOverride None` to `AllowOverride All`

5. **Set up the virtual host** so the system is accessible at your chosen domain

   Add the following to your vhosts config:
   - Laragon: `C:\laragon\etc\apache2\sites-enabled\<domain>.conf`
   - XAMPP: `C:\xampp\apache\conf\extra\httpd-vhosts.conf`

   ```apache
   <VirtualHost *:80>
       ServerName your-domain.local
       DocumentRoot "C:/laragon/www/hospital_queue/public"
       <Directory "C:/laragon/www/hospital_queue/public">
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

   > The `DocumentRoot` must point to the `public/` subfolder, not the project root.

6. **Add the local DNS entry**
   - Open `C:\Windows\System32\drivers\etc\hosts` as Administrator
   - Add: `127.0.0.1 your-domain.local`
   - For network access from other devices, add the host machine's IP instead: `192.168.x.x your-domain.local`

7. **Restart Apache** and visit `http://your-domain.local`
   - `/` → Queue display screen (public, no login required)
   - `/login` → Staff login page

---

### Network Access (Other Devices)

To access the system from phones, tablets, or other PCs on the same network:

1. Make sure Apache is listening on all interfaces — in `httpd.conf`, set `Listen 0.0.0.0:80`
2. Allow port 80 through Windows Firewall:
   ```
   netsh advfirewall firewall add rule name="Apache HTTP" protocol=TCP dir=in localport=80 action=allow
   ```
3. Access via the host machine's local IP:
   ```
   http://192.168.x.x/hospital_queue/public/
   ```

---

### Bell Sound — Browser Autoplay (Display Screen)

Browsers block audio autoplay by default. On the dedicated display PC (TV/monitor), the bell will only play after a user taps the screen once to unlock audio.

**To enable fully automatic bell playback with no tap required:**

1. Open Chrome or Edge on the display PC
2. Go to `Settings → Privacy & Security → Site Settings → Sound`
3. Under **Allowed to play sound**, add the site's domain (e.g. `your-domain.local`)

This is a one-time setup per browser. After this, the bell plays automatically on every queue update without any interaction needed.

---

### Autonomous Daily Queue Reset (Task Scheduler)

The queue resets itself every day via `public/api/daily_flush_cron.php`. Schedule it through Windows Task Scheduler.

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
   - Arguments: *(project root)*`\public\api\daily_flush_cron.php`
5. Save and confirm the task is enabled

**Laragon example:**
```
Program:   C:\laragon\bin\php\php-8.2.x\php.exe
Arguments: C:\laragon\www\hospital_queue\public\api\daily_flush_cron.php
```

**XAMPP example:**
```
Program:   C:\xampp\php\php.exe
Arguments: C:\xampp\htdocs\hospital_queue\public\api\daily_flush_cron.php
```

**To verify**, run manually in Command Prompt:
```
"C:\laragon\bin\php\php-8.2.x\php.exe" C:\laragon\www\hospital_queue\public\api\daily_flush_cron.php
```
Expected output: `[daily_flush] Queue reset complete for YYYY-MM-DD`

> **Note:** If the system is set up on a fresh database import, the daily flush may not run because it detects today's date was already recorded. To force a reset, clear the contents of `public/api/data/last_flush_date.txt`.

---

### Troubleshooting
- **500 error on root URL** — `mod_rewrite` is not enabled or `AllowOverride All` is not set. See step 4.
- **API calls failing (404)** — Ensure `DocumentRoot` points to `public/`, not the project root. The `api/` folder lives inside `public/`.
- **Database connection failed** — Ensure MySQL is running and credentials in `public/api/config.php` match your setup.
- **Bell not playing** — Tap the display screen once to unlock audio, or whitelist the domain in browser sound settings for fully automatic playback.
- **Queue not resetting overnight** — Check that the Task Scheduler task is enabled and the PHP path is correct. Also check `public/api/data/last_flush_date.txt` for the last recorded flush date.

---

## Project Structure

```
hospital_queue/
├── public/
│   ├── index.html          Login page (/login)
│   ├── .htaccess           URL routing rules
│   ├── api/
│   │   ├── auth/           login, logout, session status
│   │   ├── admin/          department and user CRUD (sysadmin only)
│   │   ├── queue_state/    next, skip, reset, view (per department)
│   │   ├── config.php      DB connection and shared auth helpers
│   │   ├── daily_flush.php auto/manual daily queue reset
│   │   └── daily_flush_cron.php  CLI script for Task Scheduler
│   ├── patient/
│   │   └── display.html    Queue display screen (/)
│   ├── staff/
│   │   └── dashboard.html  Staff queue controls
│   └── admin/
│       └── dashboard.html  Admin panel (departments + users)
├── backup_db/
│   └── hospital_queue.sql  Full database schema + seed data
└── .htaccess               Legacy (not used when DocumentRoot is public/)
```

## URL Routes

| URL | Page | Auth required |
|---|---|---|
| `your-domain.local/` | Queue display | No |
| `your-domain.local/login` | Staff login | No |
| `your-domain.local/staff/dashboard.html` | Staff dashboard | Yes |
| `your-domain.local/admin/dashboard.html` | Admin panel | Yes (sysadmin) |
