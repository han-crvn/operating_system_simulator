// ==========================================
// DISK SCHEDULING MOCK FRONTEND
// ==========================================

// ---------- MOCK RESULTS ----------

const mockResults = {
    FCFS: {
        totalSeek: 642,
        rows: [
            ["50 → 82", 32],
            ["82 → 170", 88],
            ["170 → 43", 127],
            ["43 → 140", 97],
            ["140 → 24", 116],
            ["24 → 16", 8],
            ["16 → 190", 174]
        ]
    },

    SSTF: {
        totalSeek: 236,
        rows: [
            ["65 → 53", 12],
            ["67 → 65", 2],
            ["67 → 37", 30],
            ["37 → 14", 23],
            ["98 → 14", 84]
        ]
    },

    SCAN: {
        totalSeek: 208,
        rows: [
            ["53 → 37", 16],
            ["37 → 14", 23],
            ["14 → 0", 14],
            ["0 → 65", 65],
            ["65 → 67", 2],
            ["67 → 98", 31]
        ]
    },

    CSCAN: {
        totalSeek: 382,
        rows: [
            ["53 → 65", 12],
            ["65 → 67", 2],
            ["67 → 98", 31],
            ["98 → 199", 101],
            ["199 → 0", 199]
        ]
    },

    LOOK: {
        totalSeek: 195,
        rows: [
            ["53 → 37", 16],
            ["37 → 14", 23],
            ["14 → 65", 51],
            ["65 → 67", 2],
            ["67 → 98", 31]
        ]
    },

    CLOOK: {
        totalSeek: 321,
        rows: [
            ["53 → 65", 12],
            ["65 → 67", 2],
            ["67 → 98", 31],
            ["98 → 14", 84],
            ["14 → 37", 23]
        ]
    }
};

// ---------- ELEMENTS ----------

const algorithmSelect =
    document.getElementById("algorithm-select");

const simulateBtn =
    document.getElementById("simulate-btn");

const resetBtn =
    document.getElementById("reset-btn");

const defaultState =
    document.getElementById("default-state");

const resultState =
    document.getElementById("result-state");

const resultDescription =
    document.getElementById("result-description");

const tableBody =
    document.getElementById("result-table-body");

const totalSeek =
    document.getElementById("total-seek");

const timelineContainer =
    document.getElementById("timeline-container");

// ==========================================
// ALGORITHM SELECTED
// ==========================================

algorithmSelect.addEventListener("change", () => {

    if (algorithmSelect.value !== "") {

        document.getElementById("placeholder-msg").style.display = "none";

        document.getElementById("result-state").style.display = "flex";

        document.getElementById("result-description").textContent =
            `Results showing ${algorithmSelect.value} disk scheduling.`;

    } else {

        document.getElementById("placeholder-msg").style.display = "flex";

        document.getElementById("result-state").style.display = "none";

    }

});

// ==========================================
// SIMULATE
// ==========================================

simulateBtn.addEventListener("click", () => {

    const algorithm = algorithmSelect.value;

    if (!algorithm) {
        alert("Please select an algorithm.");
        return;
    }

    const result = mockResults[algorithm];

    populateTable(result.rows);

    totalSeek.textContent =
        `${result.totalSeek} Tracks`;

    drawMockTimeline(algorithm);

});

// ==========================================
// TABLE
// ==========================================

function populateTable(rows) {

    tableBody.innerHTML = "";

    rows.forEach(rowData => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${rowData[0]}</td>
            <td>${rowData[1]}</td>
        `;

        tableBody.appendChild(row);

    });

}

// ==========================================
// TIMELINE PLACEHOLDER
// ==========================================

function drawMockTimeline(algorithm) {

    timelineContainer.innerHTML = `

        <div style="
            width:100%;
            height:100%;
            display:flex;
            justify-content:center;
            align-items:center;
            flex-direction:column;
            gap:15px;
            color:#555;
        ">

            <h3>${algorithm}</h3>

            <p>
                Timeline visualization placeholder
            </p>

            <p>
                Replace with actual graph later.
            </p>

        </div>

    `;

}

// ==========================================
// RESET
// ==========================================

resetBtn.addEventListener("click", () => {

    algorithmSelect.value = "";

    document.getElementById("request-queue").value = "";

    document.getElementById("head-position").value = "";

    defaultState.style.display = "flex";

    resultState.style.display = "none";

    tableBody.innerHTML = "";

    totalSeek.textContent = "0 Tracks";

    timelineContainer.innerHTML = `
        <div class="timeline-placeholder">
            Timeline Visualization Here
        </div>
    `;

});