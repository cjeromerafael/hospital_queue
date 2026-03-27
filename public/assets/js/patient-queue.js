/**
 * Patient queue status: show all queued patients (all departments) in table.
 * Polls every 3s. Used by: public/patient/index.html (Patient Access).
 */
document.addEventListener("DOMContentLoaded", function(){
    checkDailyFlush();
    loadQueue();
    setInterval(loadQueue, 3000);
});

/** Auto-flush on page load. Checks if a new day has started and wipes data if needed. */
function checkDailyFlush() {
    fetch("../../api/daily_flush.php")
        .then(r => r.json())
        .then(d => {
            const el = document.getElementById("currentDateDisplay");
            if (el) el.textContent = d.current_date_display || "";
            if (d.flushed) {
                console.log("Daily flush performed (new day).");
                if (typeof loadQueue === "function") loadQueue();
            }
        })
        .catch(err => console.error("Daily flush check failed:", err));
}

function setMsg(text){
    const el = document.getElementById('msg');
    if(el) el.innerText = text || '';
}

/** Fetches all queue entries (all departments) and fills the table. */
function loadQueue(){
    const currentEl = document.getElementById("currentQueue");
    const table = document.getElementById("waitingTable");
    if(!currentEl || !table) return;

    fetch("../../api/queue/view.php?_=" + Date.now())
        .then(r => r.json())
        .then(data => {
            setMsg('');
            const serving = data.filter(q => q.status === "serving");
            if (serving.length > 0) {
                currentEl.innerText = serving.map(q => `${q.queue_department_name || 'Dept'} #${q.queue_number}`).join("; ");
            } else {
                currentEl.innerText = "None";
            }

            let html = "<thead><tr><th>Queue No</th><th>Patient No</th><th>Department</th><th>Status</th></tr></thead><tbody>";
            data.forEach(q => {
                const deptName = q.queue_department_name || q.patient_department_name || '';
                const isServing = q.status === 'serving';
                html += `<tr class='hover:bg-gray-50/50 transition-colors'>
                    <td class='font-black ${isServing ? 'text-blue-600' : 'text-gray-900'}'>#${q.queue_number}</td>
                    <td class='font-medium'>${q.patient_number || q.patient_id}</td>
                    <td class='text-gray-500'>${escapeHtml(deptName)}</td>
                    <td>
                        <span class='px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isServing ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}'>
                            ${isServing ? 'Serving' : 'Waiting'}
                        </span>
                    </td>
                </tr>`;
            });
            html += "</tbody>";
            table.innerHTML = html;
        })
        .catch(()=>{ setMsg('Unable to load queue.'); });
}

function escapeHtml(s){
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
} 