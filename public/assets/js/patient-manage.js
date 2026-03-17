/**
 * Patient management (staff): register patient, list with edit/delete.
 * Used in public/patient/manage.html. Calls create.php for register, list/update/delete for table.
 */
let isEditingPatient = false;

document.addEventListener('DOMContentLoaded', function(){
    checkDailyFlush();
    loadDepartments();
    loadPatients();
    updateAssignQueueButton();
    const deptSelect = document.getElementById('patient_dept');
    if (deptSelect) deptSelect.addEventListener('change', updateAssignQueueButton);
    
    // Poll for new patients transferred to this department
    setInterval(loadPatients, 3000);
});

/** Auto-flush on page load. Checks if a new day has started and wipes data if needed. */
function checkDailyFlush() {
    fetch('../../api/daily_flush.php')
        .then(r => r.json())
        .then(d => {
            const el = document.getElementById('currentDateDisplay');
            if (el) el.textContent = d.current_date_display || '';
            if (d.flushed) {
                console.log('Daily flush performed (new day).');
                if (typeof loadPatients === 'function') loadPatients();
                if (typeof updateAssignQueueButton === 'function') updateAssignQueueButton();
            }
        })
        .catch(err => console.error('Daily flush check failed:', err));
}

function setRegisterMsg(text){
    const el = document.getElementById('register_msg'); if(el) el.innerText = text || '';
}

/** Fills patient_dept dropdown for registration form. 
 * Restrictions:
 * - Finance departments can only register patients for their own department.
 * - Main staff cannot register patients for finance departments.
 */
function loadDepartments(){
    const userDeptId = localStorage.getItem('department_id');
    const role = localStorage.getItem('role');

    fetch('../../api/admin/departments.php')
    .then(r=>r.json())
    .then(data=>{
        const sel = document.getElementById('patient_dept');
        if (!sel) return;
        
        // Find current user's department name
        const userDept = data.find(d => String(d.department_id) === String(userDeptId));
        const userDeptName = userDept ? (userDept.department_name || "").trim() : "";
        const isFinance = userDept && userDept.is_finance == 1;

        // If finance staff, auto-select their department and hide the selector container
        if (isFinance && role !== 'admin') {
            sel.innerHTML = `<option value="${userDeptId}" selected>${escapeHtml(userDeptName)}</option>`;
            const container = sel.closest('div');
            if (container) container.classList.add('hidden');
            // Immediately update the button label
            updateAssignQueueButton();
            return;
        }

        let opts = '<option value="">Select department</option>';
        data.filter(d => {
            const name = (d.department_name || '').trim();
            // Exclude Admin
            if (name.toLowerCase() === 'admin') return false;
            
            // Admins can see all
            if (role === 'admin') return true;

            // Non-finance staff cannot register for finance departments
            return d.is_finance != 1;
        }).forEach(d=> opts += `<option value="${d.department_id}">${escapeHtml(d.department_name)}</option>`);
        
        sel.innerHTML = opts;
    }).catch(err => console.error("Error loading departments:", err));
}

/** Fetches the next patient number for the selected department and updates the assign-queue button label. */
function updateAssignQueueButton(){
    const btn = document.getElementById('assign_queue_btn');
    const deptSelect = document.getElementById('patient_dept');
    if(!btn) return;
    const deptId = deptSelect && deptSelect.value ? deptSelect.value : '';
    if(!deptId){
        btn.textContent = 'Assign queue: Select department';
        return;
    }
    fetch('../../api/patient/next_number.php?department_id=' + encodeURIComponent(deptId))
        .then(r => r.json())
        .then(d => {
            const n = d && d.next_number != null ? String(d.next_number) : null;
            btn.textContent = n ? 'Assign queue: ' + n : 'Assign queue: Select department';
        })
        .catch(() => {
            btn.textContent = 'Assign queue: ?';
        });
}

/** Registers a new patient (department required, patient_number auto-generated) via create.php. */
function registerPatientManaged(){
    const dept = document.getElementById('patient_dept').value;
    if(!dept){ setRegisterMsg('Department required'); return; }

    const f = new FormData();
    f.append('department_id', dept);
    fetch('../../api/patient/create.php',{method:'POST',body:f})
    .then(r=>r.json())
    .then(d=>{
        if(d.status === 'success'){
            setRegisterMsg('Registered: ' + d.patient_number);
            loadPatients();
            updateAssignQueueButton();
        } else {
            setRegisterMsg(d.message || 'Registration failed');
        }
    })
    .catch(()=>{
        setRegisterMsg('Registration failed');
    });
}

