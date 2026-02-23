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

/** Fetches the next patient number and updates the public assign-queue button label. */
function updateAssignQueueButtonPublic(){
    const btn = document.getElementById("assign_queue_btn_public");
    if(!btn) return;
    fetch("../../api/patient/next_number.php")
        .then(r => r.json())
        .then(d => {
            const n = d && typeof d.next_number !== 'undefined'
                ? Number(d.next_number) || 1
                : 1;
            btn.textContent = "Assign queue: " + n;
        })
        .catch(() => {
            btn.textContent = "Assign queue: ?";
        });
}

