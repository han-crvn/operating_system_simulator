const algorithmSelect = document.getElementById("algorithm-select");
const simulateBtn = document.getElementById("simulate-btn");

const fitSection = document.getElementById("fit-section");
const memorySection = document.getElementById("memory-section");
const partitionSection = document.getElementById("partition-section");
const mftProcessSection = document.getElementById("mft-process-section");
const mvtExtraSection = document.getElementById("mvt-extra-section");
const mvtProcessSection = document.getElementById("mvt-process-section");

const placeholderMsg = document.getElementById("placeholder-msg");
const mftView = document.getElementById("mft-view");
const mvtView = document.getElementById("mvt-view");

const cpuAlgoSelect = document.getElementById("cpu-algo-select");
const quantumSection = document.getElementById("quantum-section");

const fitButtons = document.querySelectorAll(".fit-btn");

const partitionContainer = document.getElementById("partition-container");
const mftProcessContainer = document.getElementById("mft-process-container");
const mvtProcessContainer = document.getElementById("mvt-process-container");

let selectedFit = "best";
let partitionCount = 1;
let mftProcessCount = 1;
let mvtProcessCount = 1;

/* =========================
   FIT BUTTONS
========================= */
fitButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        fitButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedFit = btn.dataset.fit;
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

    fitSection.style.display = "block";
    memorySection.style.display = "block";

    if (algo === "mft") {
        partitionSection.style.display = "block";
        mftProcessSection.style.display = "block";
        mftView.style.display = "block";
    }

    if (algo === "mvt") {
        mvtExtraSection.style.display = "block";
        mvtProcessSection.style.display = "block";
        mvtView.style.display = "block";
    }
});

function hideAll() {
    placeholderMsg.style.display = "none";
    mftView.style.display = "none";
    mvtView.style.display = "none";

    fitSection.style.display = "none";
    memorySection.style.display = "none";
    partitionSection.style.display = "none";
    mftProcessSection.style.display = "none";
    mvtExtraSection.style.display = "none";
    mvtProcessSection.style.display = "none";
    quantumSection.style.display = "none";
}

/* =========================
   CPU ALGO
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
    row.innerHTML = `
        <label>P${partitionCount}</label>
        <input type="number" placeholder="Size">
    `;

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
    row.innerHTML = `
        <label>P${mftProcessCount}</label>
        <input type="number" placeholder="Size">
    `;

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
        <input type="number" placeholder="Size">
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
   SIMULATE
========================= */
simulateBtn.addEventListener("click", () => {
    const algo = algorithmSelect.value;

    if (algo === "none") {
        alert("Select algorithm first.");
        return;
    }

    if (algo === "mft") simulateMFT();
    else simulateMVT();
});

/* =========================
   MOCK MFT
========================= */
function simulateMFT() {
    document.getElementById("mft-total-memory").textContent = "1024";
    document.getElementById("mft-used-memory").textContent = "700";
    document.getElementById("mft-utilization").textContent = "68%";
    document.getElementById("mft-free-memory").textContent = "324";

    const map = document.getElementById("mft-memory-map");
    map.innerHTML = `
        <div class="memory-block memory-used">P1</div>
        <div class="memory-block memory-used">P2</div>
        <div class="memory-block memory-free">FREE</div>
    `;

    document.getElementById("mft-table-body").innerHTML = `
        <tr><td>P1</td><td>Partition 1</td><td>Allocated</td></tr>
        <tr><td>P2</td><td>Partition 2</td><td>Allocated</td></tr>
    `;
}

/* =========================
   MOCK MVT
========================= */
function simulateMVT() {
    document.getElementById("mvt-total-memory").textContent = "1024";
    document.getElementById("mvt-used-memory").textContent = "680";
    document.getElementById("mvt-utilization").textContent = "66%";
    document.getElementById("mvt-free-memory").textContent = "344";
    document.getElementById("holes-count").textContent = "2";
    document.getElementById("largest-hole").textContent = "180";

    const map = document.getElementById("mvt-memory-map");
    map.innerHTML = `
        <div class="memory-block memory-used">P1</div>
        <div class="memory-block memory-free">HOLE</div>
        <div class="memory-block memory-used">P2</div>
        <div class="memory-block memory-free">HOLE</div>
    `;
}