/**
 * Staff Dashboard logic: queue view/next/skip, create queue entry.
 * Requires department_id in localStorage (set after login). Polls queue every 3s.
 */
const dept = parseInt(localStorage.getItem("department_id") || "0", 10);

// Store department ID mapping
let departmentIdMap = {};
let financeQueueData = [];
let financeDepIds = []; // Store IDs of finance departments

/** Removes a patient's option from the patient selection dropdown. */
function removePatientOptionFromAllSelects(patientId){
    const sel = document.getElementById('new_patient_select');
    if (!sel) return;
    const opt = sel.querySelector(`option[value="${String(patientId)}"]`);
    if (opt) opt.remove();
}

function logout() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("department_id");
    localStorage.removeItem("role");
    window.location.href = "../index.html";
}

/** Fetches and caches department IDs for dynamic lookups. */
function loadDepartmentIds() {
    fetch('../../api/admin/departments.php')
        .then(r => r.json())
        .then(depts => {
            depts.forEach(d => {
                departmentIdMap[d.department_name] = d.department_id;
                // Track which IDs are finance departments
                if (d.is_finance == 1) {
                    financeDepIds.push(d.department_id);
                }
            });
            // Show/Hide sections based on logged-in user's department
            setupDashboardSegregation(depts);
        })
        .catch(err => console.error('Error loading department IDs:', err));
}

/** Sets up dashboard visibility based on user department. */
function setupDashboardSegregation(depts) {
    const userDeptId = parseInt(localStorage.getItem("department_id"));
    const username = localStorage.getItem("username") || "Staff";
    const userDept = depts.find(d => parseInt(d.department_id) === userDeptId);
    const userDeptName = userDept ? (userDept.department_name || "").trim() : "General";

    // Display logged-in user info
    const userInfoEl = document.getElementById("userInfoDisplay");
    if (userInfoEl) {
        userInfoEl.textContent = `Logged in as: ${username} (${userDeptName})`;
    }

    // Set dynamic department title
    const deptTitleEl = document.getElementById("dashboardDeptName");
    if (deptTitleEl) {
        deptTitleEl.textContent = userDeptName;
    }

    // Every staff member uses the mainQueueSection now
    document.getElementById("mainQueueSection").classList.remove("hidden");
    
    loadQueue();
    setInterval(loadQueue, 3000);
}

/** Gets department ID from department name (supports hardcoded fallback). */
function getDepartmentId(deptName) {
    // First try the dynamically loaded map
    if (departmentIdMap[deptName]) {
        return departmentIdMap[deptName];
    }
    
    // Fallback to hardcoded map if dynamic load hasn't completed
    const fallbackMap = {
        "Billing - Admission": 1,
        "Billing - OPD": 2,
        "Cashier": 3,
        "Medical Social Services Department": 4
    };
    return fallbackMap[deptName];
}

/** Opens queue display (patient/display.html) for this department in a new tab. */
function openQueueDisplay() {
    const deptId = localStorage.getItem("department_id");
    if (!deptId) {
        alert("Department not set. Please log in again.");
        return;
    }
    const url = new URL("../patient/display.html", window.location.href);
    url.searchParams.set("department_id", deptId);
    window.open(url.toString(), "_blank", "noopener");
}

/** Fetches queue for this department; updates current serving and waiting table. */
function loadQueue(){
    if (!dept || Number.isNaN(dept) || dept <= 0) {
        console.error('Invalid department for loadQueue:', dept);
        const currentEl = document.getElementById("currentQueue");
        if (currentEl) currentEl.innerText = "None";
        const qTable = document.getElementById("queueTable");
        if (qTable) qTable.innerHTML = '<tr><td colspan="2" class="p-8 text-center text-gray-400">No department selected.</td></tr>';
        return;
    }

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
        let html="<thead><tr><th>Queue No</th><th>Patient Number</th></tr></thead><tbody>";
        waiting.forEach(q=>{
            html+=`<tr class='hover:bg-gray-50/50 transition-colors'>
            <td class='font-black text-blue-600'>#${q.queue_number}</td>
            <td class='font-medium text-gray-700'>${q.patient_number || q.patient_id}</td>
            </tr>`;
        });
        html += "</tbody>";
        document.getElementById("queueTable").innerHTML=html;
    });
}

document.addEventListener("DOMContentLoaded", function() {
    checkDailyFlush();
    loadDepartmentIds();
    loadPatientSelect();
    
    // Start polling
    setInterval(loadPatientSelect, 3000);
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

/** Fetches all patients and populates the "Patient Number" dropdown for Create Queue Entry. */
function loadPatientSelect(){
    const sel = document.getElementById("new_patient_select");
    if (!sel) return;
    
    const deptId = localStorage.getItem("department_id") || "0";
    const role = localStorage.getItem("role") || "";

    fetch(`../../api/patient/list.php?for_queue=1&department_id=${deptId}&role=${role}&_=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
            const base = '<option value="">Select patient</option>';
            if (!Array.isArray(data) || data.length === 0) {
                sel.innerHTML = base;
                return;
            }
            // Sort by numeric patient_id
            data.sort((a,b)=> (Number(a.patient_id) || 0) - (Number(b.patient_id) || 0));
            let opts = base;
            data.forEach(p => {
                const label = p.patient_number;
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
    if (!patientId) {
        alert('Please select a patient');
        return;
    }

    if (!dept || Number.isNaN(dept) || dept <= 0) {
        alert('Invalid department. Please log in again.');
        return;
    }

    const f = new FormData();
    f.append('patient_id', patientId);
    f.append('department_id', dept);

    fetch("../../api/queue/add.php",{method:"POST",body:f})
        .then(r=>r.json())
        .then(d=>{ 
            if(d.status==="error") {
                alert(d.message);
            } else {
                removePatientOptionFromAllSelects(patientId);
                sel.value = '';
                loadQueue();
            }
        })
        .catch(()=>loadQueue());
}

// ============ INITIALIZATION ============


// Refresh finance department patient dropdowns every 3 seconds to pick up transferred patients
// (Now handled inside DOMContentLoaded)

