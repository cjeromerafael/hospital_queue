/**
 * Staff dashboard v2:
 * - One card per department (4-column responsive grid).
 * - Polls queue_state view for current numbers.
 * - Buttons: Next / Skip / Reset.
 * - Permission: each account can only see and control their own department.
 *   role="admin" is the master staff account — sees and controls all departments.
 *   role="sysadmin" is redirected to the admin dashboard at login (handled in auth.js).
 */

document.addEventListener("DOMContentLoaded", function() {
    const deptIdRaw = localStorage.getItem("department_id");
    const role = localStorage.getItem("role") || "";
    const deptId = parseInt(deptIdRaw || "0", 10);
    const username = localStorage.getItem("username") || "";

    const userInfoDisplay = document.getElementById("userInfoDisplay");
    const currentDateDisplay = document.getElementById("currentDateDisplay");

    if (!deptId || !role) {
        if (userInfoDisplay) userInfoDisplay.textContent = "Please log in to access this page.";
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

    checkDailyFlush().then(() => {
        loadDepartmentsAndRender(deptId, role);
    });

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
        await fetch("../../api/daily_flush.php");
    } catch (e) {
        // Non-fatal: the v2 endpoints will still work.
        console.warn("Daily flush check failed:", e);
    }
}

async function getDepartmentName(departmentId) {
    if (!departmentId) return "";
    try {
        const res = await fetch("../../api/admin/departments.php");
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

    const departments = await fetch("../../api/admin/departments.php").then(r => r.json()).catch(() => []);
    const filtered = (Array.isArray(departments) ? departments : []).filter(d => {
        if (!d) return false;
        if ((d.department_name || "").trim().toLowerCase() === "admin") return false;
        if (!isPrivileged && Number(d.department_id) !== Number(userDeptId)) return false;
        return true;
    });

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
                <div class="min-w-0">
                    <div class="text-base font-extrabold text-white truncate dept-name-text-shadow" title="${escapeHtml(d.department_name)}">
                        ${escapeHtml(d.department_name)}
                    </div>
                </div>
                <span class="inline-flex items-center px-2 py-1 rounded-full border ${badgeClass} text-[11px] font-black tracking-widest">
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
                >Next</button>
                <button
                    class="btn-ios btn-ios-danger action-skip"
                    data-action="skip"
                    data-department-id="${d.department_id}"
                    ${canControl ? "" : "disabled"}
                >Skip</button>
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
            const endpoint = `../../api/v2/queue_state/${action}.php`;
            const f = new FormData();
            f.append("department_id", departmentId);
            const r = await fetch(endpoint, { method: "POST", body: f });
            const d = await r.json();
            if (d && d.status === "success") {
                const numEl = document.getElementById(`queue_num_${departmentId}`);
                if (numEl && typeof d.current_number !== "undefined") {
                    numEl.textContent = String(d.current_number);
                }
            } else {
                console.warn("Action failed:", d);
                alert((d && d.message) ? d.message : "Action failed.");
            }
        } catch (err) {
            console.error("Action error:", err);
            alert("Action failed.");
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
}

async function refreshNumbers() {
    const grid = document.getElementById("deptGrid");
    if (!grid) return;

    const r = await fetch("../../api/v2/queue_state/view.php?_=" + Date.now()).catch(() => null);
    if (!r) return;
    const data = await r.json().catch(() => null);
    if (!Array.isArray(data)) return;

    data.forEach(d => {
        const el = document.getElementById(`queue_num_${d.department_id}`);
        if (!el) return;
        el.textContent = (typeof d.current_number !== "undefined" && d.current_number !== null)
            ? String(d.current_number)
            : "0";
    });
}