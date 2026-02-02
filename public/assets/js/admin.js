/**
 * Admin Dashboard: department and user CRUD. Loads departments (table + dropdown)
 * and users on DOMContentLoaded. Used by: public/admin/dashboard.html.
 */
document.addEventListener("DOMContentLoaded", function() {
    loadDepartments();
    loadUsers();
});

/** Logs out by clearing localStorage and redirecting to index.html. */
function logout() {
    localStorage.removeItem("admin_id");
    window.location.href = "../index.html";
}

/** Fetches departments; fills deptTable and deptSelect; wires edit/delete. */
function loadDepartments(){
    var el = document.getElementById("deptTable");
    if (!el) return;
    fetch("../../api/admin/departments.php")
    .then(r=>r.json())
    .then(data=>{
        if (!Array.isArray(data)) return;
        var options="";
        var html="<tr><th>ID</th><th>Name</th><th>Edit</th><th>Delete</th></tr>";
        data.forEach(function(d){
            html+="<tr data-department-id=\""+d.department_id+"\">"+
                "<td>"+d.department_id+"</td>"+
                "<td class=\"dept-name-cell td-scroll\">"+escapeHtml(d.department_name)+"</td>"+
                "<td style=\"min-width:72px;text-align:center\"><button type=\"button\" class=\"edit-dept-btn\">Edit</button></td>"+
                "<td style=\"min-width:72px;text-align:center\"><button type=\"button\" class=\"delete-dept-btn\">Delete</button></td>"+
                "</tr>";
            options+="<option value=\""+d.department_id+"\">"+escapeHtml(d.department_name)+"</option>";
        });
        el.innerHTML=html;
        document.getElementById("deptSelect").innerHTML=options;
        el.querySelectorAll(".edit-dept-btn").forEach(function(btn){
            btn.addEventListener("click", startEditDepartment);
        });
        el.querySelectorAll(".delete-dept-btn").forEach(function(btn){
            btn.addEventListener("click", deleteDepartmentRow);
        });
    })
    .catch(function(){ el.innerHTML="<tr><td colspan=\"4\">Could not load departments.</td></tr>"; });
}

/** Escape HTML for safe display (XSS). */
function escapeHtml(s){
    const div=document.createElement("div");
    div.textContent=s;
    return div.innerHTML;
}

function startEditDepartment(ev){
    const btn=ev.target;
    const row=btn.closest("tr");
    const id=row.dataset.departmentId;
    const nameCell=row.querySelector(".dept-name-cell");
    const existingInput=nameCell.querySelector("input.inline-edit-input");
    if(existingInput){
        nameCell.textContent=row.dataset.editOriginalName||"";
        delete row.dataset.editOriginalName;
        return;
    }
    const currentName=nameCell.textContent;
    row.dataset.editOriginalName=currentName;
    const input=document.createElement("input");
    input.type="text";
    input.value=currentName;
    input.className="inline-edit-input";
    nameCell.textContent="";
    nameCell.appendChild(input);
    input.focus();
    function save(){
        const newName=input.value.trim();
        if(!newName) return;
        fetch("../../api/admin/departments.php",{
            method:"PUT",
            headers:{"Content-Type":"application/x-www-form-urlencoded"},
            body:`department_id=${encodeURIComponent(id)}&department_name=${encodeURIComponent(newName)}`
        }).then(()=>loadDepartments());
    }
    input.addEventListener("keydown", function(e){
        if(e.key==="Enter") save();
    });
}

function deleteDepartmentRow(ev){
    const row=ev.target.closest("tr");
    const id=row.dataset.departmentId;
    if(!confirm("Delete this department?")) return;
    fetch("../../api/admin/departments.php",{
        method:"DELETE",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:`department_id=${encodeURIComponent(id)}`
    }).then(()=>loadDepartments());
}

function addDepartment(){
    const f=new FormData();
    f.append("department_name",document.getElementById("deptName").value);
    fetch("../../api/admin/departments.php",{method:"POST",body:f})
    .then(()=>loadDepartments());
}

/** Fetches users (with department name); fills userTable; wires edit/delete. */
function loadUsers(){
    var el = document.getElementById("userTable");
    if (!el) return;
    fetch("../../api/admin/users.php")
    .then(r=>r.json())
    .then(data=>{
        if (!Array.isArray(data)) return;
        var html="<tr><th>ID</th><th>Name</th><th>Department</th><th>Edit</th><th>Delete</th></tr>";
        data.forEach(function(u){
            html+="<tr data-user-id=\""+u.user_id+"\" data-department-id=\""+(u.department_id||"")+"\">"+
                "<td>"+u.user_id+"</td>"+
                "<td class=\"user-name-cell td-scroll\">"+escapeHtml(u.name)+"</td>"+
                "<td class=\"td-scroll\">"+escapeHtml(u.department_name||u.department_id||"")+"</td>"+
                "<td style=\"min-width:72px;text-align:center\"><button type=\"button\" class=\"edit-user-btn\">Edit</button></td>"+
                "<td style=\"min-width:72px;text-align:center\"><button type=\"button\" class=\"delete-user-btn\">Delete</button></td>"+
                "</tr>";
        });
        el.innerHTML=html;
        el.querySelectorAll(".edit-user-btn").forEach(function(btn){
            btn.addEventListener("click", startEditUser);
        });
        el.querySelectorAll(".delete-user-btn").forEach(function(btn){
            btn.addEventListener("click", deleteUserRow);
        });
    })
    .catch(function(){ el.innerHTML="<tr><td colspan=\"5\">Could not load users.</td></tr>"; });
}

function startEditUser(ev){
    const btn=ev.target;
    const row=btn.closest("tr");
    const userId=row.dataset.userId;
    const departmentId=row.dataset.departmentId;
    const nameCell=row.querySelector(".user-name-cell");
    const existingInput=nameCell.querySelector("input.inline-edit-input");
    if(existingInput){
        nameCell.textContent=row.dataset.editOriginalName||"";
        delete row.dataset.editOriginalName;
        return;
    }
    const currentName=nameCell.textContent;
    row.dataset.editOriginalName=currentName;
    const input=document.createElement("input");
    input.type="text";
    input.value=currentName;
    input.className="inline-edit-input";
    nameCell.textContent="";
    nameCell.appendChild(input);
    input.focus();
    function save(){
        const newName=input.value.trim();
        if(!newName) return;
        fetch("../../api/admin/users.php",{
            method:"PUT",
            headers:{"Content-Type":"application/x-www-form-urlencoded"},
            body:`user_id=${encodeURIComponent(userId)}&name=${encodeURIComponent(newName)}&department_id=${encodeURIComponent(departmentId)}`
        }).then(()=>loadUsers());
    }
    input.addEventListener("keydown", function(e){
        if(e.key==="Enter") save();
    });
}

function deleteUserRow(ev){
    const row=ev.target.closest("tr");
    const id=row.dataset.userId;
    if(!confirm("Delete this user?")) return;
    fetch("../../api/admin/users.php",{
        method:"DELETE",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:`user_id=${encodeURIComponent(id)}`
    }).then(()=>loadUsers());
}

function addUser(){
    const f=new FormData();
    f.append("name",document.getElementById("userName").value);
    f.append("department_id",document.getElementById("deptSelect").value);
    fetch("../../api/admin/users.php",{method:"POST",body:f})
    .then(()=>loadUsers());
}
