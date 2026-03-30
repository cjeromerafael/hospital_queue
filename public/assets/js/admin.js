/**
 * Admin Dashboard: department and user CRUD.
 * Used by: public/admin/dashboard.html
 */
let departmentsData = [];
let adminDeptId = 0;

document.addEventListener("DOMContentLoaded", function () {
    checkDailyFlush();
    loadDepartments();
    loadUsers();

    const username = localStorage.getItem("username") || "Admin";
    const el = document.getElementById("userInfoDisplay");
    if (el) el.textContent = `${username} (Administrator)`;
});

function normalizeHex(color) {
    if (!color || typeof color !== "string") return "#062e6f";
    const t = color.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(t)) return t;
    if (/^#[0-9a-f]{3}$/.test(t)) return "#" + t[1]+t[1]+t[2]+t[2]+t[3]+t[3];
    return "#062e6f";
}

function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
}

function checkDailyFlush() {
    fetch("../../api/daily_flush.php")
        .then(r => r.json())
        .then(d => {
            const el = document.getElementById("currentDateDisplay");
            if (el) el.textContent = d.current_date_display || "";
        })
        .catch(err => console.error("Daily flush check failed:", err));
}

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
                if (msgEl) { msgEl.style.color = "#c62828"; msgEl.textContent = d.message || "Flush failed."; }
                alert(d.message || "Flush failed.");
            } else {
                if (msgEl) { msgEl.style.color = "#43a047"; msgEl.textContent = "Cleared for " + d.current_date_display; }
                alert("All patient and queue data has been cleared.");
                loadDepartments();
                loadUsers();
            }
        })
        .catch(err => { console.error("Manual flush failed:", err); alert("Request failed."); });
}

function logout() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("department_id");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    window.location.href = "../index.html";
}

/* ─── DEPARTMENTS ─────────────────────────────────────────────── */

function loadDepartments() {
    const el = document.getElementById("deptTable");
    if (!el) return;

    fetch("../../api/admin/departments.php")
        .then(r => r.json())
        .then(data => {
            if (!Array.isArray(data)) return;
            departmentsData = data;

            // Find Admin department ID for admin/sysadmin users
            const adminDept = data.find(d => d.department_name && d.department_name.toLowerCase() === 'admin');
            if (adminDept) adminDeptId = adminDept.department_id;

            // Rebuild the user-create department dropdown (separate element: #userDeptSelect)
            const userDeptSel = document.getElementById("userDeptSelect");
            if (userDeptSel) {
                let opts = '<option value="0">None</option>';
                data.forEach(d => {
                    if ((d.department_name || "").trim().toLowerCase() === "admin") return;
                    opts += `<option value="${d.department_id}">${escapeHtml(d.department_name)}</option>`;
                });
                userDeptSel.innerHTML = opts;
            }

            let html = `<thead><tr>
                <th>ID</th><th>Name</th>
                <th class="text-center">Color</th>
                <th class="text-center">Type</th>
                <th class="text-center">Actions</th>
            </tr></thead><tbody>`;

            data.forEach(d => {
                const typePill = d.is_finance == 1
                    ? "<span class='bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-100'>Finance</span>"
                    : "<span class='bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-blue-100'>Medical</span>";
                const deptColor = normalizeHex(d.department_color);

                html += `<tr
                    data-department-id="${d.department_id}"
                    data-is-finance="${d.is_finance}"
                    data-dept-color="${deptColor}"
                    class="hover:bg-gray-50/50 transition-colors">
                    <td>${d.department_id}</td>
                    <td class="dept-name-cell font-medium">${escapeHtml(d.department_name)}</td>
                    <td class="dept-color-cell text-center">
                        <div style="width:32px;height:32px;background-color:${deptColor};border-radius:0.5rem;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.1);margin:0 auto;"></div>
                    </td>
                    <td class="dept-finance-cell text-center">${typePill}</td>
                    <td class="flex justify-center gap-2">
                        <button type="button" class="edit-dept-btn btn-ios-secondary !px-4 !py-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"/></svg>
                            <span>Edit</span>
                        </button>
                        <button type="button" class="delete-dept-btn btn-ios-danger !px-4 !py-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            <span>Delete</span>
                        </button>
                    </td>
                </tr>`;
            });

            html += "</tbody>";
            el.innerHTML = html;

            el.querySelectorAll(".edit-dept-btn").forEach(btn => btn.addEventListener("click", startEditDepartment));
            el.querySelectorAll(".delete-dept-btn").forEach(btn => btn.addEventListener("click", deleteDepartmentRow));
        })
        .catch(() => { el.innerHTML = "<tr><td colspan='5' class='p-8 text-center text-gray-400'>Could not load departments.</td></tr>"; });
}

