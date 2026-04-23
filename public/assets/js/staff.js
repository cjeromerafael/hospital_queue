/**
 * Staff dashboard:
 * - One card per department (4-column responsive grid).
 * - Polls queue_state view for current numbers.
 * - Buttons: Next / Skip / Reset.
 * - Permission: each account can only see and control their own department.
 *   role="admin" is the master staff account — sees and controls all departments.
 *   role="sysadmin" is redirected to the admin dashboard at login (handled in auth.js).
 */

async function redirectToLogin() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("department_id");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    window.location.href = "../index.html";
}

function backToAdminDashboard() {
    window.location.href = "../admin/dashboard.html";
}

const bellAudio = new Audio("../assets/bell.ogg");
bellAudio.preload = "auto";

async function fetchAuthStatus() {
    try {
        const res = await fetch("../../api/auth/status.php", { credentials: "same-origin" });
        if (res.status === 401) {
            redirectToLogin();
            return null;
        }
        const data = await res.json();
        if (data.status !== "success") {
            redirectToLogin();
            return null;
        }
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("username", data.username || "");
        localStorage.setItem("department_id", data.department_id || "");
        localStorage.setItem("role", data.department_role || "");
        return data;
    } catch (err) {
        console.error("Auth check failed:", err);
        redirectToLogin();
        return null;
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    const auth = await fetchAuthStatus();
    if (!auth) return;
    const deptIdRaw = String(auth.department_id || localStorage.getItem("department_id") || "0");
    const role = auth.department_role || localStorage.getItem("role") || "";
    const deptId = parseInt(deptIdRaw || "0", 10);
    const username = auth.username || localStorage.getItem("username") || "";

    // Allow sysadmins to access staff dashboard with admin_override parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminOverride = urlParams.get('admin_override') === '1';

    if (role.toLowerCase() === "sysadmin" && !isAdminOverride) {
        window.location.href = "../admin/dashboard.html";
        return;
    }

    const userInfoDisplay = document.getElementById("userInfoDisplay");
    if (!role) {
        if (userInfoDisplay) userInfoDisplay.textContent = "Please log in to access this page.";
        return;
    }

    // For sysadmins in admin override mode, allow access to all departments
    if (role.toLowerCase() === "sysadmin" && isAdminOverride) {
        const backBtn = document.getElementById("backToAdminBtn");
        if (backBtn) backBtn.style.display = "flex";
        checkDailyFlush(); // fire and forget
        loadDepartmentsAndRender(0, "admin");
        if (userInfoDisplay) {
            userInfoDisplay.textContent = `${username} (Admin Override - All Departments)`;
        }
        return;
    }

    if (!deptId) {
        if (userInfoDisplay) userInfoDisplay.textContent = "No department assigned. Please contact administrator.";
        return;
    }

    if (userInfoDisplay && username) {
        (async () => {
            const deptName = await getDepartmentName(deptId);
            userInfoDisplay.textContent = deptName
                ? `Logged in as: ${username} (${deptName})`
                : `Logged in as: ${username}`;
        })();
    }

    checkDailyFlush(); // fire and forget — don't block rendering on flush check
    loadDepartmentsAndRender(deptId, role);

    // Live clock — updates every second
    function updateDashboardClock() {
        const dateEl = document.getElementById("currentDateDisplay");
        if (!dateEl) return;
        const d = new Date();
        const date = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
        const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        dateEl.textContent = `${date} ${time}`;
    }
    updateDashboardClock();
    setInterval(updateDashboardClock, 1000);
});

async function checkDailyFlush() {
    try {
        const res = await fetch("../../api/daily_flush.php", { credentials: "same-origin" });
        if (res.status === 401) { return redirectToLogin(); }
        await res.json();
    } catch (e) {
        // Non-fatal: queue endpoints will still work.
        console.warn("Daily flush check failed:", e);
    }
}

async function getDepartmentName(departmentId) {
    if (!departmentId) return "";
    try {
        const res = await fetch("../../api/admin/departments.php", { credentials: "same-origin" });
        if (res.status === 401) { redirectToLogin(); return ""; }
        const departments = await res.json();
        if (!Array.isArray(departments)) return "";
        const dept = departments.find(d => Number(d.department_id) === Number(departmentId));
        return dept ? dept.department_name : "";
    } catch (err) {
        console.error("Failed to fetch department name:", err);
        return "";
    }
}

function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
}

