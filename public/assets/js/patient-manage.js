/**
 * Patient management (staff): register patient, list with edit/delete.
 * Used in public/patient/manage.html. Calls create.php for register, list/update/delete for table.
 */
document.addEventListener('DOMContentLoaded', function(){
    loadDepartments();
    loadPatients();
    updateAssignQueueButton();
});

function setRegisterMsg(text){
    const el = document.getElementById('register_msg'); if(el) el.innerText = text || '';
}

/** Fills patient_dept dropdown for registration form. */
function loadDepartments(){
    fetch('../../api/admin/departments.php')
    .then(r=>r.json())
    .then(data=>{
        const sel = document.getElementById('patient_dept');
        let opts = '<option value="">Select department</option>';
        // Exclude Admin department (id 22)
        data.filter(d => Number(d.department_id) !== 22).forEach(d=> opts += `<option value="${d.department_id}">${escapeHtml(d.department_name)}</option>`);
        sel.innerHTML = opts;
    }).catch(()=>{});
}

/** Fetches the next patient number and updates the assign-queue button label. */
function updateAssignQueueButton(){
    const btn = document.getElementById('assign_queue_btn');
    if(!btn) return;
    fetch('../../api/patient/next_number.php')
        .then(r => r.json())
        .then(d => {
            const n = d && typeof d.next_number !== 'undefined'
                ? Number(d.next_number) || 1
                : 1;
            btn.textContent = 'Assign queue: ' + n;
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
    const el = document.getElementById('patientTable');
    fetch('../../api/patient/list.php')
    .then(r=>r.json())
    .then(data=>{
        if(!Array.isArray(data)){ el.innerHTML='<tr><td>No patients</td></tr>'; return; }
        let html = '<tr><th>ID</th><th>Patient Number</th><th>Department</th><th>Transfer</th><th>Delete</th></tr>';
        data.forEach(p=>{
            html += `<tr data-patient-id="${p.patient_id}" data-department-id="${p.department_id}">`+
                    `<td>${p.patient_id}</td>`+
                    `<td>${escapeHtml(p.patient_number)}</td>`+
                    `<td class="patient-dept-cell td-scroll">${escapeHtml(p.department_name||'')}</td>`+
                    `<td style="min-width:72px;text-align:center"><button class="edit-patient-btn">Transfer</button></td>`+
                    `<td style="min-width:72px;text-align:center"><button class="delete-patient-btn">Delete</button></td>`+
                    `</tr>`;
        });
        el.innerHTML = html;
        el.querySelectorAll('.edit-patient-btn').forEach(b=> b.addEventListener('click', startEditPatient));
        el.querySelectorAll('.delete-patient-btn').forEach(b=> b.addEventListener('click', deletePatientRow));
    }).catch(()=> el.innerHTML='<tr><td colspan="5">Could not load patients.</td></tr>');
}

function startEditPatient(ev){
    const btn = ev.target;
    const row = btn.closest('tr');
    const id = row.dataset.patientId;
    const deptId = row.dataset.departmentId;

    // replace dept cell with select (only department is editable now)
    const deptCell = row.querySelector('.patient-dept-cell');
    const select = document.createElement('select');
    select.className = 'inline-dept-select';

    // populate departments
    fetch('../../api/admin/departments.php')
        .then(r=>r.json())
        .then(depts=>{
            let opts = '';
            depts
                .filter(d => Number(d.department_id) !== 22)
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
            .then(()=> loadPatients())
            .catch(()=>{ alert('Update failed'); loadPatients(); });
        } else {
            loadPatients();
        }
    }

    select.addEventListener('change', save);
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