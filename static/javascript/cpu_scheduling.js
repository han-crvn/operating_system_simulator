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
  syncResultsAfterProcessChange();
});

/* ── Modal: delete ── */
modalDelete.addEventListener('click', () => {
  if (state.editingId !== null) {
    state.processes = state.processes.filter(p => p.id !== state.editingId);
  }
  closeModal();
  renderProcessList();
  syncResultsAfterProcessChange();
});

/* ── Close modal on overlay click ── */
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

/* ── Calculate ── */
calcBtn.addEventListener('click', async () => {
  await calculateSchedule();
});

async function calculateSchedule() {
  if (state.algorithm === 'none' || state.processes.length === 0) {
    showPlaceholder();
    return;
  }

  try {
    calcBtn.disabled = true;
    const response = await fetch('/api/cpu_scheduling/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        algorithm: state.algorithm,
        quantum: parseInt(quantumInput.value, 10) || 2,
        processes: state.processes,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to calculate schedule.');

    renderResults(data);
  } catch (error) {
    alert(error.message);
  } finally {
    calcBtn.disabled = false;
  }
}

function syncResultsAfterProcessChange() {
  if (state.processes.length === 0) {
    showPlaceholder();
    return;
  }

  if (resultsArea.style.display !== 'none') {
    calculateSchedule();
  }
}

/* ── Reset ── */
resetBtn.addEventListener('click', () => {
  state.processes = [];
  state.nextId = 1;
  renderProcessList();
  showPlaceholder();
});

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
    const isIdle = block.id === 'idle';
    if (!isIdle && colorMap[block.id] === undefined) {
      colorMap[block.id] = GANTT_COLORS[colorIdx++ % GANTT_COLORS.length];
    }
    const pct = ((block.end - block.start) / totalTime) * 100;
    const div = document.createElement('div');
    div.className = 'gantt-block';
    div.style.width = pct + '%';
    div.style.background = isIdle ? '#fff' : colorMap[block.id];
    div.style.color = isIdle ? '#000' : '';
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
      <button class="edit-btn" data-id="${p.id}" title="Edit">Edit</button>
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
