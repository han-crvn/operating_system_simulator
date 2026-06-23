const algorithmSelect   = document.getElementById("algorithm-select");
const simulateBtn       = document.getElementById("simulate-btn");
const resetBtn          = document.getElementById("reset-btn");
const placeholderMsg    = document.getElementById("placeholder-msg");
const resultState       = document.getElementById("result-state");
const resultDescription = document.getElementById("result-description");
const tableHead         = document.getElementById("result-table-head");
const tableBody         = document.getElementById("result-table-body");
const pageFaultsEl      = document.getElementById("page-faults");
const pageHitsEl        = document.getElementById("page-hits");
const hitRatioEl        = document.getElementById("hit-ratio");

// ==========================================
// ALGORITHM CHANGE
// ==========================================

algorithmSelect.addEventListener("change", () => {

    if (algorithmSelect.value !== "none") {

        placeholderMsg.style.display = "none";
        resultState.style.display    = "flex";

        resultDescription.textContent =
            `Results showing ${algorithmSelect.options[algorithmSelect.selectedIndex].text}.`;

    } else {

        placeholderMsg.style.display = "flex";
        resultState.style.display    = "none";

    }

});

// ==========================================
// SIMULATE
// ==========================================

simulateBtn.addEventListener("click", async () => {

    const algorithm  = algorithmSelect.value;
    const pagesText  = document.getElementById("page-string").value;
    const capacityEl = document.getElementById("frame-capacity");
    const capacity   = parseInt(capacityEl.value);

    if (!algorithm || algorithm === "none") {
        alert("Please select an algorithm.");
        return;
    }

    if (!pagesText.trim()) {
        alert("Please enter a page reference string.");
        return;
    }

    if (isNaN(capacity) || capacityEl.value === "" || capacity <= 0) {
        alert("Please enter a valid frame capacity (positive integer).");
        return;
    }

    const pages = pagesText
        .split(",")
        .map(x => parseInt(x.trim()))
        .filter(x => !isNaN(x));

    if (pages.length === 0) {
        alert("Page reference string contains no valid numbers.");
        return;
    }

    try {

        const response = await fetch("/simulate-memory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ algorithm, pages, capacity })
        });

        const data = await response.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        populateTable(pages, data.framesHistory, capacity);
        updateStats(data.pageHits, data.pageFaults);

        // show result panel if hidden
        placeholderMsg.style.display = "none";
        resultState.style.display    = "flex";

        resultDescription.textContent =
            `Results showing ${algorithmSelect.options[algorithmSelect.selectedIndex].text}.`;

    } catch (error) {

        console.error(error);
        alert("Unable to connect to simulation backend.");

    }

});

// ==========================================
// TABLE
// ==========================================

function populateTable(pages, framesHistory, capacity) {

    // Build header: Step | Page | Frame 1 | Frame 2 | ... | Status
    tableHead.innerHTML = "";
    const headerRow = document.createElement("tr");

    const headers = ["Step", "Page", ...Array.from({ length: capacity }, (_, i) => `Frame ${i + 1}`), "Status"];

    headers.forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
    });

    tableHead.appendChild(headerRow);

    // Build rows
    tableBody.innerHTML = "";

    // Track previous frame state to detect faults vs hits
    let prevFrames = [];

    pages.forEach((page, i) => {
        const frames  = framesHistory[i];
        const isFault = !prevFrames.includes(page);

        const row = document.createElement("tr");
        row.classList.add(isFault ? "row-fault" : "row-hit");

        // Step
        const stepTd = document.createElement("td");
        stepTd.textContent = i + 1;
        row.appendChild(stepTd);

        // Page
        const pageTd = document.createElement("td");
        pageTd.textContent = page;
        row.appendChild(pageTd);

        // Frames (pad to capacity)
        for (let f = 0; f < capacity; f++) {
            const td = document.createElement("td");
            td.textContent = frames[f] !== undefined ? frames[f] : "—";

            // Highlight the newly loaded page
            if (isFault && frames[f] === page) {
                td.classList.add("cell-new");
            }

            row.appendChild(td);
        }

        // Status
        const statusTd = document.createElement("td");
        statusTd.textContent = isFault ? "FAULT" : "HIT";
        statusTd.classList.add(isFault ? "status-fault" : "status-hit");
        row.appendChild(statusTd);

        tableBody.appendChild(row);

        prevFrames = [...frames];
    });

}

// ==========================================
// STATS
// ==========================================

function updateStats(hits, faults) {
    const total = hits + faults;
    const ratio = total > 0 ? ((hits / total) * 100).toFixed(1) : "0.0";

    pageFaultsEl.textContent = faults;
    pageHitsEl.textContent   = hits;
    hitRatioEl.textContent   = `${ratio}%`;
}

// ==========================================
// RESET
// ==========================================

resetBtn.addEventListener("click", () => {

    algorithmSelect.value = "none";

    document.getElementById("page-string").value    = "";
    document.getElementById("frame-capacity").value = "";

    placeholderMsg.style.display = "flex";
    resultState.style.display    = "none";

    tableHead.innerHTML  = "";
    tableBody.innerHTML  = "";

    pageFaultsEl.textContent = "0";
    pageHitsEl.textContent   = "0";
    hitRatioEl.textContent   = "0.0%";

});