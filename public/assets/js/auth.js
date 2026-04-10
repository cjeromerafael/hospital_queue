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
        credentials: "same-origin",
        body: form
    })
    .then(async res => {
        // The endpoint should return JSON, but if PHP fatals we may get an empty body.
        const text = await res.text();
        if (!text) {
            throw new Error(`Login failed with HTTP ${res.status} (empty response).`);
        }
        try {
            return JSON.parse(text);
        } catch (e) {
            // Helpful when the backend returns HTML.
            throw new Error(`Login failed: backend returned non-JSON response.`);
        }
    })
    .then(data => {

        if(data.status === "success"){

            localStorage.setItem("user_id", data.user_id);
            localStorage.setItem("username", data.username);
            localStorage.setItem("department_id", data.department_id);
            localStorage.setItem("role", data.department_role);

            if(data.department_role === "sysadmin"){
                window.location = "admin/dashboard.html";
            } else {
                window.location = "staff/dashboard_v2.html";
            }

        } else {
            document.getElementById("msg").innerText = data.message;
        }
    })
    .catch(err => {
        console.error("Login error:", err);
        document.getElementById("msg").innerText = err.message || "Login failed. Please try again.";
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