/**
 * Patient registration (public): load departments, submit patient_number + department to create.php.
 * Used in public/patient/register.html (linked from Patient Access "Register Patient").
 */
function loadDepartmentsForPatient(){
    fetch("../../api/admin/departments.php")
        .then(r => r.json())
        .then(depts => {
            const select = document.getElementById("patient_department");
            let options = '<option value="">Select department</option>';
            depts.forEach(d => {
                options += `<option value="${d.department_id}">${d.department_name}</option>`;
            });
            select.innerHTML = options;
        });
}

document.addEventListener("DOMContentLoaded", function(){
    loadDepartmentsForPatient();
    updateAssignQueueButtonPublic();
    const deptSelect = document.getElementById("patient_department");
    if (deptSelect) deptSelect.addEventListener("change", updateAssignQueueButtonPublic);
});

/** Submits registration (department required, patient_number auto-generated) to create.php. */
function registerPatient(){
    const dept   = document.getElementById("patient_department").value;

    if(!dept){
        document.getElementById("register_result").innerText =
            "Department is required.";
        return;
    }

    const f = new FormData();
    f.append("department_id", dept);

    fetch("../../api/patient/create.php",{method:"POST",body:f})
        .then(r=>r.json())
        .then(d=>{
            if(d.status === "success"){
                document.getElementById("register_result").innerText =
                    "Registered. Patient : " + d.patient_id +
                    " | Patient Number: " + d.patient_number;
                updateAssignQueueButtonPublic();
            }else{
                document.getElementById("register_result").innerText =
                    d.message || "Registration failed.";
            }
        })
        .catch(()=>{
            document.getElementById("register_result").innerText =
                "Registration failed.";
        });
}

/** Fetches the next patient number for the selected department and updates the assign-queue button label. */
function updateAssignQueueButtonPublic(){
    const btn = document.getElementById("assign_queue_btn_public");
    const deptSelect = document.getElementById("patient_department");
    if(!btn) return;
    const deptId = deptSelect && deptSelect.value ? deptSelect.value : "";
    if(!deptId){
        btn.textContent = "Assign queue: Select department";
        return;
    }
    fetch("../../api/patient/next_number.php?department_id=" + encodeURIComponent(deptId))
        .then(r => r.json())
        .then(d => {
            const n = d && d.next_number != null ? String(d.next_number) : null;
            btn.textContent = n ? "Assign queue: " + n : "Assign queue: Select department";
        })
        .catch(() => {
            btn.textContent = "Assign queue: ?";
        });
}

