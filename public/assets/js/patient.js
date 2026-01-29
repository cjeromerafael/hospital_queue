function register(){

    const f=new FormData();
    f.append("user_id",document.getElementById("user_id").value);

    fetch("../../api/patient/register.php",{method:"POST",body:f})
    .then(r=>r.json())
    .then(d=>{
        document.getElementById("result").innerText =
        "Your Queue Number: "+d.queue_number;
    });
}
