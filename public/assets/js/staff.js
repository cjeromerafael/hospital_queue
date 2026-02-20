/**
 * Staff Dashboard logic: queue view/next/skip, create queue entry.
 * Requires department_id in localStorage (set after login). Polls queue every 3s.
 */
const dept = localStorage.getItem("department_id");
const finance_departments = ["Billing - Admission", "Billing - OPD", "Cashier", "Medical Social Services Department"];

// Store department ID mapping
let departmentIdMap = {};
let financeQueueData = [];
let financeDepIds = []; // Store IDs of finance departments

/** Removes a patient's option from all selection dropdowns (main + finance). */
function removePatientOptionFromAllSelects(patientId){
    const selectIds = [
        'new_patient_select',
        'billing_admission_select',
        'billing_opd_select',
        'cashier_select',
        'medical_social_select'
    ];
    const pidStr = String(patientId);
    selectIds.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const opt = sel.querySelector(`option[value="${pidStr}"]`);
        if (opt) opt.remove();
    });
}

function logout() {
    localStorage.removeItem("department_id");
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
                if (finance_departments.includes(d.department_name)) {
                    financeDepIds.push(d.department_id);
                }
            });
            // Hide main queue sections if logged-in user is from a finance department
            hideMainQueueIfFinanceDept();
        })
        .catch(err => console.error('Error loading department IDs:', err));
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

// Load department IDs for dynamic mapping
loadDepartmentIds();

