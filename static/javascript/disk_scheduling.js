const algorithmSelect    = document.getElementById("algorithm-select");
const simulateBtn        = document.getElementById("simulate-btn");
const resetBtn           = document.getElementById("reset-btn");
const placeholderMsg     = document.getElementById("placeholder-msg");
const resultState        = document.getElementById("result-state");
const resultDescription  = document.getElementById("result-description");
const tableBody          = document.getElementById("result-table-body");
const totalSeek          = document.getElementById("total-seek");
const timelineContainer  = document.getElementById("timeline-container");

// ==========================================
// ALGORITHM CHANGE
// ==========================================

algorithmSelect.addEventListener("change", () => {

    if (algorithmSelect.value !== "") {

        placeholderMsg.style.display = "none";
        resultState.style.display    = "flex";

        resultDescription.textContent =
            `Results showing ${algorithmSelect.value} disk scheduling.`;

    } else {

        placeholderMsg.style.display = "flex";
        resultState.style.display    = "none";

    }

});

// ==========================================
// SIMULATE
// ==========================================

simulateBtn.addEventListener("click", async () => {

    const algorithm = algorithmSelect.value;
    const queueText = document.getElementById("request-queue").value;
    const head      = Number(document.getElementById("head-position").value);

    if (!algorithm) {
        alert("Please select an algorithm.");
        return;
    }

    if (!queueText.trim()) {
        alert("Please enter a request queue.");
        return;
    }

    if (isNaN(head) || document.getElementById("head-position").value === "") {
        alert("Please enter a valid head position.");
        return;
    }

    const requests = queueText
        .split(",")
        .map(x => Number(x.trim()))
        .filter(x => !isNaN(x));

    if (requests.length === 0) {
        alert("Request queue contains no valid numbers.");
        return;
    }

    try {

        const response = await fetch("/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ algorithm, requests, head, direction: "right" })
        });

        const data = await response.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        populateTable(data.rows);

        totalSeek.textContent = `${data.totalSeek} Tracks`;

        drawTimeline(data.sequence, data.serviced, data.jumps);

    } catch (error) {

        console.error(error);
        alert("Unable to connect to simulation backend.");

    }

});

// ==========================================
// TABLE
// ==========================================

function populateTable(rows) {

    tableBody.innerHTML = "";

    rows.forEach(rowData => {

        const row = document.createElement("tr");

        if (rowData.serviced === false) {
            row.classList.add("row-no-service");
        }

        row.innerHTML = `
            <td>${rowData.move}${rowData.serviced === false ? ' <span class="no-service-tag">(no service)</span>' : ''}</td>
            <td>${rowData.distance}</td>
        `;

        tableBody.appendChild(row);

    });

}

// ==========================================
// TIMELINE
// ==========================================

function drawTimeline(sequence, serviced, jumps) {

    timelineContainer.innerHTML = "";

    if (!sequence || sequence.length === 0) return;

    // Default everything to "serviced" if the backend didn't provide flags
    if (!serviced || serviced.length !== sequence.length) {
        serviced = sequence.map(() => true);
    }
    if (!jumps || jumps.length !== sequence.length - 1) {
        jumps = sequence.slice(1).map(() => false);
    }

    const min   = Math.min(...sequence);
    const max   = Math.max(...sequence);
    const range = (max - min) || 1;

    const width     = 900;
    const marginX   = 50;
    const innerW    = width - marginX * 2;
    const axisY     = 40;
    const rowGap    = 40;
    const topPad    = 70;
    const bottomPad = 30;

    const height = topPad + (sequence.length - 1) * rowGap + bottomPad;

    const xPos = v => marginX + ((v - min) / range) * innerW;

    // Coordinates for each step
    const coords = sequence.map((v, i) => ({
        x: xPos(v),
        y: topPad + i * rowGap,
        value: v,
        serviced: serviced[i]
    }));

    // Axis line
    let svg = `<line x1="${marginX}" y1="${axisY}" x2="${width - marginX}" y2="${axisY}" stroke="#333" stroke-width="1.5"/>`;

    // Ticks + labels — skip labels that would overlap the previous one
    const uniqueSorted = [...new Set(sequence)].sort((a, b) => a - b);
    const MIN_LABEL_GAP = 34;
    const labels = uniqueSorted.map(v => ({
        value: v,
        tickX: xPos(v),
        labelX: xPos(v)
    }));

    for (let i = 1; i < labels.length; i++) {
        labels[i].labelX = Math.max(labels[i].labelX, labels[i - 1].labelX + MIN_LABEL_GAP);
    }

    const maxLabelX = width - marginX;
    const overflow = labels.length ? labels[labels.length - 1].labelX - maxLabelX : 0;
    if (overflow > 0) {
        labels.forEach(label => {
            label.labelX -= overflow;
        });

        for (let i = labels.length - 2; i >= 0; i--) {
            labels[i].labelX = Math.min(labels[i].labelX, labels[i + 1].labelX - MIN_LABEL_GAP);
        }
    }

    labels.forEach(label => {
        const x = label.tickX;

        // Always draw the tick mark
        svg += `<line x1="${x}" y1="${axisY}" x2="${x}" y2="${axisY + 8}" stroke="#1565c0" stroke-width="1.5"/>`;

        if (Math.abs(label.labelX - label.tickX) > 2) {
            svg += `<line x1="${label.tickX}" y1="${axisY - 3}" x2="${label.labelX}" y2="${axisY - 12}" stroke="#1565c0" stroke-width="1" opacity="0.5"/>`;
        }

        svg += `<text x="${label.labelX}" y="${axisY - 14}" text-anchor="middle" font-size="11" font-weight="600" fill="#1565c0">${label.value}</text>`;
    });

    // Connecting lines — dashed when EITHER endpoint is unserviced (boundary
    // turnaround in SCAN/C-SCAN) or when there's zero distance (duplicate request)
    for (let i = 0; i < coords.length - 1; i++) {
        const a = coords[i];
        const b = coords[i + 1];
        const dist = Math.abs(b.value - a.value);
        const dashed = jumps[i] || dist === 0;

        svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"
                    stroke="#1565c0" stroke-width="2"
                    ${dashed ? 'stroke-dasharray="6,5"' : ''}/>`;
    }

    // Point markers — unserviced (boundary) points get a hollow marker
    coords.forEach((c, i) => {
        if (i === 0) {
            // initial head position
            svg += `<circle cx="${c.x}" cy="${c.y}" r="4" fill="#1565c0"/>`;
        } else if (!c.serviced) {
            svg += `<circle cx="${c.x}" cy="${c.y}" r="4" fill="white" stroke="#1565c0" stroke-width="2"/>`;
        } else {
            svg += `<circle cx="${c.x}" cy="${c.y}" r="4" fill="#1565c0"/>`;
        }
    });

    timelineContainer.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%"
             preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
            ${svg}
        </svg>
    `;

}

// ==========================================
// RESET
// ==========================================

resetBtn.addEventListener("click", () => {

    algorithmSelect.value = "";

    document.getElementById("request-queue").value  = "";
    document.getElementById("head-position").value  = "";

    placeholderMsg.style.display = "flex";
    resultState.style.display    = "none";

    tableBody.innerHTML   = "";
    totalSeek.textContent = "0 Tracks";

    timelineContainer.innerHTML = `
        <div class="timeline-placeholder">
            Timeline Visualization Here
        </div>
    `;

});
