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
  resultsArea.style.display = 'flex';

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
  const sortedMarks = [...marks].sort((a, b) => a - b);
  sortedMarks.forEach((t, i) => {
    const span = document.createElement('span');
    span.className = 'gantt-time-mark';
    const pct = (t / totalTime) * 100;
    // Clamp first mark to left edge, last mark to right edge
    if (i === 0) {
      span.style.left = '0%';
      span.style.transform = 'translateX(0)';
    } else if (i === sortedMarks.length - 1) {
      span.style.left = '100%';
      span.style.transform = 'translateX(-100%)';
    } else {
      span.style.left = pct + '%';
    }
    span.textContent = t;
    ganttTimes.appendChild(span);
  });
  ganttTimes.style.position = 'relative';
  ganttTimes.style.height = '18px';

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

  state.processes.forEach(p => {
    const card = document.createElement('div');
    card.className = 'process-card';
    card.innerHTML = `
      <div class="process-card-header">
        <div class="process-badge">P${p.id}</div>
        <button class="edit-btn" data-id="${p.id}">Edit</button>
      </div>
      <div class="process-card-info">
        <span><b>Arrival Time:</b> ${p.arrival}</span>
        <span><b>Burst Time:</b> ${p.burst}</span>
        ${hasPri ? `<span><b>Priority:</b> ${p.priority}</span>` : ''}
      </div>
    `;
    card.querySelector('.edit-btn').addEventListener('click', () => openModal(p.id));
    processList.appendChild(card);
  });
}

/* ── Modal helpers ── */
function openModal(id) {
  state.editingId = id;
  const hasPri = NEEDS_PRIORITY.includes(state.algorithm);
  mPriorityGrp.style.display = hasPri ? 'flex' : 'none';

  if (id === null) {
    // new process — hide delete
    mProcess.value  = `P${state.nextId}`;
    mArrival.value  = 0;
    mBurst.value    = 1;
    mPriority.value = 1;
    modalDelete.style.display = 'none';
  } else {
    // editing — show delete
    const p = state.processes.find(p => p.id === id);
    mProcess.value  = `P${p.id}`;
    mArrival.value  = p.arrival;
    mBurst.value    = p.burst;
    mPriority.value = p.priority || 1;
    modalDelete.style.display = 'block';
  }

  // Show modal first (hidden) so we can measure it
  modalOverlay.style.display = 'flex';
  const modal = modalOverlay.querySelector('.modal');
  modal.style.top  = '-9999px';
  modal.style.left = '-9999px';

  // Use requestAnimationFrame so modal has rendered and has a measurable size
  requestAnimationFrame(() => {
    const leftPanel   = document.querySelector('.left-panel');
    const panelRect   = leftPanel.getBoundingClientRect();
    const modalW      = modal.offsetWidth;
    const modalH      = modal.offsetHeight;
    const viewportH   = window.innerHeight;
    const viewportW   = window.innerWidth;

    // Horizontal: align to left edge of panel, clamp within viewport
    let left = panelRect.left + window.scrollX;
    if (left + modalW > viewportW - 8) left = viewportW - modalW - 8;
    if (left < 8) left = 8;

    // Vertical: try to center within the viewport
    let top = window.scrollY + (viewportH / 2) - (modalH / 2);
    if (top + modalH > window.scrollY + viewportH - 8) top = window.scrollY + viewportH - modalH - 8;
    if (top < window.scrollY + 8) top = window.scrollY + 8;

    modal.style.top  = top + 'px';
    modal.style.left = left + 'px';
  });
}

function closeModal() {
  modalOverlay.style.display = 'none';
  state.editingId = null;
}