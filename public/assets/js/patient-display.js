/**
 * Queue display screen: video left, queue info + waiting list right.
 * Department from URL ?dept= or ?department_id= or localStorage. Polls every 1.5s.
 */
document.addEventListener('DOMContentLoaded', function(){
    loadQueue();
    setInterval(loadQueue, 1500);
});

/** Loads and displays the current queue for the selected department. */
function loadQueue(){
    const params = new URLSearchParams(location.search);
    const dept = params.get('dept') || params.get('department_id') || localStorage.getItem('department_id');
    const currentEl = document.getElementById('display_current');
    const infoEl = document.getElementById('display_info');

    if(!dept){
        if(currentEl) currentEl.innerText = 'None';
        if(infoEl) infoEl.innerHTML = '';
        return;
    }

    fetch(`../../api/queue/view.php?department_id=${dept}&_=${Date.now()}`)
     .then(r=>r.json())
     .then(data=>{
         const cur = data.find(q=>q.status==='serving');

         if(cur){
             currentEl.innerText = '#' + cur.queue_number;
             const patientNum = cur.patient_number || cur.patient_id || '';
             const deptName = cur.patient_department_name || ('Department ' + (cur.patient_department_id || ''));
             infoEl.innerHTML = '<div><span class="label">Department: </span>' + escapeHtml(deptName) + '</div>';
         } else {
             currentEl.innerText = 'None';
             infoEl.innerHTML = '';
         }

         // Update general waiting queue on the right
         const table = document.getElementById('display_waiting');
         if(table){
             const waiting = data.filter(q=>q.status==='waiting').slice(0,20);
             if(waiting.length === 0){
                 table.innerHTML = '<tr><td style="font-size:1.1em;color:#ccc;">No waiting entries</td></tr>';
             } else {
                let html = '<tr><th>Queue No</th><th>Patient No</th><th>Patient Name</th><th>Department</th></tr>';
                waiting.forEach(w=>{
                    const patientNo = w.patient_number || w.patient_id || '';
                    html += '<tr>' +
                        '<td>' + escapeHtml(String(w.queue_number || '')) + '</td>' +
                        '<td>' + escapeHtml(String(patientNo)) + '</td>' +
                        '<td>' + escapeHtml(String(w.patient_name || '')) + '</td>' +
                        '<td>' + escapeHtml(String(w.patient_department_name || '')) + '</td>' +
                        '</tr>';
                 });
                 table.innerHTML = html;
             }
         }

         // Update finance department queues on the left
         updateFinanceQueues(data);

         fetch(`../../api/queue/event.php?department_id=${dept}`)
            .then(r=>r.json())
            .then(ev=>{
                if(ev && ev.type === 'skipped'){
                    showEventBanner(ev);
                }
            }).catch(function(){});
     }).catch(function(){
         if(infoEl) infoEl.innerHTML = '';
         var table = document.getElementById('display_waiting');
         if(table) table.innerHTML = '<tr><td style="font-size:1.1em;color:#ccc;">Unable to load queue</td></tr>';
     });
}

/** Shows a banner with the number of skipped and requeued patients. */
function showEventBanner(ev){
    const el = document.getElementById('event_banner');
    if(!el) return;
    const skipped = ev.skipped_number ? ('#' + ev.skipped_number) : '';
    const requeued = ev.requeued_number ? ('#' + ev.requeued_number) : '';
    el.textContent = 'Skipped ' + skipped + '-> Requeued as ' + requeued;
    el.style.display = 'block';
    el.style.opacity = 1;
    setTimeout(function(){
        el.style.transition = 'opacity 0.8s';
        el.style.opacity = 0;
        setTimeout(function(){ el.style.display = 'none'; }, 800);
    }, 8000);
}

/** Updates the finance department queues on the left side. */
function updateFinanceQueues(data){
    const financeQueues = {
        'billing-admission': 'Billing - Admission',
        'billing-opd': 'Billing - OPD',
        'cashier': 'Cashier',
        'medical-social-services': 'Medical Social Services'
    };

    Object.keys(financeQueues).forEach(queueId => {
        const table = document.getElementById(queueId);
        if(table){
            const waiting = data.filter(q => q.status === 'waiting' && q.patient_department_name === financeQueues[queueId]).slice(0,10);
            if(waiting.length === 0){
                table.innerHTML = '<tr><td style="font-size:1.1em;color:#ccc;">No waiting entries</td></tr>';
            } else {
                let html = '<tr><th>Queue No</th><th>Patient No</th><th>Patient Name</th></tr>';
                waiting.forEach(w => {
                    const patientNo = w.patient_number || w.patient_id || '';
                    html += '<tr>' +
                        '<td>' + escapeHtml(String(w.queue_number || '')) + '</td>' +
                        '<td>' + escapeHtml(String(patientNo)) + '</td>' +
                        '<td>' + escapeHtml(String(w.patient_name || '')) + '</td>' +
                        '</tr>';
                });
                table.innerHTML = html;
            }
        }
    });
}

/** Escape HTML for safe display (XSS). */
function escapeHtml(s){
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}
