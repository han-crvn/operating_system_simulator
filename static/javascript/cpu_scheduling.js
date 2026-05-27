'use strict';

/* ── State ── */
const state = {
  algorithm: 'none',
  processes: [],       // { id, arrival, burst, priority }
  editingId: null,
  nextId: 1,
};

const GANTT_COLORS = [
  '#2563eb',
  '#3b82f6',
  '#16a34a',
  '#10b981',
  '#ca8a04',
  '#f59e0b',
  '#dc2626',
  '#ef4444',
  '#7c3aed',
  '#8b5cf6'
];

const ALGO_NAMES = {
  'fcfs':         'FCFS (First Come, First Serve)',
  'sjf-non':      'Shortest Job First (Non-Preemptive)',
  'sjf-pre':      'Shortest Job First (Preemptive – SRTF)',
  'priority-non': 'Priority (Non-Preemptive)',
  'priority-pre': 'Priority (Preemptive)',
  'rr':           'Round Robin',
};

const NEEDS_PRIORITY = ['priority-non','priority-pre'];
const NEEDS_QUANTUM  = ['rr'];

/* ── DOM refs ── */
const algoSelect   = document.getElementById('algorithm-select');
const quantumRow   = document.getElementById('quantum-row');
const quantumInput = document.getElementById('quantum-input');
const processList  = document.getElementById('process-list');
const addBtn       = document.getElementById('add-btn');
const calcBtn      = document.getElementById('calc-btn');
const resetBtn     = document.getElementById('reset-btn');

const placeholder  = document.getElementById('placeholder-msg');
const resultsArea  = document.getElementById('results-area');
const algoTitle    = document.getElementById('algo-title');
const ganttChart   = document.getElementById('gantt-chart');
const ganttTimes   = document.getElementById('gantt-times');
const resultBody   = document.getElementById('result-body');
const extraColHead = document.getElementById('extra-col-head');
const avgWt        = document.getElementById('avg-wt');
const avgTat       = document.getElementById('avg-tat');

const modalOverlay = document.getElementById('modal-overlay');
const modalSave    = document.getElementById('modal-save');
const modalDelete  = document.getElementById('modal-delete');
const mProcess     = document.getElementById('m-process');
const mArrival     = document.getElementById('m-arrival');
const mBurst       = document.getElementById('m-burst');
const mPriority    = document.getElementById('m-priority');
const mPriorityGrp = document.getElementById('m-priority-group');

/* ── Algorithm select ── */
algoSelect.addEventListener('change', () => {
  state.algorithm = algoSelect.value;
  state.processes = [];
  state.nextId = 1;

  quantumRow.style.display = NEEDS_QUANTUM.includes(state.algorithm) ? 'flex' : 'none';

  const hasAlgo = state.algorithm !== 'none';
  addBtn.style.display = hasAlgo ? 'block' : 'none';

  renderProcessList();
  showPlaceholder();
});

/* ── Add process ── */
addBtn.addEventListener('click', () => {
  openModal(null);
});

/* ── Modal: save ── */
modalSave.addEventListener('click', () => {
  const arrival  = parseInt(mArrival.value)  || 0;
  const burst    = parseInt(mBurst.value)    || 1;
  const priority = parseInt(mPriority.value) || 1;

  if (state.editingId === null) {
    // new
    state.processes.push({
      id:       state.nextId++,
      arrival,
      burst,
      priority,
    });
  } else {
    const p = state.processes.find(p => p.id === state.editingId);
    if (p) { p.arrival = arrival; p.burst = burst; p.priority = priority; }
  }

  closeModal();
  renderProcessList();
});

/* ── Modal: delete ── */
modalDelete.addEventListener('click', () => {
  if (state.editingId !== null) {
    state.processes = state.processes.filter(p => p.id !== state.editingId);
  }
  closeModal();
  renderProcessList();
});

/* ── Close modal on overlay click ── */
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

/* ── Calculate ── */
calcBtn.addEventListener('click', () => {
  if (state.algorithm === 'none' || state.processes.length === 0) return;
  const result = runAlgorithm();
  renderResults(result);
});

/* ── Reset ── */
resetBtn.addEventListener('click', () => {
  state.processes = [];
  state.nextId = 1;
  renderProcessList();
  showPlaceholder();
});

/* ══════════════════════════════════
   ALGORITHMS
   ══════════════════════════════════ */

function runAlgorithm() {
  const algo = state.algorithm;
  const procs = state.processes.map(p => ({ ...p }));

  if (algo === 'fcfs')         return fcfs(procs);
  if (algo === 'sjf-non')      return sjfNonPre(procs);
  if (algo === 'sjf-pre')      return sjfPre(procs);
  if (algo === 'priority-non') return priorityNonPre(procs);
  if (algo === 'priority-pre') return priorityPre(procs);
  if (algo === 'rr')           return roundRobin(procs, parseInt(quantumInput.value) || 2);
}