function startEditDepartment(ev) {
    const btn = ev.target.closest("button");
    const row = btn.closest("tr");
    const id = row.dataset.departmentId;
    const nameCell = row.querySelector(".dept-name-cell");
    const financeCell = row.querySelector(".dept-finance-cell");
    const colorCell = row.querySelector(".dept-color-cell");
    const actionsCell = row.querySelector("td:last-child");

    if (nameCell.querySelector("input.inline-edit-input")) { loadDepartments(); return; }

    const currentColor = normalizeHex(row.dataset.deptColor);

    const input = document.createElement("input");
    input.type = "text"; input.value = nameCell.textContent;
    input.className = "input-ios inline-edit-input !px-3 !py-2 !text-sm"; input.placeholder = "Name";
    nameCell.textContent = ""; nameCell.appendChild(input);

    const financeCheck = document.createElement("input");
    financeCheck.type = "checkbox"; financeCheck.checked = row.dataset.isFinance == "1"; financeCheck.className = "w-4 h-4";
    if (financeCell) { financeCell.textContent = ""; financeCell.appendChild(financeCheck); }

    let colorInput = null;
    if (colorCell) {
        colorInput = document.createElement("input");
        colorInput.type = "color"; colorInput.value = currentColor;
        colorInput.style = "width:60px;height:40px;cursor:pointer;border:1px solid #e2e8f0;border-radius:0.5rem;padding:0;";
        colorCell.textContent = ""; colorCell.appendChild(colorInput);
    }

    function save() {
        const newName = input.value.trim();
        if (!newName) return;
        fetch("../../api/admin/departments.php", {
            method: "PUT",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `department_id=${encodeURIComponent(id)}&department_name=${encodeURIComponent(newName)}&is_finance=${financeCheck.checked ? 1 : 0}&department_color=${encodeURIComponent(normalizeHex(colorInput?.value || "#062e6f"))}`
        }).then(() => loadDepartments());
    }

    input.addEventListener("keydown", e => e.key === "Enter" && save());

    if (actionsCell) {
        actionsCell.innerHTML = "";
        actionsCell.className = "flex justify-center gap-2";
        const saveBtn = document.createElement("button"); saveBtn.type = "button";
        saveBtn.className = "btn-ios btn-ios-primary !px-4 !py-2"; saveBtn.textContent = "Save";
        saveBtn.addEventListener("click", save);
        const cancelBtn = document.createElement("button"); cancelBtn.type = "button";
        cancelBtn.className = "btn-ios btn-ios-secondary !px-4 !py-2"; cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => loadDepartments());
        actionsCell.appendChild(saveBtn); actionsCell.appendChild(cancelBtn);
    }
    input.focus();
}

function deleteDepartmentRow(ev) {
    const row = ev.target.closest("tr");
    const id = row.dataset.departmentId;
    if (!confirm("Delete this department?")) return;
    fetch("../../api/admin/departments.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `department_id=${encodeURIComponent(id)}`
    }).then(() => loadDepartments());
}

function addDepartment() {
    const nameEl = document.getElementById("deptName");
    const colorEl = document.getElementById("deptColor");
    const isFinanceEl = document.getElementById("deptIsFinance");
    const name = nameEl?.value.trim() || "";
    if (!name) { alert("Department name is required."); return; }

    const f = new FormData();
    f.append("department_name", name);
    f.append("is_finance", isFinanceEl?.checked ? 1 : 0);
    f.append("department_color", normalizeHex(colorEl?.value || "#062e6f"));

    fetch("../../api/admin/departments.php", { method: "POST", body: f })
        .then(() => {
            nameEl.value = "";
            if (colorEl) colorEl.value = "#062e6f";
            if (isFinanceEl) isFinanceEl.checked = false;
            loadDepartments();
        });
}

/* ─── USERS ───────────────────────────────────────────────────── */

function togglePasswordVisibility(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.type = el.type === "password" ? "text" : "password";
}

function toggleUserDeptVisibility() {
    const role = document.getElementById("userRole")?.value;
    const container = document.getElementById("deptSelectContainer");
    if (!container) return;
    container.classList.toggle("hidden", role === "admin" || role === "sysadmin");
}

