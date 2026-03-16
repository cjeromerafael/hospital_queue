/**
 * Admin Dashboard: department and user CRUD. Loads departments (table + dropdown)
 * and users on DOMContentLoaded. Used by: public/admin/dashboard.html.
 */
document.addEventListener("DOMContentLoaded", function() {
    checkDailyFlush();
    loadDepartments();
    loadUsers();
    
    // Display logged-in admin info
    const username = localStorage.getItem("username") || "Admin";
    const userInfoEl = document.getElementById("userInfoDisplay");
    if (userInfoEl) {
        userInfoEl.textContent = `Logged in as: ${username} (Administrator)`;
    }
});

/** Auto-flush on page load. Checks if a new day has started and wipes data if needed. */
function checkDailyFlush() {
    fetch("../../api/daily_flush.php")
        .then(r => r.json())
        .then(d => {
            const el = document.getElementById("currentDateDisplay");
            if (el) el.textContent = d.current_date_display || "";
            if (d.flushed) {
                console.log("Daily flush performed (new day).");
                if (typeof loadDepartments === "function") loadDepartments();
                if (typeof loadUsers === "function") loadUsers();
            }
        })
        .catch(err => console.error("Daily flush check failed:", err));
}

/** Manual flush for admins. Wipes all data to start the day. */
function manualFlush() {
    if (!confirm("Are you SURE you want to flush all patient and queue data? This cannot be undone!")) return;
    
    const userId = localStorage.getItem("user_id") || "";
    const f = new FormData();
    f.append("manual", "1");
    f.append("user_id", userId);

    fetch("../../api/daily_flush.php", { method: "POST", body: f })
        .then(r => r.json())
        .then(d => {
            const msgEl = document.getElementById("flushMsg");
            if (d.status === "error") {
                if (msgEl) {
                    msgEl.style.color = "#c62828";
                    msgEl.textContent = d.message || "Flush failed.";
                }
                alert(d.message || "Flush failed.");
            } else {
                if (msgEl) {
                    msgEl.style.color = "#43a047";
                    msgEl.textContent = "All data cleared successfully for " + d.current_date_display;
                }
                alert("All patient and queue data has been cleared.");
                loadDepartments();
                loadUsers();
            }
        })
        .catch(err => {
            console.error("Manual flush failed:", err);
            alert("Request failed. Please check the console for details.");
        });
}