/** Fetches patient list; renders table with transfer/delete buttons. */
function loadPatients(){
    // Do not refresh table if user is currently editing (transferring) a patient
    if (isEditingPatient) return;

    const el = document.getElementById('patientTable');
    
    const deptId = localStorage.getItem("department_id") || "0";
    const role = localStorage.getItem("role") || "";

    fetch(`../../api/patient/list.php?department_id=${deptId}&role=${role}&_=${Date.now()}`)
    .then(r=>r.json())
    .then(data=>{
        if(!Array.isArray(data)){ el.innerHTML='<tr><td class="p-8 text-center text-gray-400">No patients</td></tr>'; return; }
        let html = '<thead><tr><th>ID</th><th>Patient Number</th><th>Department</th><th class="text-center">Actions</th></tr></thead><tbody>';
        data.forEach(p=>{
            const hasCode = p.patient_number && /^[A-Z0-9]{3}-\d{3}$/.test(String(p.patient_number));
            const deptDisplay = p.department_name
                ? (hasCode ? p.department_name + ' (' + p.patient_number + ')' : p.department_name)
                : (hasCode ? p.patient_number : '');
            html += `<tr data-patient-id="${p.patient_id}" data-department-id="${p.department_id}" class='hover:bg-gray-50/50 transition-colors'>`+
                    `<td class='text-gray-400 font-mono text-xs'>${p.patient_id}</td>`+
                    `<td class='font-black text-blue-600'>${escapeHtml(p.patient_number)}</td>`+
                    `<td class="patient-dept-cell font-medium">${escapeHtml(deptDisplay)}</td>`+
                    `<td class='flex justify-center gap-2'>`+
                        `<button class="edit-patient-btn btn-ios-secondary !px-3 !py-2 !text-xs">Transfer</button>`+
                        `<button class="delete-patient-btn btn-ios-danger !px-3 !py-2 !text-xs">Delete</button>`+
                    `</td>`+
                    `</tr>`;
        });
        html += "</tbody>";
        el.innerHTML = html;
        el.querySelectorAll('.edit-patient-btn').forEach(b=> b.addEventListener('click', startEditPatient));
        el.querySelectorAll('.delete-patient-btn').forEach(b=> b.addEventListener('click', deletePatientRow));
    }).catch(()=> el.innerHTML='<tr><td colspan="4" class="p-8 text-center text-gray-400">Could not load patients.</td></tr>');
}

function startEditPatient(ev){
    if (isEditingPatient) return; // Prevent multiple simultaneous edits
    isEditingPatient = true;

    const btn = ev.target;
    const row = btn.closest('tr');
    const id = row.dataset.patientId;
    const deptId = row.dataset.departmentId;

    // replace dept cell with select (only department is editable now)
    const deptCell = row.querySelector('.patient-dept-cell');
    const select = document.createElement('select');
    select.className = 'input-ios !px-3 !py-2 !text-sm appearance-none';

    // populate departments
    fetch('../../api/admin/departments.php')
        .then(r=>r.json())
        .then(depts=>{
            let opts = '';
            depts
                .filter(d => (d.department_name || '').trim().toLowerCase() !== 'admin')
                .forEach(d=> opts += `<option value="${d.department_id}" ${d.department_id==deptId? 'selected':''}>${escapeHtml(d.department_name)}</option>`);
            select.innerHTML = opts;
            deptCell.textContent='';
            deptCell.appendChild(select);
            select.focus();
        });

    function save(){
        const newDept = select.value;
        if(newDept && newDept != deptId){
            const fBody = `patient_id=${encodeURIComponent(id)}&department_id=${encodeURIComponent(newDept)}`;
            fetch('../../api/patient/update.php',{
                method:'PUT',
                headers:{'Content-Type':'application/x-www-form-urlencoded'},
                body:fBody
            })
            .then(r=>r.json())
            .then(()=> {
                isEditingPatient = false;
                loadPatients();
                updateAssignQueueButton();
                setRegisterMsg('');
            })
            .catch(()=>{ 
                alert('Update failed'); 
                isEditingPatient = false;
                loadPatients();
                updateAssignQueueButton();
            });
        } else {
            isEditingPatient = false;
            loadPatients();
            updateAssignQueueButton();
        }
    }

    select.addEventListener('change', save);
    
    // Also reset if user clicks away without changing
    select.addEventListener('blur', function() {
        setTimeout(() => {
            if (isEditingPatient) {
                isEditingPatient = false;
                loadPatients();
                updateAssignQueueButton();
            }
        }, 200);
    });
}

/** Escape HTML for safe display (XSS). */
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

function deletePatientRow(ev){
    const row = ev.target.closest('tr');
    const id = row.dataset.patientId;
    if(!confirm('Delete this patient?')) return;
    const f = new FormData(); f.append('patient_id', id);
    fetch('../../api/patient/delete.php',{method:'POST', body: f})
    .then(r=>r.json())
    .then(d=>{
        if(d && d.status === 'success'){
            loadPatients();
            updateAssignQueueButton();
        } else {
            alert(d.message || 'Delete failed');
        }
    })
    .catch(()=>{ alert('Delete failed'); });
}