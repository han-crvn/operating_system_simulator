// memory_management.js

const algorithmSelect   = document.getElementById("algorithm-select");
const simulateBtn       = document.getElementById("simulate-btn");
const fitSection        = document.getElementById("fit-section");
const memorySection     = document.getElementById("memory-section");
const partitionSection  = document.getElementById("partition-section");
const mftProcessSection = document.getElementById("mft-process-section");
const mvtExtraSection   = document.getElementById("mvt-extra-section");
const mvtProcessSection = document.getElementById("mvt-process-section");
const placeholderMsg    = document.getElementById("placeholder-msg");
const mftView           = document.getElementById("mft-view");
const mvtView           = document.getElementById("mvt-view");
const cpuAlgoSelect     = document.getElementById("cpu-algo-select");
const quantumSection    = document.getElementById("quantum-section");
const fitButtons        = document.querySelectorAll(".fit-btn");
const partitionContainer  = document.getElementById("partition-container");
const mftProcessContainer = document.getElementById("mft-process-container");
const mvtProcessContainer = document.getElementById("mvt-process-container");

let selectedFit     = "best_fit";
let partitionCount  = 1;
let mftProcessCount = 1;
let mvtProcessCount = 1;

const BLOCK_COLORS = ["#bfdbfe", "#bbf7d0", "#fde68a", "#fecaca", "#e9d5ff", "#fed7aa"];
const HOLE_COLOR   = "#e5e7eb";

/* =========================
   FIT BUTTONS
========================= */
fitButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        fitButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedFit = btn.dataset.fit + "_fit";
    });
});

/* =========================
   ALGO CHANGE
========================= */
algorithmSelect.addEventListener("change", () => {
    hideAll();
    const algo = algorithmSelect.value;

    if (algo === "none") {
        placeholderMsg.style.display = "flex";
        return;
    }

    memorySection.style.display = "block";

    if (algo === "mft") {
        fitSection.style.display        = "block";
        partitionSection.style.display  = "block";
        mftProcessSection.style.display = "block";
    }

    if (algo === "mvt") {
        mvtExtraSection.style.display   = "block";
        mvtProcessSection.style.display = "block";
    }
});

function hideAll() {
    placeholderMsg.style.display    = "none";
    mftView.style.display           = "none";
    mvtView.style.display           = "none";
    fitSection.style.display        = "none";
    memorySection.style.display     = "none";
    partitionSection.style.display  = "none";
    mftProcessSection.style.display = "none";
    mvtExtraSection.style.display   = "none";
    mvtProcessSection.style.display = "none";
    quantumSection.style.display    = "none";
}

/* =========================
   CPU ALGO (quantum toggle)
========================= */
cpuAlgoSelect?.addEventListener("change", () => {
    quantumSection.style.display =
        cpuAlgoSelect.value === "rr" ? "block" : "none";
});

/* =========================
   ADD / REMOVE PARTITION
========================= */
document.getElementById("add-partition")?.addEventListener("click", () => {
    partitionCount++;
    const row = document.createElement("div");
    row.className = "partition-row";
    row.innerHTML = `<label>P${partitionCount}</label><input type="number" placeholder="Size (KB)">`;
    partitionContainer.appendChild(row);
});

document.getElementById("remove-partition")?.addEventListener("click", () => {
    if (partitionContainer.children.length > 1) {
        partitionContainer.removeChild(partitionContainer.lastElementChild);
        partitionCount--;
    }
});

/* =========================
   ADD / REMOVE MFT PROCESS
========================= */
document.getElementById("add-mft-process")?.addEventListener("click", () => {
    mftProcessCount++;
    const row = document.createElement("div");
    row.className = "process-row";
    row.innerHTML = `<label>P${mftProcessCount}</label><input type="number" placeholder="Size (KB)">`;
    mftProcessContainer.appendChild(row);
});