/* FCFS */
function fcfs(procs) {
  procs.sort((a, b) => a.arrival - b.arrival || a.id - b.id);
  let time = 0;
  const gantt = [];
  procs.forEach(p => {
    if (time < p.arrival) time = p.arrival;
    gantt.push({ name: `P${p.id}`, start: time, end: time + p.burst, id: p.id });
    p.start = time;
    p.finish = time + p.burst;
    time = p.finish;
  });
  return buildResult(procs, gantt);
}

/* SJF Non-Preemptive */
function sjfNonPre(procs) {
  let time = 0, done = [], gantt = [];
  const remaining = [...procs];
  while (remaining.length) {
    const available = remaining.filter(p => p.arrival <= time);
    if (!available.length) { time = remaining[0].arrival; continue; }
    available.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);
    const p = available[0];
    remaining.splice(remaining.indexOf(p), 1);
    gantt.push({ name: `P${p.id}`, start: time, end: time + p.burst, id: p.id });
    p.start = time;
    p.finish = time + p.burst;
    time = p.finish;
    done.push(p);
  }
  return buildResult(done, gantt);
}

/* SJF Preemptive (SRTF) */
function sjfPre(procs) {
  const n = procs.length;
  const rem = procs.map(p => ({ ...p, rem: p.burst, start: -1, finish: -1 }));
  let time = 0, done = 0, gantt = [], lastId = -1;

  while (done < n) {
    const available = rem.filter(p => p.arrival <= time && p.rem > 0);
    if (!available.length) { time++; continue; }
    available.sort((a, b) => a.rem - b.rem || a.arrival - b.arrival);
    const p = available[0];
    if (p.start === -1) p.start = time;
    if (lastId !== p.id) {
      gantt.push({ name: `P${p.id}`, start: time, end: time + 1, id: p.id });
    } else {
      gantt[gantt.length - 1].end++;
    }
    p.rem--;
    time++;
    if (p.rem === 0) { p.finish = time; done++; }
    lastId = p.id;
  }
  // Ensure all processes have finish time set
  rem.forEach(p => { if (p.finish === -1) p.finish = time; });
  return buildResult(rem, gantt);
}

/* Priority Non-Preemptive */
function priorityNonPre(procs) {
  let time = 0, done = [], gantt = [];
  const remaining = [...procs];
  while (remaining.length) {
    const available = remaining.filter(p => p.arrival <= time);
    if (!available.length) { time = remaining.sort((a,b)=>a.arrival-b.arrival)[0].arrival; continue; }
    available.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
    const p = available[0];
    remaining.splice(remaining.indexOf(p), 1);
    gantt.push({ name: `P${p.id}`, start: time, end: time + p.burst, id: p.id });
    p.start = time;
    p.finish = time + p.burst;
    time = p.finish;
    done.push(p);
  }
  return buildResult(done, gantt, true);
}

/* Priority Preemptive */
function priorityPre(procs) {
  const n = procs.length;
  const rem = procs.map(p => ({ ...p, rem: p.burst, start: -1, finish: -1 }));
  let time = 0, done = 0, gantt = [], lastId = -1;

  while (done < n) {
    const available = rem.filter(p => p.arrival <= time && p.rem > 0);
    if (!available.length) { time++; continue; }
    available.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
    const p = available[0];
    if (p.start === -1) p.start = time;
    if (lastId !== p.id) {
      gantt.push({ name: `P${p.id}`, start: time, end: time + 1, id: p.id });
    } else {
      gantt[gantt.length - 1].end++;
    }
    p.rem--;
    time++;
    if (p.rem === 0) { p.finish = time; done++; }
    lastId = p.id;
  }
  // Ensure all processes have finish time set
  rem.forEach(p => { if (p.finish === -1) p.finish = time; });
  return buildResult(rem, gantt, true);
}

/* Round Robin */
function roundRobin(procs, quantum) {
  const n = procs.length;
  const rem = procs.map(p => ({ ...p, rem: p.burst, start: -1, finish: -1 }));
  rem.sort((a, b) => a.arrival - b.arrival);
  let time = 0, gantt = [], queue = [], idx = 0, completed = 0;

  // seed first batch
  while (idx < n && rem[idx].arrival <= time) queue.push(rem[idx++]);

  while (completed < n) {
    if (queue.length === 0) {
      time = Math.max(time, rem[idx].arrival);
      while (idx < n && rem[idx].arrival <= time) queue.push(rem[idx++]);
    }

    const p = queue.shift();
    if (p.start === -1) p.start = time;
    const run = Math.min(p.rem, quantum);
    gantt.push({ name: `P${p.id}`, start: time, end: time + run, id: p.id });
    time += run;
    p.rem -= run;

    // enqueue newly arrived
    while (idx < n && rem[idx].arrival <= time) queue.push(rem[idx++]);

    if (p.rem > 0) queue.push(p);
    else {
      p.finish = time;
      completed++;
    }
  }
  return buildResult(rem, gantt);
}

