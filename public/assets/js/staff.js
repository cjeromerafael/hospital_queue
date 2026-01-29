const dept = localStorage.getItem("department_id");

function logout() {
    localStorage.removeItem("department_id");
    window.location.href = "../index.html";
}

function loadQueue(){
    fetch(`../../api/queue/view.php?department_id=${dept}`)
    .then(r=>r.json())
    .then(data=>{
        let current = data.find(q => q.status === "serving");
        const currentEl = document.getElementById("currentQueue");
        if (current) {
            currentEl.innerText = `Queue #${current.queue_number} (ID ${current.queue_id}, Patient ${current.patient_id})`;
        } else {
            currentEl.innerText = "None";
        }

        const waiting = data.filter(q => q.status === "waiting");
        let html="<tr><th>Queue No</th><th>Patient ID</th><th>Patient Name</th><th>Status</th></tr>";
        waiting.forEach(q=>{
            html+=`<tr>
            <td>${q.queue_number}</td>
            <td>${q.patient_id}</td>
            <td>${q.patient_name || ''}</td>
            <td>${q.status}</td>
            </tr>`;
        });
        document.getElementById("queueTable").innerHTML=html;
    });
}

setInterval(loadQueue,3000);
loadQueue();

function next(){
    const f=new FormData();
    f.append("department_id",dept);
    fetch("../../api/queue/next.php",{method:"POST",body:f})
        .then(()=>loadQueue());
}

function skipCurrent(){
    const f=new FormData();
    f.append("department_id",dept);
    fetch("../../api/queue/skip.php",{method:"POST",body:f})
        .then(()=>loadQueue());
}

function createQueue(){
    const patientId = document.getElementById("new_patient_id").value;
    if (!patientId) return;

    const f = new FormData();
    f.append("patient_id", patientId);
    f.append("department_id", dept);

    fetch("../../api/queue/add.php",{method:"POST",body:f})
        .then(()=>loadQueue());
}

function transfer(){
    const f=new FormData();
    f.append("patient_id",document.getElementById("patient_id").value);
    f.append("department_id",document.getElementById("new_dept").value);
    fetch("../../api/queue/transfer.php",{method:"POST",body:f});
}
