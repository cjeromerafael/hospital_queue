/**
 * Queue display:
 * - Full-screen grid of department cards.
 * - Shows only current queue numbers (no waiting lists).
 * - Polls queue_state view every ~1.5s.
 * - Shows live date/time in the top-right corner.
 * - Infinite marquee for department names longer than 20 characters.
 */

document.addEventListener("DOMContentLoaded", function() {
    checkDailyFlush().finally(() => {
        init();
    });
});

async function checkDailyFlush() {
    try {
        await fetch("../../api/daily_flush.php");
    } catch (e) {
        console.warn("daily_flush check failed:", e);
    }
}

function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
}

function formatDateTime(d) {
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
let emptyStateShown = false;

/**
 * Builds the inner HTML for a department name cell.
 *
 * For SHORT names (≤20 chars): single span, no animation.
 * For LONG names (>20 chars):  two identical spans side-by-side inside a
 *   scrolling track. The animation moves the track left by exactly 50%
 *   (= one copy width), then loops — creating a seamless infinite scroll.
 *   Duration scales with name length so speed stays constant regardless
 *   of how long the text is (~0.35s per character, min 8s).
 */
function buildNameHTML(name) {
    const safe = escapeHtml(name);
    const shouldScroll = name.length > 20;

    if (!shouldScroll) {
        // Static — single span, no animation overhead
        return `
            <div class="dept-name-container">
                <div class="dept-name-track" style="height:100%; align-items:center;">
                    <span class="dept-name-text">${safe}</span>
                </div>
            </div>`;
    }

    // Duration scales with character count so scroll speed feels consistent.
    // Formula: ~0.35s per character, clamped to a minimum of 8s.
    const duration = Math.max(8, Math.round(name.length * 0.35)) + "s";

    // Two identical copies side-by-side. translateX(-50%) shifts by exactly
    // one copy, which is seamless because both copies are identical.
    return `
        <div class="dept-name-container">
            <div class="dept-name-track scrolling" style="--marquee-duration: ${duration};">
                <span class="dept-name-text" aria-hidden="true">${safe}</span>
                <span class="dept-name-text" aria-hidden="true">${safe}</span>
            </div>
        </div>`;
}

async function refreshAndRender() {
    const grid = document.getElementById("displayGrid");
    if (!grid) return;

    try {
        const r = await fetch("../../api/queue_state/view.php?_=" + Date.now());
        if (!r.ok) {
            throw new Error(`HTTP ${r.status}`);
        }
        const data = await r.json();
        if (!Array.isArray(data)) {
            throw new Error("Invalid data format");
        }

        // Clear any error message
        const errorEl = document.getElementById("offlineError");
        if (errorEl) {
            errorEl.style.display = "none";
        }

        // Only show departments with an active queue number
        const filteredData = data.filter(d => Number(d.current_number || 0) > 0);

        const incomingIds = new Set(filteredData.map(d => String(d.department_id)));
        const setsMatch = !emptyStateShown &&
                          incomingIds.size === renderedDeptIds.size &&
                          incomingIds.size > 0 &&
                          Array.from(incomingIds).every(id => renderedDeptIds.has(id));

        if (!setsMatch) {
            grid.innerHTML = "";
            renderedDeptIds = incomingIds;
            emptyStateShown = false;

            if (filteredData.length === 0) {
                emptyStateShown = true;
                grid.innerHTML = `<div style="
                    grid-column: 1 / -1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 300px;
                    color: #9ca3af;
                    font-size: clamp(1rem, 2vw, 1.4rem);
                    font-weight: 600;
                    letter-spacing: 0.02em;
                    user-select: none;
                ">No active queues at this time</div>`;
                return;
            }

            filteredData.forEach(d => {
                const card = document.createElement("div");
                card.className = "ios-card display-card";
                card.dataset.departmentId = String(d.department_id);

                const deptColor = (d.department_color || "#3b82f6").toLowerCase();
                card.style.setProperty("--dept-color", deptColor);

                card.innerHTML = `
                    ${buildNameHTML(d.department_name || "")}
                    <div class="display-number" id="display_num_${d.department_id}">${Number(d.current_number || 0)}</div>
                `;
                grid.appendChild(card);
            });
        } else {
            // Same departments — just update the numbers, leave the DOM (and animations) untouched
            filteredData.forEach(d => {
                const el = document.getElementById(`display_num_${d.department_id}`);
                if (!el) return;
                el.textContent = Number(d.current_number || 0);
            });
        }
    } catch (error) {
        console.error("Failed to fetch queue data:", error);
        
        // Show offline error message if grid is empty
        if (grid.children.length === 0) {
            let errorEl = document.getElementById("offlineError");
            if (!errorEl) {
                errorEl = document.createElement("div");
                errorEl.id = "offlineError";
                errorEl.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    background: rgba(0, 0, 0, 0.8);
                    color: #fff;
                    padding: 30px;
                    border-radius: 10px;
                    font-size: 18px;
                    font-weight: 500;
                    z-index: 100;
                `;
                grid.parentElement.style.position = "relative";
                grid.parentElement.appendChild(errorEl);
            }
            errorEl.textContent = "📡 No internet connection\nPlease check your network";
            errorEl.style.display = "block";
        }
        // If grid has data, don't update it (keep showing cached data)
    }
}