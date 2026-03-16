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

/** Loads and displays the current queue for the selected department or all main departments. */
function loadQueue(){
    const params = new URLSearchParams(location.search);
    const requestedDept = params.get('dept') || params.get('department_id');
    const currentEl = document.getElementById('display_current');
    const infoEl = document.getElementById('display_info');

    const financeNames = [
        'billing - admission',
        'billing - opd',
        'cashier',
        'medical social services department'
    ];

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

    // If department is explicitly provided, show queue for that department only
    const loadForDept = (dept) => {
        fetch(`../../api/queue/view.php?department_id=${dept}&_=${Date.now()}`)
         .then(r=>r.json())
         .then(data=>{
             const cur = (data || []).find(q=> statusIsServing(q.status));
             if(cur){
                currentEl.innerText = '#' + (cur.queue_number || '');
                const deptName = cur.queue_department_name || cur.patient_department_name || ('Department ' + (cur.department_id || ''));                
                infoEl.innerHTML = `<div><span class="label">Department: </span>${escapeHtml(deptName)}</div>`;
             } else {
                currentEl.innerText = 'None';
                infoEl.innerHTML = '';
             }

             const waitingRows = (data || []).filter(q => statusIsWaiting(q.status));
             renderMainWaitingRows(waitingRows);
         })
         .catch(() => {
             currentEl.innerText = 'None';
             infoEl.innerHTML = '';
             renderMainWaitingRows([]);
         });
    };

    const renderMainWaitingRows = (rows) => {
        const table = document.getElementById('display_waiting');
        if(!table) return;
        const tbody = table.querySelector('tbody');
        if(!tbody) return;

        if(rows.length === 0){
            tbody.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-gray-300 font-medium">No one waiting</td></tr>';
            return;
        }

        let html = '';
        rows.slice(0,20).forEach(w=>{
            const patientNo = w.patient_number || w.patient_id || '';
            const deptName = w.queue_department_name || w.patient_department_name || '';
            html += `<tr class="hover:bg-gray-50/50 transition-colors">` +
                    `<td class="py-4 px-4 text-green-600 font-black">#${escapeHtml(String(w.queue_number || ''))}</td>` +
                    `<td class="py-4 px-4 text-center">${escapeHtml(String(patientNo))}</td>` +
                    `<td class="py-4 px-4 text-right text-gray-400 font-medium">${escapeHtml(String(deptName))}</td>` +
                    `</tr>`;
        });
        tbody.innerHTML = html;
    };

    if (requestedDept) {
        loadForDept(requestedDept);
        return;
    }

    // No requested dept: show all non-finance queues on right
    fetch(`../../api/queue/view.php?_=${Date.now()}`)
     .then(r=>r.json())
     .then(data=>{
         const items = Array.isArray(data) ? data : [];
         const nonFinance = items.filter(q => {
             const queueDept = (q.queue_department_name || '').toString().toLowerCase();
             return queueDept && !financeNames.includes(queueDept);
         });

         const serving = nonFinance.filter(q => statusIsServing(q.status));
         const current = serving.length > 0 ? serving.reduce((a,b) => (Number(a.queue_number||0) < Number(b.queue_number||0) ? a : b)) : null;
         if(current){
             currentEl.innerText = '#' + (current.queue_number || '');
             const deptName = current.queue_department_name || current.patient_department_name || '';
             infoEl.innerHTML = '<div><span class="label">Department: </span>' + escapeHtml(deptName) + '</div>';
         } else {
             currentEl.innerText = 'None';
             infoEl.innerHTML = '';
         }

         const waiting = nonFinance.filter(q => statusIsWaiting(q.status));
         renderMainWaitingRows(waiting);
     })
     .catch(() => {
         currentEl.innerText = 'None';
         infoEl.innerHTML = '';
         renderMainWaitingRows([]);
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
        const waitingEl = document.getElementById(queueId + '-waiting');
        const curEl = document.getElementById(queueId + '-current');
        const deptData = data.filter(q => normalize(q.department_name) === normalize(financeQueues[queueId]));

        const current = (deptData || []).find(q => statusIsServing(q.status));
        if(curEl){
            curEl.innerText = current ? ('#' + escapeHtml(String(current.queue_number || ''))) : 'None';
        }

        if(waitingEl){
            const waiting = (deptData || []).filter(q => statusIsWaiting(q.status));
            if(waiting.length === 0){
                waitingEl.innerHTML = 'No one waiting';
            } else {
                waitingEl.innerHTML = waiting.slice(0, 3).map(w => {
                    const patientNo = w.patient_number || w.patient_id || '';
                    return `<div class="rounded-lg border border-gray-200 bg-white p-2 mt-1 text-base font-semibold text-gray-700">#${escapeHtml(String(w.queue_number||''))} • ${escapeHtml(String(patientNo))}</div>`;
                }).join('');
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
