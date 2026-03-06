/**
 * Staff login: POST user_id to auth/login.php; on success stores user_id, department_id,
 * role and redirects to admin or staff dashboard. Used in public/index.html.
 */
function login(){
    const user_id = document.getElementById("user_id").value;

    const form = new FormData();
    form.append("user_id", user_id);

    fetch("../api/auth/login.php", {
        method: "POST",
        body: form
    })
    .then(res => res.json())
    .then(data => {

        if(data.status === "success"){

            localStorage.setItem("user_id", data.user_id);
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
    });
}
