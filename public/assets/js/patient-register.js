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

document.addEventListener("DOMContentLoaded", loadDepartmentsForPatient);

function registerPatient(){
    const number = document.getElementById("patient_number").value;
    const name   = document.getElementById("patient_name").value;
    const dept   = document.getElementById("patient_department").value;

    if(!number || !dept){
        document.getElementById("register_result").innerText =
            "Patient number and department are required.";
        return;
    }

    const f = new FormData();
    f.append("patient_number", number);
    f.append("patient_name", name);
    f.append("department_id", dept);

    fetch("../../api/patient/create.php",{method:"POST",body:f})
        .then(r=>r.json())
        .then(d=>{
            if(d.status === "success"){
                document.getElementById("register_result").innerText =
                    "Registered. Patient ID: " + d.patient_id +
                    " | Patient Number: " + d.patient_number;
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