/** Logs out by clearing localStorage and redirecting to index.html. */
function logout() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("department_id");
    localStorage.removeItem("role");
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
        var html="<thead><tr><th>ID</th><th>Name</th><th>Code</th><th class='text-center'>Actions</th></tr></thead><tbody>";
        data.forEach(function(d){
            html+="<tr data-department-id=\""+d.department_id+"\" class='hover:bg-gray-50/50 transition-colors'>"+
                "<td>"+d.department_id+"</td>"+
                "<td class=\"dept-name-cell font-medium\">"+escapeHtml(d.department_name)+"</td>"+
                "<td class=\"dept-code-cell\"><span class='bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold'>"+escapeHtml(d.department_code||"")+"</span></td>"+
                "<td class='flex justify-center gap-2'>"+
                    "<button type=\"button\" class=\"edit-dept-btn btn-ios-secondary !px-4 !py-2\"><svg class='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z' /></svg><span>Edit</span></button>"+
                    "<button type=\"button\" class=\"delete-dept-btn btn-ios-danger !px-4 !py-2\"><svg class='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' /></svg><span>Delete</span></button>"+
                "</td>"+
                "</tr>";
            options+="<option value=\""+d.department_id+"\">"+escapeHtml(d.department_name)+"</option>";
        });
        html += "</tbody>";
        el.innerHTML=html;
        document.getElementById("deptSelect").innerHTML='<option value="0">None</option>' + options;
        html += "</tbody>";
        el.innerHTML=html;
        document.getElementById("deptSelect").innerHTML=options;
        el.querySelectorAll(".edit-dept-btn").forEach(function(btn){
            btn.addEventListener("click", startEditDepartment);
        });
        el.querySelectorAll(".delete-dept-btn").forEach(function(btn){
            btn.addEventListener("click", deleteDepartmentRow);
        });
    })
    .catch(function(){ el.innerHTML="<tr><td colspan=\"4\" class='p-8 text-center text-gray-400'>Could not load departments.</td></tr>"; });
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
    const codeCell=row.querySelector(".dept-code-cell");
    const existingInput=nameCell.querySelector("input.inline-edit-input");
    if(existingInput){
        nameCell.textContent=row.dataset.editOriginalName||"";
        if(codeCell) codeCell.textContent=row.dataset.editOriginalCode||"";
        delete row.dataset.editOriginalName;
        delete row.dataset.editOriginalCode;
        return;
    }
    const currentName=nameCell.textContent;
    const currentCode=codeCell ? codeCell.textContent : "";
    row.dataset.editOriginalName=currentName;
    row.dataset.editOriginalCode=currentCode;
    const input=document.createElement("input");
    input.type="text";
    input.value=currentName;
    input.className="input-ios !px-3 !py-2 !text-sm";
    input.placeholder="Name";
    nameCell.textContent="";
    nameCell.appendChild(input);
    const codeInput=document.createElement("input");
    codeInput.type="text";
    codeInput.value=currentCode;
    codeInput.className="input-ios !px-3 !py-2 !text-sm uppercase";
    codeInput.placeholder="Code";
    codeInput.maxLength=3;
    codeInput.style.width="5em";
    if(codeCell){
        codeCell.textContent="";
        codeCell.appendChild(codeInput);
    }
    input.focus();
    function save(){
        const newName=input.value.trim();
        if(!newName) return;
        const newCode=(codeInput&&codeInput.value.trim()!=="") ? codeInput.value.trim().toUpperCase().substring(0,3) : "";
        fetch("../../api/admin/departments.php",{
            method:"PUT",
            headers:{"Content-Type":"application/x-www-form-urlencoded"},
            body:`department_id=${encodeURIComponent(id)}&department_name=${encodeURIComponent(newName)}&department_code=${encodeURIComponent(newCode)}`
        }).then(()=>loadDepartments());
    }
    input.addEventListener("keydown", function(e){
        if(e.key==="Enter") save();
    });
    if(codeInput) codeInput.addEventListener("keydown", function(e){
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
    const nameEl=document.getElementById("deptName");
    const codeEl=document.getElementById("deptCode");
    const name=nameEl&&nameEl.value ? nameEl.value.trim() : "";
    if(!name) return;
    const f=new FormData();
    f.append("department_name",name);
    if(codeEl&&codeEl.value.trim()!=="") {
        f.append("department_code",codeEl.value.trim().toUpperCase().substring(0,3));
    }
    fetch("../../api/admin/departments.php",{method:"POST",body:f})
    .then(()=>loadDepartments());
}

/** Sets up dashboard visibility based on user department. */
function togglePasswordVisibility(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.type = el.type === "password" ? "text" : "password";
}

/** Fetches users (with department name); fills userTable; wires edit/delete. */
function loadUsers(){
    var el = document.getElementById("userTable");
    if (!el) return;
    fetch("../../api/admin/users.php")
    .then(r=>r.json())
    .then(data=>{
        if (!Array.isArray(data)) return;
        var html="<thead><tr><th>ID</th><th>Username</th><th>Department</th><th>Role</th><th>Password</th><th class='text-center'>Actions</th></tr></thead><tbody>";
        data.forEach(function(u){
            html+="<tr data-user-id=\""+u.user_id+"\" data-department-id=\""+(u.department_id||"")+"\" data-username=\""+escapeHtml(u.username)+"\" data-role=\""+u.role+"\" class='hover:bg-gray-50/50 transition-colors'>"+
                "<td class='text-gray-400 font-mono text-xs'>"+u.user_id+"</td>"+
                "<td class=\"user-username-cell font-bold text-gray-900\">"+escapeHtml(u.username)+"</td>"+
                "<td class=\"user-dept-cell\"><span class='bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold'>"+escapeHtml(u.department_name||"None")+"</span></td>"+
                "<td class=\"user-role-cell uppercase text-[11px] font-black tracking-widest text-gray-400\">"+escapeHtml(u.role)+"</td>"+
                "<td class=\"user-password-cell font-mono text-xs text-gray-400\">"+escapeHtml(u.raw_password||"********")+"</td>"+
                "<td class='flex justify-center gap-2'>"+
                    "<button type=\"button\" class=\"edit-user-btn btn-ios-secondary !px-4 !py-2\"><svg class='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z' /></svg><span>Edit</span></button>"+
                    "<button type=\"button\" class=\"delete-user-btn btn-ios-danger !px-4 !py-2\"><svg class='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' /></svg><span>Delete</span></button>"+
                "</td>"+
                "</tr>";
        });
        html += "</tbody>";
        el.innerHTML=html;
        el.querySelectorAll(".edit-user-btn").forEach(function(btn){
            btn.addEventListener("click", startEditUser);
        });
        el.querySelectorAll(".delete-user-btn").forEach(function(btn){
            btn.addEventListener("click", deleteUserRow);
        });
    })
    .catch(function(err){ 
        console.error("Error loading users:", err);
        el.innerHTML="<tr><td colspan=\"6\" class='p-8 text-center text-gray-400'>Could not load users.</td></tr>"; 
    });
}

function startEditUser(ev){
    const btn=ev.target;
    const row=btn.closest("tr");
    const userId=row.dataset.userId;
    const departmentId=row.dataset.departmentId;
    const username = row.dataset.username;
    const role = row.dataset.role;

    const usernameCell=row.querySelector(".user-username-cell");
    const deptCell=row.querySelector(".user-dept-cell");
    const roleCell=row.querySelector(".user-role-cell");
    const passwordCell=row.querySelector(".user-password-cell");

    if(usernameCell.querySelector("input")){
        loadUsers();
        return;
    }

    // Inline edit for Username
    const usernameInput = document.createElement("input");
    usernameInput.value = username;
    usernameInput.className = "input-ios !px-3 !py-2 !text-sm";
    usernameCell.textContent = "";
    usernameCell.appendChild(usernameInput);

    // Inline edit for Password
    const passwordContainer = document.createElement("div");
    passwordContainer.className = "relative flex items-center";
    
    const passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.placeholder = "New Password";
    passwordInput.className = "input-ios !px-3 !py-2 !text-sm pr-8";
    passwordInput.style.flex = "1";
    
    const toggleIcon = document.createElement("span");
    toggleIcon.innerHTML = "&#128065;";
    toggleIcon.className = "absolute right-2 cursor-pointer select-none text-sm";
    toggleIcon.onclick = () => {
        passwordInput.type = passwordInput.type === "password" ? "text" : "password";
    };

    passwordCell.textContent = "";
    passwordContainer.appendChild(passwordInput);
    passwordContainer.appendChild(toggleIcon);
    passwordCell.appendChild(passwordContainer);

    // Inline edit for Department
    const deptSelect = document.createElement("select");
    deptSelect.className = "input-ios !px-3 !py-2 !text-sm appearance-none";
    deptCell.textContent = "";
    deptCell.appendChild(deptSelect);

    // Inline edit for Role
    const roleSelect = document.createElement("select");
    roleSelect.className = "input-ios !px-3 !py-2 !text-sm appearance-none";
    roleSelect.innerHTML = '<option value="staff">Staff</option><option value="admin">Admin</option>';
    roleSelect.value = role;
    roleCell.textContent = "";
    roleCell.appendChild(roleSelect);

    fetch("../../api/admin/departments.php")
        .then(r=>r.json())
        .then(function(depts){
            let opts = '<option value="0">None</option>';
            depts.forEach(function(d){
                const selAttr=String(d.department_id)===String(departmentId)?" selected":"";
                opts+="<option value=\""+d.department_id+"\""+selAttr+">"+escapeHtml(d.department_name)+"</option>";
            });
            deptSelect.innerHTML=opts;
        });

    function save(){
        const newUsername = usernameInput.value.trim();
        const newPassword = passwordInput.value.trim();
        const newDeptId = deptSelect.value;
        const newRole = roleSelect.value;

        if(!newUsername) return;

        let body = `user_id=${encodeURIComponent(userId)}&username=${encodeURIComponent(newUsername)}&department_id=${encodeURIComponent(newDeptId)}&role=${encodeURIComponent(newRole)}`;
        if(newPassword) {
            body += `&password=${encodeURIComponent(newPassword)}`;
        }

        fetch("../../api/admin/users.php",{
            method:"PUT",
            headers:{"Content-Type":"application/x-www-form-urlencoded"},
            body: body
        }).then(()=>loadUsers());
    }

    usernameInput.addEventListener("keydown", e => e.key === "Enter" && save());
    passwordInput.addEventListener("keydown", e => e.key === "Enter" && save());
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
    const username = document.getElementById("userUsername").value.trim();
    const password = document.getElementById("userPassword").value.trim();
    const deptId = document.getElementById("deptSelect").value;
    const role = document.getElementById("userRole").value;

    if(!username || !password) {
        alert("Username and Password are required.");
        return;
    }

    const f=new FormData();
    f.append("username", username);
    f.append("password", password);
    f.append("department_id", deptId);
    f.append("role", role);

    fetch("../../api/admin/users.php",{method:"POST",body:f})
    .then(r => r.json())
    .then(d => {
        if(d.status === "success") {
            document.getElementById("userUsername").value = "";
            document.getElementById("userPassword").value = "";
            loadUsers();
        } else {
            alert(d.message || "Error creating user");
        }
    });
}