document.getElementById("remove-mft-process")?.addEventListener("click", () => {
    if (mftProcessContainer.children.length > 1) {
        mftProcessContainer.removeChild(mftProcessContainer.lastElementChild);
        mftProcessCount--;
    }
});

/* =========================
   ADD / REMOVE MVT PROCESS
========================= */
document.getElementById("add-mvt-process")?.addEventListener("click", () => {
    mvtProcessCount++;
    const row = document.createElement("div");
    row.className = "job-row";
    row.innerHTML = `
        <label>P${mvtProcessCount}</label>
        <input type="number" placeholder="Size (KB)">
        <input type="number" placeholder="Arrival">
        <input type="number" placeholder="Burst">
    `;
    mvtProcessContainer.appendChild(row);
});

document.getElementById("remove-mvt-process")?.addEventListener("click", () => {
    if (mvtProcessContainer.children.length > 1) {
        mvtProcessContainer.removeChild(mvtProcessContainer.lastElementChild);
        mvtProcessCount--;
    }
});

/* =========================
   COLLECT INPUTS
========================= */
function getPartitions() {
    return Array.from(partitionContainer.querySelectorAll(".partition-row")).map((row, i) => ({
        name: `P${i + 1}`,
        size: parseInt(row.querySelector("input").value, 10) || 0
    }));
}

function getMftProcesses() {
    return Array.from(mftProcessContainer.querySelectorAll(".process-row")).map((row, i) => ({
        name: `P${i + 1}`,
        size: parseInt(row.querySelector("input").value, 10) || 0
    }));
}

function getMvtProcesses() {
    return Array.from(mvtProcessContainer.querySelectorAll(".job-row")).map((row, i) => {
        const inputs = row.querySelectorAll("input");
        return {
            name:    `P${i + 1}`,
            size:    parseInt(inputs[0].value, 10) || 0,
            arrival: parseInt(inputs[1].value, 10) || 0,
            burst:   parseInt(inputs[2].value, 10) || 0
        };
    });
}

/* =========================
   SIMULATE
========================= */
simulateBtn.addEventListener("click", async () => {
    const algo = algorithmSelect.value;
    if (algo === "none") { alert("Please select an algorithm first."); return; }
    if (algo === "mft") await simulateMFT();
    else await simulateMVT();
});

/* =========================
   MFT
========================= */
async function simulateMFT() {
    const partitions  = getPartitions();
    const processes   = getMftProcesses();
    const totalMemory = parseInt(document.getElementById("total-memory").value, 10) || 0;

    if (partitions.some(p => !p.size)) { alert("All partitions need a size."); return; }
    if (processes.some(p => !p.size))  { alert("All processes need a size."); return; }
    if (!totalMemory)                  { alert("Please enter total memory."); return; }

    try {
        const res  = await fetch("/simulate-memory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ algorithm: selectedFit, partitions, processes })
        });
        const data = await res.json();
        if (data.error) { alert(data.error); return; }
        renderMFT(data, totalMemory);
    } catch (e) {
        console.error(e);
        alert("Unable to connect to simulation backend.");
    }
}

/* =========================
   MVT
========================= */
async function simulateMVT() {
    const processes   = getMvtProcesses();
    const totalMemory = parseInt(document.getElementById("total-memory").value, 10) || 0;
    const osSize      = parseInt(document.getElementById("os-size").value, 10) || 100;
    const compaction  = document.getElementById("compaction-select").value === "Yes"
        ? "with_compaction" : "without_compaction";
    const cpuAlgo     = document.getElementById("cpu-algo-select").value;  // ← now sent
    const quantum     = parseInt(document.getElementById("time-quantum")?.value, 10) || 2; // ← now sent

    if (processes.some(p => !p.size)) { alert("All processes need a size."); return; }
    if (!totalMemory)                 { alert("Please enter total memory."); return; }
    if (osSize >= totalMemory)        { alert(`OS size (${osSize} KB) must be smaller than total memory (${totalMemory} KB).`); return; }

    try {
        const res  = await fetch("/simulate-mvt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mode:         compaction,
                total_memory: totalMemory,
                os_size:      osSize,
                processes,
                cpu_algo:     cpuAlgo,   // ← now sent
                quantum:      quantum    // ← now sent
            })
        });
        const data = await res.json();
        if (data.error) { alert(data.error); return; }
        renderMVT(data, compaction);
    } catch (e) {
        console.error(e);
        alert("Unable to connect to simulation backend.");
    }
}

