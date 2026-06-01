// ── Algorithm descriptions ──────────────────────────────────────────────
const ALGO_INFO = {
    fifo:      "FIFO (First In, First Out): The oldest page in memory is replaced first. Pages are managed like a queue — the first page loaded is the first to be evicted when a new page must be brought in.",
    opt:       "Optimal Page Replacement: Replaces the page that will not be used for the longest period of time in the future. This algorithm is theoretical and used as a benchmark since future references are not known in practice.",
    lru:       "LRU (Least Recently Used): Replaces the page that has not been used for the longest time. It uses recent past as an approximation of the near future, making it a practical and widely-used algorithm.",
    "lru-approx": "LRU Approximation: Uses a reference bit per page to approximate LRU. When a page is referenced its bit is set to 1. On replacement, the page with bit 0 is chosen; if all are 1, they are cleared and the process repeats.",
    lfu:       "LFU (Least Frequently Used): Part of Counting-Based replacement. The page with the smallest reference count is replaced. Pages that are used very infrequently are considered less important.",
    mfu:       "MFU (Most Frequently Used): Part of Counting-Based replacement. The page with the largest reference count is replaced, based on the argument that the page with the smallest count was probably just brought in and has yet to be used."
};

const ALGO_LABELS = {
    fifo:       "FIFO (First In, First Out)",
    opt:        "Optimal Page Replacement",
    lru:        "LRU (Least Recently Used)",
    "lru-approx": "LRU Approximation",
    lfu:        "Counting-Based LFU",
    mfu:        "Counting-Based MFU"
};

// ── Simulation logic ────────────────────────────────────────────────────

function simulateFIFO(refs, nFrames) {
    const frames = [];
    const rows = [];
    let faults = 0, hits = 0;
    for (let i = 0; i < refs.length; i++) {
        const page = refs[i];
        if (frames.includes(page)) {
            hits++;
            rows.push({ step: i+1, ref: page, frames: [...frames], status: 'Hit' });
        } else {
            faults++;
            if (frames.length < nFrames) frames.push(page);
            else { frames.shift(); frames.push(page); }
            rows.push({ step: i+1, ref: page, frames: [...frames], status: 'Fault' });
        }
    }
    return { rows, faults, hits };
}

function simulateOPT(refs, nFrames) {
    const frames = [];
    const rows = [];
    let faults = 0, hits = 0;
    for (let i = 0; i < refs.length; i++) {
        const page = refs[i];
        if (frames.includes(page)) {
            hits++;
            rows.push({ step: i+1, ref: page, frames: [...frames], status: 'Hit' });
        } else {
            faults++;
            if (frames.length < nFrames) {
                frames.push(page);
            } else {
                let replaceIdx = -1, farthest = -1;
                for (let j = 0; j < frames.length; j++) {
                    let nextUse = refs.indexOf(frames[j], i + 1);
                    if (nextUse === -1) { replaceIdx = j; break; }
                    if (nextUse > farthest) { farthest = nextUse; replaceIdx = j; }
                }
                frames[replaceIdx] = page;
            }
            rows.push({ step: i+1, ref: page, frames: [...frames], status: 'Fault' });
        }
    }
    return { rows, faults, hits };
}

function simulateLRU(refs, nFrames) {
    const frames = [];
    const rows = [];
    let faults = 0, hits = 0;
    for (let i = 0; i < refs.length; i++) {
        const page = refs[i];
        if (frames.includes(page)) {
            hits++;
            frames.splice(frames.indexOf(page), 1);
            frames.push(page);
            rows.push({ step: i+1, ref: page, frames: [...frames], status: 'Hit' });
        } else {
            faults++;
            if (frames.length < nFrames) frames.push(page);
            else { frames.shift(); frames.push(page); }
            rows.push({ step: i+1, ref: page, frames: [...frames], status: 'Fault' });
        }
    }
    return { rows, faults, hits };
}

function simulateLRUApprox(refs, nFrames) {
    const frames = [];
    const rows = [];
    let faults = 0, hits = 0;
    for (let i = 0; i < refs.length; i++) {
        const page = refs[i];
        const idx = frames.findIndex(f => f.page === page);
        if (idx !== -1) {
            hits++;
            frames[idx].bit = 1;
            rows.push({ step: i+1, ref: page, frames: frames.map(f => f.page), status: 'Hit' });
        } else {
            faults++;
            if (frames.length < nFrames) {
                frames.push({ page, bit: 1 });
            } else {
                let replaceIdx = frames.findIndex(f => f.bit === 0);
                if (replaceIdx === -1) {
                    frames.forEach(f => f.bit = 0);
                    replaceIdx = 0;
                }
                frames[replaceIdx] = { page, bit: 1 };
            }
            rows.push({ step: i+1, ref: page, frames: frames.map(f => f.page), status: 'Fault' });
        }
    }
    return { rows, faults, hits };
}