async function loadDepartmentsAndRender(userDeptId, role) {
    const grid = document.getElementById("deptGrid");
    if (!grid) return;

    // admin = master staff account, sees and controls all departments
    const isPrivileged = role === "admin";

    try {
        const res = await fetch("../../api/admin/departments.php");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const departments = await res.json();
        
        const filtered = (Array.isArray(departments) ? departments : []).filter(d => {
            if (!d) return false;
            if ((d.department_name || "").trim().toLowerCase() === "admin") return false;
            if (!isPrivileged && Number(d.department_id) !== Number(userDeptId)) return false;
            return true;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #999;">
                No departments available.
            </div>`;
            return;
        }

        // Pre-render cards. Numbers will be filled by polling.
        grid.innerHTML = "";
        filtered.forEach(d => {
            const canControl = isPrivileged || (Number(d.department_id) === Number(userDeptId));

            const card = document.createElement("div");
            card.className = "ios-card dept-card";
            card.dataset.departmentId = String(d.department_id);

            const badgeText = Number(d.is_finance) === 1 ? "FINANCE" : "MEDICAL";
            const badgeClass = Number(d.is_finance) === 1 ? "bg-red-50 text-red-700 border-red-100" : "bg-blue-50 text-blue-700 border-blue-100";
            const deptColor = (d.department_color || "#062e6f").toLowerCase();

            card.style.setProperty('--dept-color', deptColor);
            card.innerHTML = `
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                        <div class="text-base font-extrabold text-white dept-name-text-shadow line-clamp-2" title="${escapeHtml(d.department_name)}">
                            ${escapeHtml(d.department_name)}
                        </div>
                    </div>
                    <span class="inline-flex items-center px-2 py-1 rounded-full border ${badgeClass} text-[11px] font-black tracking-widest flex-shrink-0">
                        ${badgeText}
                    </span>
                </div>

                <div class="queue-number" id="queue_num_${d.department_id}">0</div>

                <div class="flex flex-wrap gap-2 mt-auto">
                    <button
                        class="btn-ios btn-ios-primary action-next"
                        data-action="next"
                        data-department-id="${d.department_id}"
                        ${canControl ? "" : "disabled"}
                    >Call Next</button>
                    <button
                        class="btn-ios btn-ios-danger action-skip"
                        data-action="skip"
                        data-department-id="${d.department_id}"
                        ${canControl ? "" : "disabled"}
                    >Skip Current</button>
                    <button
                        class="btn-ios btn-ios-secondary action-reset"
                        data-action="reset"
                        data-department-id="${d.department_id}"
                        ${canControl ? "" : "disabled"}
                    >Reset</button>
                </div>
            `;

            grid.appendChild(card);
        });

        // Setup event listeners
        grid.addEventListener("click", async (e) => {
            const btn = e.target.closest("button[data-action][data-department-id]");
            if (!btn || btn.disabled) return;

            const action = btn.dataset.action;
            const departmentId = parseInt(btn.dataset.departmentId, 10);
            if (!departmentId || Number.isNaN(departmentId)) return;

            btn.disabled = true;
            const btnOriginalText = btn.textContent;
            btn.textContent = "Please wait...";

            try {
                const endpoint = `../../api/queue_state/${action}.php`;
                const f = new FormData();
                f.append("department_id", departmentId);
                const r = await fetch(endpoint, { method: "POST", body: f });
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const d = await r.json();
                if (d && d.status === "success") {
                    const numEl = document.getElementById(`queue_num_${departmentId}`);
                    if (numEl && typeof d.current_number !== "undefined") {
                        numEl.textContent = String(d.current_number);
                    }
                    if (action === "next" || action === "skip") {
                        bellAudio.currentTime = 0;
                        bellAudio.play().catch(() => {});
                    }
                } else {
                    console.warn("Action failed:", d);
                    alert((d && d.message) ? d.message : "Action failed. Check your connection.");
                }
            } catch (err) {
                console.error("Action error:", err);
                alert("Action failed. Check your internet connection.");
            } finally {
                btn.textContent = btnOriginalText;
                const card = btn.closest(".ios-card.dept-card");
                const cardDeptId = card ? parseInt(card.dataset.departmentId, 10) : 0;
                const canControlNow = isPrivileged || (Number(cardDeptId) === Number(userDeptId));
                btn.disabled = !canControlNow;
            }
        }, { passive: true });

        // Initial poll + interval refresh.
        await refreshNumbers();
        setInterval(refreshNumbers, 1500);
    } catch (err) {
        console.error("Failed to load departments:", err);
        grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #c62828; font-size: 16px;">
            📡 Cannot connect to server<br>
            <span style="font-size: 14px; color: #999;">Please check your internet connection</span>
        </div>`;
    }
}

async function refreshNumbers() {
    const grid = document.getElementById("deptGrid");
    if (!grid) return;

    try {
        const r = await fetch("../../api/queue_state/view.php?_=" + Date.now(), { credentials: "same-origin" });

        if (r.status === 401) {
            return redirectToLogin();
        }

        const data = await r.json();
        if (!Array.isArray(data)) return;

        data.forEach(d => {
            const el = document.getElementById(`queue_num_${d.department_id}`);
            if (!el) return;
            const currentNum = (typeof d.current_number !== "undefined" && d.current_number !== null)
                ? d.current_number
                : 0;
            el.textContent = String(currentNum);
        });
    } catch (err) {
        console.error("Failed to refresh queue numbers:", err);
    }
}