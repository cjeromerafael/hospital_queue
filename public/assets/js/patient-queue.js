/**
 * Patient queue status: show all queued patients (all departments) in table.
 * Polls every 3s. Used by: public/patient/index.html (Patient Access).
 */
document.addEventListener("DOMContentLoaded", function(){
    loadQueue();
    setInterval(loadQueue, 3000);
});

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

            let html = "<tr><th>Queue No</th><th>Patient No</th><th>Patient Name</th><th>Department</th><th>Status</th></tr>";
            data.forEach(q => {
                const deptName = q.queue_department_name || q.patient_department_name || '';
                html += `<tr>
                    <td>${q.queue_number}</td>
                    <td>${q.patient_number || q.patient_id}</td>
                    <td>${escapeHtml(q.patient_name || '')}</td>
                    <td>${escapeHtml(deptName)}</td>
                    <td>${q.status === 'serving' ? 'Serving' : 'Waiting'}</td>
                </tr>`;
            });
            table.innerHTML = html;
        })
        .catch(()=>{ setMsg('Unable to load queue.'); });
}

function escapeHtml(s){
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
} 