/** Fetches all patients and populates the "Patient Number" dropdown for Create Queue Entry. */
function loadPatientSelect(){
    const sel = document.getElementById("new_patient_select");
    if (!sel) return;
    fetch(`../../api/patient/list.php?for_queue=1&_=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
            const base = '<option value="">Select patient</option>';
            if (!Array.isArray(data) || data.length === 0) {
                sel.innerHTML = base;
                return;
            }
            // Filter out patients assigned to finance departments
            const filtered = data.filter(p => !finance_departments.includes(p.department_name));
            // Sort by numeric patient_id
            filtered.sort((a,b)=> (Number(a.patient_id) || 0) - (Number(b.patient_id) || 0));
            let opts = base;
            filtered.forEach(p => {
                const label = p.patient_number + (p.patient_name ? ` - ${p.patient_name}` : '');
                opts += `<option value="${p.patient_id}">${escapePatientLabel(label)}</option>`;
            });
            sel.innerHTML = opts;
        })
        .catch(() => { sel.innerHTML = '<option value="">Select patient</option>'; });
}

/** Fetches patients from specific departments and populates a given dropdown for finance departments. */
function loadFinanceDepartmentPatients(selectId){
    const sel = document.getElementById(selectId);
    if (!sel) return;
    
    // Map select IDs to department names
    const deptMap = {
        'billing_admission_select': 'Billing - Admission',
        'billing_opd_select': 'Billing - OPD',
        'cashier_select': 'Cashier',
        'medical_social_select': 'Medical Social Services Department'
    };
    
    const targetDept = deptMap[selectId];
    
    fetch(`../../api/patient/list_special.php?_=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
            const base = '<option value="">Select patient</option>';
            if (!Array.isArray(data) || data.length === 0) {
                sel.innerHTML = base;
                return;
            }
            // Filter patients to only show those assigned to the target department
            let filtered = data.filter(p => p.department_name === targetDept);
            // Sort by numeric patient_id
            filtered.sort((a,b)=> (Number(a.patient_id)||0) - (Number(b.patient_id)||0));
            let opts = base;
            filtered.forEach(p => {
                const label = p.patient_number + (p.patient_name ? ` - ${p.patient_name}` : '');
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

/** Adds selected patient to a specific department's queue as waiting. */
function createQueueForDepartment(selectId, deptName){
    const sel = document.getElementById(selectId);
    const patientId = sel ? sel.value : '';
    if (!patientId) {
        alert('Please select a patient');
        return;
    }

    const deptId = getDepartmentId(deptName);
    if (!deptId) {
        alert('Invalid department');
        return;
    }

    const f = new FormData();
    f.append('patient_id', patientId);
    f.append('department_id', deptId);

    fetch("../../api/queue/add.php",{method:"POST",body:f})
        .then(r=>r.json())
        .then(d=>{ 
            if(d.status==="error") {
                alert(d.message);
            } else {
                // Remove patient from all dropdowns immediately
                removePatientOptionFromAllSelects(patientId);
                sel.value = '';
                loadFinanceQueue();
            }
        })
        .catch(()=>loadFinanceQueue());
}

function createBillingAdmissionQueue() {
    createQueueForDepartment('billing_admission_select', 'Billing - Admission');
}

function createBillingOPDQueue() {
    createQueueForDepartment('billing_opd_select', 'Billing - OPD');
}

function createCashierQueue() {
    createQueueForDepartment('cashier_select', 'Cashier');
}

function createMedicalSocialQueue() {
    createQueueForDepartment('medical_social_select', 'Medical Social Services Department');
}

/** Fetches finance queue and updates all 4 departments' displays. */
function loadFinanceQueue(){
    fetch(`../../api/queue/view_finance.php?_=${Date.now()}`)
    .then(r=>r.json())
    .then(data=>{
        financeQueueData = data || [];
        
        // Update each department's queue display
        updateDepartmentQueueDisplay('Billing - Admission', 'billing_admission_current', 'billing_admission_table');
        updateDepartmentQueueDisplay('Billing - OPD', 'billing_opd_current', 'billing_opd_table');
        updateDepartmentQueueDisplay('Cashier', 'cashier_current', 'cashier_table');
        updateDepartmentQueueDisplay('Medical Social Services Department', 'medical_social_current', 'medical_social_table');
    })
    .catch(err => console.error('Error loading finance queue:', err));
}

/** Updates queue display for a specific department. */
function updateDepartmentQueueDisplay(deptName, currentElementId, tableElementId) {
    const deptQueues = financeQueueData.filter(q => q.department_name === deptName);
    
    // Find current serving
    let current = deptQueues.find(q => q.status === "serving");
    const currentEl = document.getElementById(currentElementId);
    if (currentEl) {
        if (current) {
            currentEl.innerText = `Queue #${current.queue_number} (${current.patient_number || current.patient_id})`;
        } else {
            currentEl.innerText = "None";
        }
    }

    // Display waiting queue
    const waiting = deptQueues.filter(q => q.status === "waiting");
    let html="<tr><th>Queue No</th><th>Patient Number</th><th>Department</th></tr>";
    waiting.forEach(q=>{
        html+=`<tr>
        <td>${q.queue_number}</td>
        <td>${q.patient_number || q.patient_id}</td>
        <td>${q.department_name || ''}</td>
        </tr>`;
    });
    const tableEl = document.getElementById(tableElementId);
    if (tableEl) {
        tableEl.innerHTML = html;
    }
}

/** Completes current serving in a specific department and promotes next waiting. */
function nextDepartmentQueue(deptName){
    var bell = document.getElementById('queue_bell');
    if(bell) { bell.currentTime = 0; bell.play().catch(function(){}); }
    
    const deptId = getDepartmentId(deptName);
    if (!deptId) {
        alert('Invalid department');
        return;
    }
    
    const f = new FormData();
    f.append("department_id", deptId);
    fetch("../../api/queue/next.php",{method:"POST",body:f})
        .then(()=>loadFinanceQueue())
        .catch(()=>loadFinanceQueue());
}

/** Skips current serving in a specific department; requeues patient at end and promotes next. */
function skipDepartmentQueue(deptName){
    var bell = document.getElementById('queue_bell');
    if(bell) { bell.currentTime = 0; bell.play().catch(function(){}); }
    
    const deptId = getDepartmentId(deptName);
    if (!deptId) {
        alert('Invalid department');
        return;
    }
    
    const f = new FormData();
    f.append("department_id", deptId);
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

// Wrapper functions for each department
function nextBillingAdmission() {
    nextDepartmentQueue('Billing - Admission');
}

function skipBillingAdmission() {
    skipDepartmentQueue('Billing - Admission');
}

function nextBillingOPD() {
    nextDepartmentQueue('Billing - OPD');
}

function skipBillingOPD() {
    skipDepartmentQueue('Billing - OPD');
}

function nextCashier() {
    nextDepartmentQueue('Cashier');
}

function skipCashier() {
    skipDepartmentQueue('Cashier');
}

function nextMedicalSocial() {
    nextDepartmentQueue('Medical Social Services Department');
}

function skipMedicalSocial() {
    skipDepartmentQueue('Medical Social Services Department');
}

// ============ INITIALIZATION ============

// Check if logged-in user is from a finance department and hide main queue if so
function hideMainQueueIfFinanceDept() {
    const deptNum = parseInt(dept);
    if (financeDepIds.includes(deptNum)) {
        // Hide main queue and create entry sections
        const createQueueSection = document.querySelector('h3');
        const staffQueueH2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Staff Queue'));
        
        if (createQueueSection) {
            // Hide from h3 "Create Queue Entry" to next <hr>
            let el = createQueueSection;
            while (el && el.tagName !== 'HR') {
                el.style.display = 'none';
                el = el.nextElementSibling;
            }
            if (el && el.tagName === 'HR') el.style.display = 'none';
        }
        
        if (staffQueueH2) {
            // Hide from h2 "Staff Queue" to next <hr>
            let el = staffQueueH2;
            while (el && el.tagName !== 'HR') {
                el.style.display = 'none';
                el = el.nextElementSibling;
            }
            if (el && el.tagName === 'HR') el.style.display = 'none';
        }
    }
}

// Load department IDs for dynamic mapping
loadDepartmentIds();

// Load patient dropdowns
loadPatientSelect();
loadFinanceDepartmentPatients('billing_admission_select');
loadFinanceDepartmentPatients('billing_opd_select');
loadFinanceDepartmentPatients('cashier_select');
loadFinanceDepartmentPatients('medical_social_select');

// Start polling main department queue every 3 seconds
setInterval(loadQueue, 3000);
loadQueue();

// Start polling finance queue every 3 seconds
setInterval(loadFinanceQueue, 3000);
loadFinanceQueue();
