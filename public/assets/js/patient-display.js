/**
 * Queue display screen: video left, queue info + waiting list right.
 * Department from URL ?dept= or ?department_id= or localStorage. Polls every 1.5s.
 */
document.addEventListener('DOMContentLoaded', function(){
    loadQueue();
    loadFinanceQueues();
    setInterval(loadQueue, 1500);
    setInterval(loadFinanceQueues, 1500);
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
         // Robust status handling: accept 'serving', 'current', 1, '1'
         const statusIsServing = s => {
             if (s === null || s === undefined) return false;
             const ss = String(s).toLowerCase().trim();
             return ss === 'serving' || ss === 'current' || ss === '1' || ss === 'active';
         };

         const cur = data.find(q=> statusIsServing(q.status) );

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
             const waiting = data.filter(q=> {
                 const ss = (q.status === null || q.status === undefined) ? '' : String(q.status).toLowerCase().trim();
                 return ss === 'waiting' || ss === '0' || ss === 'queued' || ss === 'pending';
             }).slice(0,20);
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

/** Loads and displays finance department queues from the dedicated API. */
function loadFinanceQueues(){
    fetch(`../../api/queue/view_finance.php?_=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
            updateFinanceQueuesDisplay(data);
        })
        .catch(err => console.error('Error loading finance queues:', err));
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
function updateFinanceQueuesDisplay(data){
    const financeQueues = {
        'billing-admission': 'Billing - Admission',
        'billing-opd': 'Billing - OPD',
        'cashier': 'Cashier',
        'medical-social-services': 'Medical Social Services Department'
    };

    const normalize = s => (s||'').toString().toLowerCase().trim();
    const statusIsServing = s => {
        if (s === null || s === undefined) return false;
        const ss = String(s).toLowerCase().trim();
        return ss === 'serving' || ss === 'current' || ss === '1' || ss === 'active';
    };
    const statusIsWaiting = s => {
        if (s === null || s === undefined) return false;
        const ss = String(s).toLowerCase().trim();
        return ss === 'waiting' || ss === '0' || ss === 'queued' || ss === 'pending';
    };

    Object.keys(financeQueues).forEach(queueId => {
        const table = document.getElementById(queueId);
        const curEl = document.getElementById(queueId + '-current');
        if(table){
            // Filter data for this department
            const deptData = data.filter(q => normalize(q.department_name) === normalize(financeQueues[queueId]));
            
            // Build rows starting with current serving
            let html = '<tr><th>Queue No</th><th>Patient No</th><th>Patient Name</th></tr>';
            
            // If exact match failed, try token-based fallback (handles small naming differences)
            let deptDataFinal = deptData;
            if((!deptDataFinal || deptDataFinal.length === 0) && Array.isArray(data) && data.length > 0){
                const tokens = normalize(financeQueues[queueId]).split(/\W+/).filter(Boolean);
                deptDataFinal = data.filter(q => tokens.some(t => normalize(q.department_name).includes(t)));
            }

            // Show current serving separately (large display)
            const current = (deptDataFinal || []).find(q => statusIsServing(q.status));
            if(curEl){
                if(current){
                    curEl.innerHTML = '<div class="finance-current">#' + escapeHtml(String(current.queue_number || '')) + '</div>';
                } else {
                    curEl.innerHTML = '<div class="finance-current">None</div>';
                }
            }

            // Show up to 3 waiting entries (keep display compact)
            const waiting = (deptDataFinal || []).filter(q => statusIsWaiting(q.status)).slice(0, 3);
            if(waiting.length === 0){
                html = '<tr><td style="font-size:1.1em;color:#ccc;">No queue entries</td></tr>';
            } else {
                waiting.forEach(w => {
                    const patientNo = w.patient_number || w.patient_id || '';
                    html += '<tr>' +
                        '<td>' + escapeHtml(String(w.queue_number || '')) + '</td>' +
                        '<td>' + escapeHtml(String(patientNo)) + '</td>' +
                        '<td>' + escapeHtml(String(w.patient_name || '')) + '</td>' +
                        '</tr>';
                });
            }
            table.innerHTML = html;
        }
    });
}

/** Escape HTML for safe display (XSS). */
function escapeHtml(s){
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}