function simulateLFU(refs, nFrames) {
    const frames = [];
    const rows = [];
    let faults = 0, hits = 0;
    for (let i = 0; i < refs.length; i++) {
        const page = refs[i];
        const idx = frames.findIndex(f => f.page === page);
        if (idx !== -1) {
            hits++;
            frames[idx].count++;
            rows.push({ step: i+1, ref: page, frames: frames.map(f => f.page), status: 'Hit' });
        } else {
            faults++;
            if (frames.length < nFrames) {
                frames.push({ page, count: 1 });
            } else {
                let minCount = Infinity, replaceIdx = 0;
                for (let j = 0; j < frames.length; j++) {
                    if (frames[j].count < minCount) { minCount = frames[j].count; replaceIdx = j; }
                }
                frames[replaceIdx] = { page, count: 1 };
            }
            rows.push({ step: i+1, ref: page, frames: frames.map(f => f.page), status: 'Fault' });
        }
    }
    return { rows, faults, hits };
}

function simulateMFU(refs, nFrames) {
    const frames = [];
    const rows = [];
    let faults = 0, hits = 0;
    for (let i = 0; i < refs.length; i++) {
        const page = refs[i];
        const idx = frames.findIndex(f => f.page === page);
        if (idx !== -1) {
            hits++;
            frames[idx].count++;
            rows.push({ step: i+1, ref: page, frames: frames.map(f => f.page), status: 'Hit' });
        } else {
            faults++;
            if (frames.length < nFrames) {
                frames.push({ page, count: 1 });
            } else {
                let maxCount = -Infinity, replaceIdx = 0;
                for (let j = 0; j < frames.length; j++) {
                    if (frames[j].count > maxCount) { maxCount = frames[j].count; replaceIdx = j; }
                }
                frames[replaceIdx] = { page, count: 1 };
            }
            rows.push({ step: i+1, ref: page, frames: frames.map(f => f.page), status: 'Fault' });
        }
    }
    return { rows, faults, hits };
}

// ── Dispatch ────────────────────────────────────────────────────────────
function runSimulation(algo, refs, nFrames) {
    switch (algo) {
        case 'fifo':      return simulateFIFO(refs, nFrames);
        case 'opt':       return simulateOPT(refs, nFrames);
        case 'lru':       return simulateLRU(refs, nFrames);
        case 'lru-approx':return simulateLRUApprox(refs, nFrames);
        case 'lfu':       return simulateLFU(refs, nFrames);
        case 'mfu':       return simulateMFU(refs, nFrames);
        default:          return null;
    }
}

// ── UI helpers ──────────────────────────────────────────────────────────
function renderResults(result, algo, nFrames) {
    const tbody = document.getElementById('result-body');
    tbody.innerHTML = '';
    result.rows.forEach(row => {
        const tr = document.createElement('tr');

        const framesCells = [];
        for (let i = 0; i < nFrames; i++) {
            framesCells.push(row.frames[i] !== undefined ? row.frames[i] : '-');
        }
        tr.innerHTML = `
            <td>${row.step}</td>
            <td>${row.ref}</td>
            <td>[${framesCells.join(', ')}]</td>
            <td class="${row.status === 'Fault' ? 'status-fault' : 'status-hit'}">${row.status}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('stat-faults').textContent = result.faults;
    document.getElementById('stat-hits').textContent   = result.hits;
    document.getElementById('algo-name-inline').textContent = ALGO_LABELS[algo] || algo;
    document.getElementById('algo-info-text').textContent   = ALGO_INFO[algo] || '';

    document.getElementById('placeholder-msg').style.display = 'none';
    document.getElementById('results-area').style.display    = 'flex';
}

function showPlaceholder() {
    document.getElementById('placeholder-msg').style.display = 'flex';
    document.getElementById('results-area').style.display    = 'none';
}

// ── Event listeners ─────────────────────────────────────────────────────
document.getElementById('simulate-btn').addEventListener('click', () => {
    const algo    = document.getElementById('algorithm-select').value;
    const refRaw  = document.getElementById('reference-string').value.trim();
    const nFrames = parseInt(document.getElementById('num-frames').value, 10);

    if (algo === 'none') { alert('Please select an algorithm.'); return; }
    if (!refRaw)         { alert('Please enter a reference string.'); return; }
    if (!nFrames || nFrames < 1) { alert('Please enter a valid number of frames (≥ 1).'); return; }

    const refs = refRaw.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (refs.length === 0) { alert('Reference string contains no valid numbers.'); return; }

    const result = runSimulation(algo, refs, nFrames);
    if (result) renderResults(result, algo, nFrames);
});

document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('algorithm-select').value  = 'none';
    document.getElementById('reference-string').value = '';
    document.getElementById('num-frames').value        = '';
    showPlaceholder();
});

document.getElementById('algorithm-select').addEventListener('change', (e) => {
    if (e.target.value === 'none') showPlaceholder();
});