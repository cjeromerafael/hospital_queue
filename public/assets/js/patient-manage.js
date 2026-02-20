/**
 * Patient management (staff): register patient, list with edit/delete.
 * Used in public/patient/manage.html. Calls create.php for register, list/update/delete for table.
 */
document.addEventListener('DOMContentLoaded', function(){
    loadDepartments();
    loadPatients();
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

/** Registers a new patient (patient_number, department required) via create.php. */
function registerPatientManaged(){
    const number = document.getElementById('patient_number').value.trim();
    const name = document.getElementById('patient_name').value.trim();
    const dept = document.getElementById('patient_dept').value;
    if(!number || !dept){ setRegisterMsg('Patient number and department required'); return; }
    const f = new FormData();
    f.append('patient_number', number);
    f.append('patient_name', name);
    f.append('department_id', dept);
    fetch('../../api/patient/create.php',{method:'POST',body:f})
    .then(r=>r.json())
    .then(d=>{
        if(d.status === 'success'){
            setRegisterMsg('Registered: ' + d.patient_number);
            document.getElementById('patient_number').value='';
            document.getElementById('patient_name').value='';
            loadPatients();
        } else {
            setRegisterMsg(d.message || 'Registration failed');
        }
    }).catch(()=> setRegisterMsg('Registration failed'));
}

/** Fetches patient list; renders table with edit/delete buttons. */
function loadPatients(){
    const el = document.getElementById('patientTable');
    fetch('../../api/patient/list.php')
    .then(r=>r.json())
    .then(data=>{
        if(!Array.isArray(data)){ el.innerHTML='<tr><td>No patients</td></tr>'; return; }
        let html = '<tr><th>ID</th><th>Patient Number</th><th>Patient Name</th><th>Department</th><th>Edit</th><th>Delete</th></tr>';
        data.forEach(p=>{
            html += `<tr data-patient-id="${p.patient_id}" data-department-id="${p.department_id}">`+
                    `<td>${p.patient_id}</td>`+
                    `<td>${escapeHtml(p.patient_number)}</td>`+
                    `<td class="patient-name-cell td-scroll">${escapeHtml(p.patient_name||'')}</td>`+
                    `<td class="patient-dept-cell td-scroll">${escapeHtml(p.department_name||'')}</td>`+
                    `<td style="min-width:72px;text-align:center"><button class="edit-patient-btn">Edit</button></td>`+
                    `<td style="min-width:72px;text-align:center"><button class="delete-patient-btn">Delete</button></td>`+
                    `</tr>`;
        });
        el.innerHTML = html;
        el.querySelectorAll('.edit-patient-btn').forEach(b=> b.addEventListener('click', startEditPatient));
        el.querySelectorAll('.delete-patient-btn').forEach(b=> b.addEventListener('click', deletePatientRow));
    }).catch(()=> el.innerHTML='<tr><td colspan="5">Could not load patients.</td></tr>');
}

function startEditPatient(ev){
    const btn = ev.target; const row = btn.closest('tr');
    const id = row.dataset.patientId; const deptId = row.dataset.departmentId;
    const nameCell = row.querySelector('.patient-name-cell');
    if(nameCell.querySelector('input.inline-edit-input')){
        // cancel edit
        nameCell.textContent = row.dataset.originalName||'';
        delete row.dataset.originalName;
        loadPatients();
        return;
    }
    row.dataset.originalName = nameCell.textContent;
    const input = document.createElement('input'); input.type='text'; input.className='inline-edit-input'; input.value = nameCell.textContent;
    nameCell.textContent=''; nameCell.appendChild(input);

    // replace dept cell with select
    const deptCell = row.querySelector('.patient-dept-cell');
    const select = document.createElement('select'); select.className='inline-dept-select';
    // populate departments
    fetch('../../api/admin/departments.php').then(r=>r.json()).then(depts=>{
        let opts = '';
        depts.filter(d => Number(d.department_id) !== 22).forEach(d=> opts += `<option value="${d.department_id}" ${d.department_id==deptId? 'selected':''}>${escapeHtml(d.department_name)}</option>`);
        select.innerHTML = opts;
        deptCell.textContent=''; deptCell.appendChild(select);
        select.focus();
    });

    function save(){
        const newName = input.value.trim();
        const newDept = select.value;
        const promises = [];
        // update name via PUT
        if(newName !== row.dataset.originalName){
            promises.push(fetch('../../api/patient/update.php',{
                method:'PUT',
                headers:{'Content-Type':'application/x-www-form-urlencoded'},
                body:`patient_id=${encodeURIComponent(id)}&patient_name=${encodeURIComponent(newName)}`
            }).then(r=>r.json()));
        }
        // if dept changed, update patient's assigned department WITHOUT enqueuing
        if(newDept && newDept != deptId){
            // update via PUT to patient/update.php
            promises.push(fetch('../../api/patient/update.php',{
                method:'PUT',
                headers:{'Content-Type':'application/x-www-form-urlencoded'},
                body:`patient_id=${encodeURIComponent(id)}&department_id=${encodeURIComponent(newDept)}`
            }).then(r=>r.json()));
        }
        Promise.all(promises).then(()=>{
            loadPatients();
        }).catch(()=>{ alert('Update failed'); loadPatients(); });
    }

    input.addEventListener('keydown', function(e){ if(e.key==='Enter') save(); });
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
    .then(d=>{ if(d && d.status === 'success') loadPatients(); else alert(d.message || 'Delete failed'); })
    .catch(()=>{ alert('Delete failed'); });
}