/* Build result object */
function buildResult(procs, gantt, hasPriority = false) {
  const rows = procs.map(p => {
    const tat = p.finish - p.arrival;
    const wt  = tat - p.burst;
    return { name: `P${p.id}`, arrival: p.arrival, burst: p.burst, tat, wt, priority: p.priority };
  });
  const avgWt  = rows.reduce((s, r) => s + r.wt, 0)  / rows.length;
  const avgTat = rows.reduce((s, r) => s + r.tat, 0) / rows.length;
  return { gantt, rows, avgWt, avgTat, hasPriority };
}

/* ══════════════════════════════════
   RENDER
   ══════════════════════════════════ */

function renderResults({ gantt, rows, avgWt: aw, avgTat: at, hasPriority }) {
  placeholder.style.display = 'none';
  resultsArea.style.display = 'block';

  algoTitle.textContent = ALGO_NAMES[state.algorithm] || '';

  /* Gantt Chart */
  const totalTime = gantt.length ? gantt[gantt.length - 1].end : 0;
  const colorMap = {};
  let colorIdx = 0;

  ganttChart.innerHTML = '';
  ganttTimes.innerHTML = '';

  gantt.forEach(block => {
    if (colorMap[block.id] === undefined) colorMap[block.id] = GANTT_COLORS[colorIdx++ % GANTT_COLORS.length];
    const pct = ((block.end - block.start) / totalTime) * 100;
    const div = document.createElement('div');
    div.className = 'gantt-block';
    div.style.width = pct + '%';
    div.style.background = colorMap[block.id];
    div.textContent = block.name;
    ganttChart.appendChild(div);
  });

  /* Time markers */
  const marks = new Set();
  gantt.forEach(b => { marks.add(b.start); marks.add(b.end); });
  [...marks].sort((a, b) => a - b).forEach(t => {
    const span = document.createElement('span');
    span.className = 'gantt-time-mark';
    span.style.left = ((t / totalTime) * 100) + '%';
    span.textContent = t;
    ganttTimes.appendChild(span);
  });
  ganttTimes.style.position = 'relative';
  ganttTimes.style.height = '16px';

  /* Table */
  if (hasPriority) {
    extraColHead.style.display = '';
    extraColHead.textContent = 'Priority';
  } else {
    extraColHead.style.display = 'none';
  }

  resultBody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${r.arrival}</td>
      <td>${r.burst}</td>
      ${hasPriority ? `<td>${r.priority}</td>` : ''}
      <td>${r.tat}</td>
      <td>${r.wt}</td>
    `;
    resultBody.appendChild(tr);
  });

  avgWt.textContent  = aw.toFixed(2);
  avgTat.textContent = at.toFixed(2);
}

function showPlaceholder() {
  placeholder.style.display = 'flex';
  resultsArea.style.display = 'none';
}

function renderProcessList() {
  processList.innerHTML = '';
  const hasPri = NEEDS_PRIORITY.includes(state.algorithm);

  if (state.processes.length > 0) {
    const head = document.createElement('div');
    head.className = `process-grid process-list-head${hasPri ? ' has-priority' : ''}`;
    head.innerHTML = `
      <span>Process</span>
      <span>Arrival Time</span>
      <span>Burst Time</span>
      ${hasPri ? '<span>Priority</span>' : ''}
      <span></span>
    `;
    processList.appendChild(head);
  }

  state.processes.forEach(p => {
    const div = document.createElement('div');
    div.className = `process-card process-grid${hasPri ? ' has-priority' : ''}`;
    div.innerHTML = `
      <div class="process-badge">P${p.id}</div>
      <div class="process-pill">${p.arrival}</div>
      <div class="process-pill">${p.burst}</div>
      ${hasPri ? `<div class="process-pill">${p.priority}</div>` : ''}
      <button class="edit-btn" data-id="${p.id}" title="Edit">-</button>
    `;
    div.querySelector('.edit-btn').addEventListener('click', () => openModal(p.id));
    processList.appendChild(div);
  });
}

/* ── Modal helpers ── */
function openModal(id) {
  state.editingId = id;
  const hasPri = NEEDS_PRIORITY.includes(state.algorithm);
  mPriorityGrp.style.display = hasPri ? 'flex' : 'none';

  if (id === null) {
    // new process
    mProcess.value  = `P${state.nextId}`;
    mArrival.value  = 0;
    mBurst.value    = 1;
    mPriority.value = 1;
    modalDelete.style.display = 'none';
  } else {
    const p = state.processes.find(p => p.id === id);
    mProcess.value  = `P${p.id}`;
    mArrival.value  = p.arrival;
    mBurst.value    = p.burst;
    mPriority.value = p.priority || 1;
    modalDelete.style.display = 'block';
  }

  // position modal near the input box
  const addRect = addBtn.getBoundingClientRect();
  modalOverlay.style.display = 'flex';
  const modal = modalOverlay.querySelector('.modal');
  modal.style.top  = (addRect.bottom + window.scrollY + 8) + 'px';
  modal.style.left = (addRect.left + window.scrollX) + 'px';
}

function closeModal() {
  modalOverlay.style.display = 'none';
  state.editingId = null;
}
