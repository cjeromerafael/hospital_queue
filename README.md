# Hospital Queue System

Queue management for departments: staff dashboard (next/skip/create entry), patient registration, queue display, and admin (departments/users).

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