/* =========================
   RENDER MFT
========================= */
function renderMFT(data, totalMemory) {
    mftView.style.display = "block";
    mvtView.style.display = "none";

    document.getElementById("mft-total-memory").textContent = `${totalMemory} KB`;
    document.getElementById("mft-used-memory").textContent  = `${data.used_memory} KB`;
    document.getElementById("mft-free-memory").textContent  = `${data.free_memory} KB`;
    document.getElementById("mft-utilization").textContent  = `${data.utilization}%`;

    const tbody = document.getElementById("mft-table-body");
    tbody.innerHTML = "";
    data.allocations.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.process}</td>
            <td>${row.allocated}</td>
            <td style="color:${row.status === 'Allocated' ? 'green' : 'red'}; font-weight:700">
                ${row.status}
            </td>
        `;
        tbody.appendChild(tr);
    });

    const map = document.getElementById("mft-memory-map");
    map.innerHTML = "";
    data.memory_map.forEach((seg, i) => {
        const block = document.createElement("div");
        block.className = "memory-block memory-used";
        block.style.background = BLOCK_COLORS[i % BLOCK_COLORS.length];
        block.style.flex = seg.partitionSize;
        block.innerHTML = seg.usedSize > 0
            ? `<strong>${seg.partition} (${seg.partitionSize} KB)</strong><br>Used: ${seg.usedSize} KB<br>Free: ${seg.freeSize} KB`
            : `<strong>${seg.partition} (${seg.partitionSize} KB)</strong><br><em>Empty</em>`;
        map.appendChild(block);
    });
}

/* =========================
   RENDER MVT
========================= */
function renderMVT(data, mode) {
    mftView.style.display = "none";
    mvtView.style.display = "block";

    document.getElementById("mvt-total-memory").textContent = `${data.total_memory} KB`;
    document.getElementById("mvt-used-memory").textContent  = `${data.used_memory} KB`;
    document.getElementById("mvt-free-memory").textContent  = `${data.free_memory} KB`;
    document.getElementById("mvt-utilization").textContent  = `${data.utilization}%`;
    document.getElementById("holes-count").textContent      = data.holes;
    document.getElementById("largest-hole").textContent     = `${data.largest_hole} KB`;

    // Show load order
    const loadOrderEl = document.getElementById("load-order");
    if (loadOrderEl && data.load_order) {
        loadOrderEl.textContent = `Load order: ${data.load_order.join(" → ")}`;
    }

    // Compaction label
    const compactionEl = document.getElementById("compaction-label");
    if (compactionEl) {
        compactionEl.textContent = mode === "with_compaction"
            ? "✓ Compaction applied — holes merged into one block"
            : "✗ No compaction — holes may be scattered";
    }

    const warning = document.getElementById("fragmentation-warning");
    warning.style.display = data.has_fragmentation ? "block" : "none";

    const map = document.getElementById("mvt-memory-map");
    map.innerHTML = "";
    let colorIdx = 0;

    data.memory_map.forEach(seg => {
        const block = document.createElement("div");
        block.className = "memory-block";
        block.style.flex = seg.size;

        if (seg.type === "OS") {
            block.style.background = "#c7d2fe";
            block.classList.add("memory-free");
        } else if (seg.type === "HOLE") {
            block.style.background = HOLE_COLOR;
            block.classList.add("memory-free");
        } else {
            block.style.background = BLOCK_COLORS[colorIdx % BLOCK_COLORS.length];
            block.classList.add("memory-used");
            colorIdx++;
        }

        block.textContent = seg.label;
        map.appendChild(block);
    });
}