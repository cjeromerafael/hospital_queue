/**
 * Staff Dashboard logic: queue view/next/skip, create queue entry.
 * Requires department_id in localStorage (set after login). Polls queue every 3s.
 */
const dept = localStorage.getItem("department_id");
const finance_departments = ["Billing - Admission", "Billing - OPD", "Cashier", "Medical Social Services"];

function logout() {
    localStorage.removeItem("department_id");
    window.location.href = "../index.html";
}

/** Opens queue display (patient/display.html) for this department in a new tab. */
function openQueueDisplay() {
    if (!dept) {
        alert("No department set. Log in as staff first.");
        return;
    }
    const url = new URL("../patient/display.html", window.location.href);
    url.searchParams.set("dept", dept);
    window.open(url.toString(), "_blank", "noopener");
}

/** Fetches queue for this department; updates current serving and waiting table. */
function loadQueue(){
    fetch(`../../api/queue/view.php?department_id=${dept}&_=${Date.now()}`)
    .then(r=>r.json())
    .then(data=>{
        let current = data.find(q => q.status === "serving");
        const currentEl = document.getElementById("currentQueue");
        if (current) {
            currentEl.innerText = `Queue #${current.queue_number} (${current.patient_number || current.patient_id})`;
        } else {
            currentEl.innerText = "None";
        }

        const waiting = data.filter(q => q.status === "waiting");
        let html="<tr><th>Queue No</th><th>Patient Number</th><th>Department</th></tr>";
        waiting.forEach(q=>{
            html+=`<tr>
            <td>${q.queue_number}</td>
            <td>${q.patient_number || q.patient_id}</td>
            <td>${q.patient_department_name || ''}</td>
            </tr>`;
        });
        document.getElementById("queueTable").innerHTML=html;
    });
}

setInterval(loadQueue,3000);
loadQueue();

/** Fetches all patients and populates the "Patient Number" dropdown for Create Queue Entry. */
function loadPatientSelect(){
    const sel = document.getElementById("new_patient_select");
    if (!sel) return;
    fetch(`../../api/patient/list.php?_=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
            const base = '<option value="">Select patient</option>';
            if (!Array.isArray(data) || data.length === 0) {
                sel.innerHTML = base;
                return;
            }
            let opts = base;
            data.forEach(p => {
                const label = p.patient_number + (p.patient_name ? ` - ${p.patient_name}` : '');
                opts += `<option value="${p.patient_id}">${escapePatientLabel(label)}</option>`;
            });
            sel.innerHTML = opts;
        })
        .catch(() => { sel.innerHTML = '<option value="">Select patient</option>'; });
}

/** Fetches patients from specific departments and populates the "Special Patient Number" dropdown. */
function loadSpecialPatientSelect(){
    const sel = document.getElementById("special_patient_select");
    if (!sel) return;
    fetch(`../../api/patient/list_special.php?_=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
            const base = '<option value="">Select patient</option>';
            if (!Array.isArray(data) || data.length === 0) {
                sel.innerHTML = base;
                return;
            }
            let opts = base;
            data.forEach(p => {
                const label = p.patient_number + (p.patient_name ? ` - ${p.patient_name}` : '') + ` (${p.department_name})`;
                opts += `<option value="${p.patient_id}">${escapePatientLabel(label)}</option>`;
            });
            sel.innerHTML = opts;
        })
        .catch(() => { sel.innerHTML = '<option value="">Select patient</option>'; });
}

function escapePatientLabel(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}
loadPatientSelect();
loadSpecialPatientSelect();

/** Completes current serving (removes from queue) and promotes next waiting. */
function next(){
    var bell = document.getElementById('queue_bell');
    if(bell) { bell.currentTime = 0; bell.play().catch(function(){}); }
    const f=new FormData();
    f.append("department_id",dept);
    fetch("../../api/queue/next.php",{method:"POST",body:f})
        .then(()=>loadQueue());
}