function loadUsers() {
    const el = document.getElementById("userTable");
    if (!el) return;

    fetch("../../api/admin/users.php")
        .then(r => r.json())
        .then(data => {
            if (!Array.isArray(data)) { el.innerHTML = "<tr><td colspan='6' class='p-8 text-center text-gray-400'>No users found.</td></tr>"; return; }

            let html = `<thead><tr>
                <th>ID</th><th>Username</th><th>Department</th>
                <th>Role</th><th>Password</th>
                <th class="text-center">Actions</th>
            </tr></thead><tbody>`;

            data.forEach(u => {
                html += `<tr
                    data-user-id="${u.user_id}"
                    data-department-id="${u.department_id || 0}"
                    data-role="${escapeHtml(u.role)}"
                    class="hover:bg-gray-50/50 transition-colors">
                    <td class="text-gray-400 font-mono text-xs">${u.user_id}</td>
                    <td class="user-username-cell font-bold text-gray-900">${escapeHtml(u.username)}</td>
                    <td class="user-dept-cell"><span class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">${escapeHtml(u.department_name || "None")}</span></td>
                    <td class="user-role-cell uppercase text-[11px] font-black tracking-widest text-gray-400">${escapeHtml(u.role)}</td>
                    <td class="user-password-cell font-mono text-xs text-gray-400">${escapeHtml(u.raw_password || "********")}</td>
                    <td class="flex justify-center gap-2">
                        <button type="button" class="edit-user-btn btn-ios-secondary !px-4 !py-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"/></svg>
                            <span>Edit</span>
                        </button>
                        <button type="button" class="delete-user-btn btn-ios-danger !px-4 !py-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            <span>Delete</span>
                        </button>
                    </td>
                </tr>`;
            });

            html += "</tbody>";
            el.innerHTML = html;

            el.querySelectorAll(".edit-user-btn").forEach(btn => btn.addEventListener("click", startEditUser));
            el.querySelectorAll(".delete-user-btn").forEach(btn => btn.addEventListener("click", deleteUserRow));
        })
        .catch(err => {
            console.error("Error loading users:", err);
            el.innerHTML = "<tr><td colspan='6' class='p-8 text-center text-gray-400'>Could not load users.</td></tr>";
        });
}

