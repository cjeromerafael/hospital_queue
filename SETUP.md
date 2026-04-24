# Setup Guide — Hospital Queue System

## Requirements

- Laragon or XAMPP (Apache + MySQL + PHP 8.2+)
- HeidiSQL or any MySQL client

---

## 1. Copy the project

Place the `hospital_queue` folder into your web server root.

- Laragon: `C:\laragon\www\hospital_queue`
- XAMPP: `C:\xampp\htdocs\hospital_queue`

---

## 2. Import the database

1. Open HeidiSQL and connect to your MySQL server
2. Create a new database named `hospital_queue`
3. Import `backup_db/hospital_queue.sql`

---

## 3. Check database credentials

Open `public/api/config.php` and confirm the connection details match your setup. Defaults are `root` with no password on `localhost`. Do the same for `public/api/daily_flush_cron.php`.

---

## 4. Configure the virtual host

Create a config file for your chosen domain. Point the document root to the `public/` folder.

Laragon: `C:\laragon\etc\apache2\sites-enabled\your-domain.conf`

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

---

## 5. Add the domain to the hosts file

Open `C:\Windows\System32\drivers\etc\hosts` as Administrator and add:

```
127.0.0.1   your-domain.local
```

Restart Apache, then visit `http://your-domain.local` — it should open the queue display screen.

---

## 6. Allow access from other devices (phones, tablets, other PCs)

Run this in Command Prompt as Administrator to open port 80 through the firewall:

```
netsh advfirewall firewall add rule name="Apache HTTP" protocol=TCP dir=in localport=80 action=allow
```

Other devices on the same network can then access the system at:

```
http://192.168.x.x/hospital_queue/public/
```

Replace `192.168.x.x` with this machine's local IP (find it by running `ipconfig` and looking for the IPv4 address under your WiFi adapter).

---

## 7. Enable bell sound on the display screen

Browsers block audio until the user interacts with the page. On the dedicated display PC, do this once so the bell plays automatically:

1. Open Chrome or Edge
2. Go to Settings → Privacy & Security → Site Settings → Sound
3. Under "Allowed to play sound", add `your-domain.local`

After this, the bell will ring on every queue update without needing a tap.

---

## 8. Set up the daily queue reset

The queue resets automatically at midnight via `public/api/daily_flush_cron.php`. Set it up in Windows Task Scheduler:

1. Open Task Scheduler → Create Basic Task
2. Name it `Hospital Queue Daily Reset`
3. Trigger: Daily at 12:00 AM
4. Action: Start a program
   - Program: path to your PHP executable
   - Arguments: path to `daily_flush_cron.php`

Laragon example:
```
Program:   C:\laragon\bin\php\php-8.2.x\php.exe
Arguments: C:\laragon\www\hospital_queue\public\api\daily_flush_cron.php
```

To find the exact PHP folder name, check `C:\laragon\bin\php\` in Explorer.

To test it manually, run in Command Prompt:
```
"C:\laragon\bin\php\php-8.2.x\php.exe" C:\laragon\www\hospital_queue\public\api\daily_flush_cron.php
```

Expected output: `[daily_flush] Queue reset complete for YYYY-MM-DD`

> If the system was set up from a database export and queues are not resetting, check `public/api/data/last_flush_date.txt`. If it contains today's date, clear the file contents to force a reset on the next run.

---

## URLs

| Address | Page |
|---|---|
| `your-domain.local/` | Queue display (no login needed) |
| `your-domain.local/login` | Staff login |
| `your-domain.local/staff/dashboard.html` | Staff dashboard |
| `your-domain.local/admin/dashboard.html` | Admin panel |