/** Skips current serving; requeues patient at end and promotes next. */
function skipCurrent(){
    var bell = document.getElementById('queue_bell');
    if(bell) { bell.currentTime = 0; bell.play().catch(function(){}); }
    const f=new FormData();
    f.append("department_id",dept);
    fetch("../../api/queue/skip.php",{method:"POST",body:f})
        .then(r=>r.json())
        .then(d=>{
            if(d && (d.status === 'skipped' || d.status === 'skipped_no_next')){
                const re = d.requeued_number || d.requeued_id || null;
                if(re) alert('Skipped. Requeued as #' + re);
                else alert('Skipped. Requeued.');
            }
            loadQueue();
        })
        .catch(()=>loadQueue());
}

/** Adds selected patient (new_patient_select) to this department's queue as waiting. */
function createQueue(){
    const sel = document.getElementById("new_patient_select");
    const patientId = sel ? sel.value : '';
    if (!patientId) return;

    const f = new FormData();
    f.append('patient_id', patientId);
    f.append('department_id', dept);

    fetch("../../api/queue/add.php",{method:"POST",body:f})
        .then(r=>r.json())
        .then(d=>{ if(d.status==="error") alert(d.message); else loadQueue(); })
        .catch(()=>loadQueue());
}

/** Adds selected patient (special_patient_select) to this department's queue as waiting. */
function createSpecialQueue(){
    const sel = document.getElementById("special_patient_select");
    const patientId = sel ? sel.value : '';
    if (!patientId) return;

    const f = new FormData();
    f.append('patient_id', patientId);
    f.append('department_id', dept);

    fetch("../../api/queue/add.php",{method:"POST",body:f})
        .then(r=>r.json())
        .then(d=>{ if(d.status==="error") alert(d.message); else loadQueue(); })
        .catch(()=>loadQueue());
}

/** Fetches finance queue and updates current serving and waiting table. */
function loadFinanceQueue(){
    fetch(`../../api/queue/view_finance.php?_=${Date.now()}`)
    .then(r=>r.json())
    .then(data=>{
        let current = data.find(q => q.status === "serving");
        const currentEl = document.getElementById("financeCurrentQueue");
        if (current) {
            currentEl.innerText = `Queue #${current.queue_number} (${current.patient_number || current.patient_id})`;
        } else {
            currentEl.innerText = "None";
        }

        const waiting = data.filter(q => q.status === "waiting");
        let html="<tr><th>Queue No</th><th>Patient Number</th><th>Department</th></tr>";
        waiting.forEach(q=>{
            html+=`<tr>
            <td>${q.queue_number}</td>
            <td>${q.patient_number || q.patient_id}</td>
            <td>${q.department_name || ''}</td>
            </tr>`;
        });
        document.getElementById("financeQueueTable").innerHTML=html;
    });
}

/** Completes current serving in finance queue and promotes next waiting. */
function nextFinance(){
    var bell = document.getElementById('queue_bell');
    if(bell) { bell.currentTime = 0; bell.play().catch(function(){}); }
    // Note: This assumes finance queue uses the same department logic or needs adjustment
    const f=new FormData();
    f.append("department_id",dept); // This might need to be adjusted for finance departments
    fetch("../../api/queue/next.php",{method:"POST",body:f})
        .then(()=>loadFinanceQueue());
}

/** Skips current serving in finance queue; requeues patient at end and promotes next. */
function skipFinanceCurrent(){
    var bell = document.getElementById('queue_bell');
    if(bell) { bell.currentTime = 0; bell.play().catch(function(){}); }
    const f=new FormData();
    f.append("department_id",dept); // This might need to be adjusted for finance departments
    fetch("../../api/queue/skip.php",{method:"POST",body:f})
        .then(r=>r.json())
        .then(d=>{
            if(d && (d.status === 'skipped' || d.status === 'skipped_no_next')){
                const re = d.requeued_number || d.requeued_id || null;
                if(re) alert('Skipped. Requeued as #' + re);
                else alert('Skipped. Requeued.');
            }
            loadFinanceQueue();
        })
        .catch(()=>loadFinanceQueue());
}

setInterval(loadFinanceQueue,3000);
loadFinanceQueue();

