/**
 * Queue display v2:
 * - Full-screen grid of department cards.
 * - Shows only current queue numbers (no waiting lists).
 * - Polls queue_state view every ~1.5s.
 * - Shows live date/time in the top-right corner.
 */

document.addEventListener("DOMContentLoaded", function() {
    // v2 queue_state should be reset on day rollover.
    checkDailyFlush().finally(() => {
        init();
    });
});

async function checkDailyFlush() {
    try {
        await fetch("../../api/daily_flush.php");
    } catch (e) {
        // Non-fatal.
        console.warn("daily_flush check failed:", e);
    }
}

function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
}

function formatDateTime(d) {
    // Keep it readable on display screens.
    const date = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return `${date} ${time}`;
}

function updateClock() {
    const el = document.getElementById("displayDateTime");
    if (!el) return;
    el.textContent = formatDateTime(new Date());
}

async function init() {
    updateClock();
    setInterval(updateClock, 1000);

    await refreshAndRender();
    setInterval(refreshAndRender, 1500);
}

let renderedDeptIds = new Set();

async function refreshAndRender() {
    const grid = document.getElementById("displayGrid");
    if (!grid) return;

    const r = await fetch("../../api/v2/queue_state/view.php?_=" + Date.now()).catch(() => null);
    if (!r) return;
    const data = await r.json().catch(() => null);
    if (!Array.isArray(data)) return;

    // If departments set changes (rare), re-render structure.
    const incomingIds = new Set(data.map(d => String(d.department_id)));
    if (incomingIds.size !== renderedDeptIds.size || Array.from(incomingIds).some(id => !renderedDeptIds.has(id))) {
        grid.innerHTML = "";
        renderedDeptIds = incomingIds;
        data.forEach(d => {
            const card = document.createElement("div");
            card.className = "ios-card display-card";
            card.dataset.departmentId = String(d.department_id);
            card.innerHTML = `
                <div class="text-sm font-black text-gray-900 truncate" title="${escapeHtml(d.department_name)}">
                    ${escapeHtml(d.department_name)}
                </div>
                <div class="display-number" id="display_num_${d.department_id}">${Number(d.current_number || 0)}</div>
            `;
            grid.appendChild(card);
        });
    } else {
        data.forEach(d => {
            const el = document.getElementById(`display_num_${d.department_id}`);
            if (!el) return;
            el.textContent = Number(d.current_number || 0);
        });
    }
}

