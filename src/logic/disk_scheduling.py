from flask import Flask, request, jsonify

app = Flask(__name__)

# =========================
# CORE HELPER
# =========================

def seek(a, b):
    return abs(a - b)


def build_result(sequence):
    rows = []
    total_seek = 0

    for i in range(len(sequence) - 1):
        frm = sequence[i]
        to = sequence[i + 1]
        dist = seek(frm, to)

        rows.append({
            "move": f"{frm} → {to}",
            "distance": dist
        })

        total_seek += dist

    return {
        "sequence": sequence,
        "rows": rows,
        "totalSeek": total_seek
    }


# =========================
# FCFS
# =========================

def fcfs(requests, head):
    sequence = [head] + requests
    return build_result(sequence)


# =========================
# SSTF
# =========================

def sstf(requests, head):
    requests = requests.copy()
    current = head
    sequence = [head]

    while requests:
        nearest = min(requests, key=lambda x: abs(x - current))
        requests.remove(nearest)
        sequence.append(nearest)
        current = nearest

    return build_result(sequence)


# =========================
# SCAN
# =========================

def scan(requests, head, direction="right", disk_size=200):
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])

    sequence = [head]

    if direction == "right":
        sequence += right
        sequence.append(disk_size - 1)
        sequence += left[::-1]
    else:
        sequence += left[::-1]
        sequence.append(0)
        sequence += right

    return build_result(sequence)


# =========================
# C-SCAN
# =========================

def cscan(requests, head, direction="right", disk_size=200):
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])

    sequence = [head]

    if direction == "right":
        sequence += right
        sequence.append(disk_size - 1)
        sequence.append(0)
        sequence += left
    else:
        sequence += left[::-1]
        sequence.append(0)
        sequence.append(disk_size - 1)
        sequence += right[::-1]

    return build_result(sequence)


# =========================
# LOOK
# =========================

def look(requests, head, direction="right"):
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])

    sequence = [head]

    if direction == "right":
        sequence += right
        sequence += left[::-1]
    else:
        sequence += left[::-1]
        sequence += right

    return build_result(sequence)


# =========================
# C-LOOK
# =========================

def clook(requests, head, direction="right"):
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])

    sequence = [head]

    if direction == "right":
        sequence += right
        sequence += left
    else:
        sequence += left[::-1]
        sequence += right[::-1]

    return build_result(sequence)


# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":
    app.run(debug=True)