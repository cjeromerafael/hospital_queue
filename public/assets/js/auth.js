/**
 * Staff login: POST username and password to auth/login.php; on success stores user info,
 * role and redirects to admin or staff dashboard. Used in public/index.html.
 */
function login(){
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        document.getElementById("msg").innerText = "Username and password required.";
        return;
    }

    const form = new FormData();
    form.append("username", username);
    form.append("password", password);

    fetch("../api/auth/login.php", {
        method: "POST",
        body: form
    })
    .then(res => res.json())
    .then(data => {

        if(data.status === "success"){

            localStorage.setItem("user_id", data.user_id);
            localStorage.setItem("username", data.username);
            localStorage.setItem("department_id", data.department_id);
            localStorage.setItem("role", data.department_role);

            if(data.department_role === "admin"){
                window.location = "admin/dashboard.html";
            } else {
                window.location = "staff/dashboard.html";
            }

        } else {
            document.getElementById("msg").innerText = data.message;
        }
    })
    .catch(err => {
        console.error("Login error:", err);
        document.getElementById("msg").innerText = "Login failed. Please try again.";
    });
}

document.addEventListener("DOMContentLoaded", function() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    if (usernameInput) {
        usernameInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") login();
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") login();
        });
    }
});
