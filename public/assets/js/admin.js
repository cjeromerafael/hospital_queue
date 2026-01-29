loadDepartments();
loadUsers();

function logout() {
    localStorage.removeItem("admin_id");
    window.location.href = "../index.html";
}


function loadDepartments(){
    fetch("../../api/admin/departments.php")
    .then(r=>r.json())
    .then(data=>{
        let html="<tr><th>ID</th><th>Name</th></tr>";
        let options="";

        data.forEach(d=>{
            html+=`<tr><td>${d.department_id}</td><td>${d.department_name}</td></tr>`;
            options+=`<option value="${d.department_id}">${d.department_name}</option>`;
        });

        document.getElementById("deptTable").innerHTML=html;
        document.getElementById("deptSelect").innerHTML=options;
        const userDeptEdit = document.getElementById("userDeptEdit");
        if (userDeptEdit) {
            userDeptEdit.innerHTML = options;
        }
    });
}

function addDepartment(){
    const f=new FormData();
    f.append("department_name",document.getElementById("deptName").value);

    fetch("../../api/admin/departments.php",{method:"POST",body:f})
    .then(()=>loadDepartments());
}

function updateDepartment(){
    const id   = document.getElementById("deptIdEdit").value;
    const name = document.getElementById("deptNameEdit").value;

    if(!id || !name) return;

    fetch("../../api/admin/departments.php",{
        method:"PUT",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:`department_id=${encodeURIComponent(id)}&department_name=${encodeURIComponent(name)}`
    }).then(()=>loadDepartments());
}

function deleteDepartment(){
    const id = document.getElementById("deptIdEdit").value;
    if(!id) return;

    fetch("../../api/admin/departments.php",{
        method:"DELETE",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:`department_id=${encodeURIComponent(id)}`
    }).then(()=>loadDepartments());
}

function loadUsers(){
    fetch("../../api/admin/users.php")
    .then(r=>r.json())
    .then(data=>{
        let html="<tr><th>ID</th><th>Name</th></tr>";
        data.forEach(u=>{
            html+=`<tr><td>${u.user_id}</td><td>${u.name}</td></tr>`;
        });
        document.getElementById("userTable").innerHTML=html;
    });
}

function addUser(){
    const f=new FormData();
    f.append("name",document.getElementById("userName").value);
    f.append("department_id",document.getElementById("deptSelect").value);

    fetch("../../api/admin/users.php",{method:"POST",body:f})
    .then(()=>loadUsers());
}

function updateUser(){
    const id   = document.getElementById("userIdEdit").value;
    const name = document.getElementById("userNameEdit").value;
    const dept = document.getElementById("userDeptEdit").value;

    if(!id || !name || !dept) return;

    fetch("../../api/admin/users.php",{
        method:"PUT",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:
            `user_id=${encodeURIComponent(id)}`+
            `&name=${encodeURIComponent(name)}`+
            `&department_id=${encodeURIComponent(dept)}`
    }).then(()=>loadUsers());
}

function deleteUser(){
    const id = document.getElementById("userIdEdit").value;
    if(!id) return;

    fetch("../../api/admin/users.php",{
        method:"DELETE",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:`user_id=${encodeURIComponent(id)}`
    }).then(()=>loadUsers());
}
