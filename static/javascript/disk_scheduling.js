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

        drawTimeline(data.sequence);

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

        row.innerHTML = `
            <td>${rowData.move}</td>
            <td>${rowData.distance}</td>
        `;

        tableBody.appendChild(row);

    });

}

// ==========================================
// TIMELINE
// ==========================================

function drawTimeline(sequence) {

    timelineContainer.innerHTML = "";

    const wrapper = document.createElement("div");

    wrapper.style.padding    = "20px";
    wrapper.style.width      = "100%";
    wrapper.style.textAlign  = "center";
    wrapper.style.fontSize   = "18px";
    wrapper.style.fontWeight = "600";

    wrapper.textContent = sequence.join(" → ");

    timelineContainer.appendChild(wrapper);

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