function startEditUser(ev) {
    const btn = ev.target.closest("button");
    const row = btn ? btn.closest("tr") : null;
    if (!row) return;

    const userId       = row.dataset.userId;
    const departmentId = row.dataset.departmentId;
    const role         = row.dataset.role;

    const usernameCell = row.querySelector(".user-username-cell");
    const deptCell     = row.querySelector(".user-dept-cell");
    const roleCell     = row.querySelector(".user-role-cell");
    const passwordCell = row.querySelector(".user-password-cell");
    const actionsCell  = row.querySelector("td:last-child");

    if (usernameCell.querySelector("input")) { loadUsers(); return; }

    const currentUsername = usernameCell.textContent.trim();

    const usernameInput = document.createElement("input");
    usernameInput.type = "text"; usernameInput.value = currentUsername;
    usernameInput.className = "input-ios !px-3 !py-2 !text-sm";
    usernameCell.textContent = ""; usernameCell.appendChild(usernameInput);

    const pwWrap = document.createElement("div");
    pwWrap.className = "relative flex items-center";
    const passwordInput = document.createElement("input");
    passwordInput.type = "password"; passwordInput.placeholder = "New password (leave blank to keep)";
    passwordInput.className = "input-ios !px-3 !py-2 !text-sm";
    passwordInput.style.flex = "1";
    const eyeBtn = document.createElement("span");
    eyeBtn.innerHTML = "&#128065;"; eyeBtn.className = "absolute right-2 cursor-pointer select-none text-sm";
    eyeBtn.onclick = () => { passwordInput.type = passwordInput.type === "password" ? "text" : "password"; };
    pwWrap.appendChild(passwordInput); pwWrap.appendChild(eyeBtn);
    passwordCell.textContent = ""; passwordCell.appendChild(pwWrap);

    const roleSelect = document.createElement("select");
    roleSelect.className = "input-ios !px-3 !py-2 !text-sm appearance-none";
    roleSelect.innerHTML = '<option value="staff">Staff</option><option value="admin">Admin</option><option value="sysadmin">SysAdmin</option>';
    roleCell.textContent = ""; roleCell.appendChild(roleSelect);
    roleSelect.value = role;

    // Update department selection when role changes
    roleSelect.addEventListener('change', () => {
        if (roleSelect.value === 'admin') {
            deptSelect.value = adminDeptId;
            deptSelect.disabled = true;
        } else if (roleSelect.value === 'sysadmin') {
            deptSelect.value = "";
            deptSelect.disabled = true;
        } else {
            deptSelect.disabled = false;
        }
    });

    const deptSelect = document.createElement("select");
    deptSelect.className = "input-ios !px-3 !py-2 !text-sm appearance-none";
    deptCell.textContent = ""; deptCell.appendChild(deptSelect);

    let deptOpts = '<option value="0">None</option>';
    departmentsData.forEach(d => {
        if ((d.department_name || "").trim().toLowerCase() === "admin") return;
        const sel = String(d.department_id) === String(departmentId) ? " selected" : "";
        deptOpts += `<option value="${d.department_id}"${sel}>${escapeHtml(d.department_name)}</option>`;
    });
    deptSelect.innerHTML = deptOpts;

    // Handle admin/sysadmin department assignment
    if (role === 'admin') {
        deptSelect.value = adminDeptId;
        deptSelect.disabled = true;
    } else if (role === 'sysadmin') {
        deptSelect.value = "";
        deptSelect.disabled = true;
    } else {
        deptSelect.disabled = false;
    }

    function save() {
        const newUsername = usernameInput.value.trim();
        if (!newUsername) { alert("Username cannot be empty."); return; }

        if (roleSelect.value === "staff" && deptSelect.value == 0) { alert("Staff must be assigned to a department."); return; }

        let body = `user_id=${encodeURIComponent(userId)}&username=${encodeURIComponent(newUsername)}&department_id=${encodeURIComponent(deptSelect.value)}&role=${encodeURIComponent(roleSelect.value)}`;
        const newPassword = passwordInput.value.trim();
        if (newPassword) body += `&password=${encodeURIComponent(newPassword)}`;

        fetch("../../api/admin/users.php", {
            method: "PUT",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body
        })
        .then(r => r.json())
        .then(d => {
            if (d.status === "error") { alert(d.message || "Update failed."); return; }
            loadUsers();
        })
        .catch(err => { console.error("Update failed:", err); alert("Request failed."); });
    }

    [usernameInput, passwordInput, deptSelect, roleSelect].forEach(el => {
        el.addEventListener("keydown", e => e.key === "Enter" && save());
    });

    if (actionsCell) {
        actionsCell.innerHTML = "";
        actionsCell.className = "flex justify-center gap-2";

        const saveBtn = document.createElement("button"); saveBtn.type = "button";
        saveBtn.className = "btn-ios btn-ios-primary !px-4 !py-2"; saveBtn.textContent = "Save";
        saveBtn.addEventListener("click", save);

        const cancelBtn = document.createElement("button"); cancelBtn.type = "button";
        cancelBtn.className = "btn-ios btn-ios-secondary !px-4 !py-2"; cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => loadUsers());

        actionsCell.appendChild(saveBtn);
        actionsCell.appendChild(cancelBtn);
    }

    usernameInput.focus();
}

function deleteUserRow(ev) {
    const row = ev.target.closest("tr");
    const id = row?.dataset.userId;
    if (!id || !confirm("Delete this user?")) return;
    fetch("../../api/admin/users.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `user_id=${encodeURIComponent(id)}`
    })
    .then(r => r.json())
    .then(d => { if (d.status === "error") alert(d.message); else loadUsers(); })
    .catch(err => { console.error("Delete failed:", err); alert("Request failed."); });
}

function addUser() {
    const usernameEl = document.getElementById("userUsername");
    const passwordEl = document.getElementById("userPassword");
    const roleEl     = document.getElementById("userRole");
    const deptEl     = document.getElementById("userDeptSelect");

    const username = usernameEl?.value.trim() || "";
    const password = passwordEl?.value.trim() || "";
    const role     = roleEl?.value || "staff";
    let   deptId   = (role === "admin") ? adminDeptId : (role === "sysadmin") ? "" : (deptEl?.value || 0);

    if (role === "staff" && deptId == 0) { alert("Staff must be assigned to a department."); return; }

    if (!username || !password) { alert("Username and Password are required."); return; }

    const f = new FormData();
    f.append("username", username);
    f.append("password", password);
    f.append("department_id", deptId);
    f.append("role", role);

    fetch("../../api/admin/users.php", { method: "POST", body: f })
        .then(r => r.json())
        .then(d => {
            if (d.status === "success") {
                if (usernameEl) usernameEl.value = "";
                if (passwordEl) passwordEl.value = "";
                loadUsers();
            } else {
                alert(d.message || "Error creating user");
            }
        })
        .catch(err => { console.error("Create user failed:", err); alert("Request failed."); });
}