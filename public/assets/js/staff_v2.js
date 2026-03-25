/**
 * Staff dashboard v2:
 * - One card per department (4-column responsive grid).
 * - Polls queue_state view for current numbers.
 * - Buttons: Next / Skip / Reset.
 * - Finance permission: finance staff can only control their own department.
 */

document.addEventListener("DOMContentLoaded", function() {
    const deptIdRaw = localStorage.getItem("department_id");
    const role = localStorage.getItem("role") || "";
    const deptId = parseInt(deptIdRaw || "0", 10);

    const userInfoDisplay = document.getElementById("userInfoDisplay");
    const currentDateDisplay = document.getElementById("currentDateDisplay");

    if (!deptId || !role) {
        if (userInfoDisplay) userInfoDisplay.textContent = "Please log in to access this page.";
        return;
    }

    checkDailyFlush().then(() => {
        loadDepartmentsAndRender(deptId, role);
    });

    // Keep a lightweight clock on this page too.
    // (The plan requires it on display_v2; this is just for staff usability.)
    setInterval(() => {
        if (!currentDateDisplay) return;
        const d = new Date();
        currentDateDisplay.textContent = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    }, 60000);
});

async function checkDailyFlush() {
    try {
        const r = await fetch("../../api/daily_flush.php");
        const d = await r.json();
        const el = document.getElementById("currentDateDisplay");
        if (el && d && d.current_date_display) {
            el.textContent = d.current_date_display;
        }
    } catch (e) {
        // Non-fatal: the v2 endpoints will still work.
        console.warn("Daily flush check failed:", e);
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

    const departments = await fetch("../../api/admin/departments.php").then(r => r.json()).catch(() => []);
    const filtered = (Array.isArray(departments) ? departments : []).filter(d => {
        return (d && (d.department_name || "").trim().toLowerCase() !== "admin");
    });

    const userDept = filtered.find(d => Number(d.department_id) === Number(userDeptId));
    const userIsFinance = !!(userDept && Number(userDept.is_finance) === 1);

    // Pre-render cards. Numbers will be filled by polling.
    grid.innerHTML = "";
    filtered.forEach(d => {
        const canControl = (role === "admin") || !userIsFinance || Number(d.department_id) === Number(userDeptId);

        const card = document.createElement("div");
        card.className = "ios-card dept-card";
        card.dataset.departmentId = String(d.department_id);

        const badgeText = Number(d.is_finance) === 1 ? "FINANCE" : "MAIN";
        const badgeClass = Number(d.is_finance) === 1 ? "bg-red-50 text-red-700 border-red-100" : "bg-blue-50 text-blue-700 border-blue-100";

        card.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <div class="text-sm font-extrabold text-gray-900 truncate" title="${escapeHtml(d.department_name)}">
                        ${escapeHtml(d.department_name)}
                    </div>
                </div>
                <span class="inline-flex items-center px-2 py-1 rounded-full border ${badgeClass} text-[11px] font-black tracking-widest">
                    ${badgeText}
                </span>
            </div>

            <div class="queue-number text-blue-700" id="queue_num_${d.department_id}">0</div>

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
        if (!btn) return;
        if (btn.disabled) return;

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
            // Re-enable based on permission rule.
            const card = btn.closest(".ios-card.dept-card");
            const deptIdCard = card ? parseInt(card.dataset.departmentId, 10) : 0;
            const userDeptIdCard = userDeptId;
            const userDept = (filtered || []).find(x => Number(x.department_id) === Number(userDeptIdCard));
            const userIsFinance = !!(userDept && Number(userDept.is_finance) === 1);
            const canControlNow = (role === "admin") || !userIsFinance || Number(deptIdCard) === Number(userDeptIdCard);
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
        const n = (typeof d.current_number !== "undefined" && d.current_number !== null) ? String(d.current_number) : "0";
        el.textContent = n;
    });
}

