from flask import Flask, request, jsonify

app = Flask(__name__)

def seek(a, b):
    return abs(a - b)


def build_result(sequence, serviced=None, jumps=None):
    if serviced is None:
        serviced = [True] * len(sequence)
    if jumps is None:
        jumps = [False] * max(len(sequence) - 1, 0)
    if len(jumps) < len(sequence) - 1:
        jumps += [False] * (len(sequence) - 1 - len(jumps))

    rows = []
    total_seek = 0

    for i in range(len(sequence) - 1):
        frm = sequence[i]
        to = sequence[i + 1]
        dist = seek(frm, to)

        rows.append({
            "move": f"{frm} → {to}",
            "distance": dist,
            "serviced": bool(serviced[i + 1]),
            "jump": bool(jumps[i])
        })

        total_seek += dist

    return {
        "sequence": sequence,
        "serviced": serviced,
        "jumps": jumps,
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

def scan(requests, head, direction="right", disk_size=None):
    if disk_size is None:
        return look(requests, head, direction)

    # Separate requests strictly below and at-or-above head
    left  = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])

    sequence = [head]
    serviced = [True]

    if direction == "right":
        # Service requests to the right first
        sequence += right
        serviced += [True] * len(right)

        # Sweep to the disk boundary (always unserviced — it's a turnaround point)
        boundary = disk_size - 1
        if not right or right[-1] != boundary:
            sequence.append(boundary)
            serviced.append(False)

        # Then sweep back left
        sequence += left[::-1]
        serviced += [True] * len(left)

    else:
        # Service requests to the left first
        sequence += left[::-1]
        serviced += [True] * len(left)

        # Sweep to track 0 (always unserviced)
        if not left or left[0] != 0:
            sequence.append(0)
            serviced.append(False)

        # Then sweep right
        sequence += right
        serviced += [True] * len(right)

    return build_result(sequence, serviced)


# =========================
# C-SCAN
# =========================

def cscan(requests, head, direction="right", disk_size=None):
    if disk_size is None:
        left  = sorted([r for r in requests if r < head])
        right = sorted([r for r in requests if r >= head])

        sequence = [head]
        serviced = [True]
        jumps = []

        if direction == "right":
            sequence += right
            serviced += [True] * len(right)
            jumps += [False] * len(right)

            if right and left:
                jumps.append(True)
            elif not right and left:
                jumps.append(True)

            sequence += left
            serviced += [True] * len(left)
            jumps += [False] * max(len(left) - 1, 0)

        else:
            sequence += left[::-1]
            serviced += [True] * len(left)
            jumps += [False] * len(left)

            if left and right:
                jumps.append(True)
            elif not left and right:
                jumps.append(True)

            sequence += right[::-1]
            serviced += [True] * len(right)
            jumps += [False] * max(len(right) - 1, 0)

        return build_result(sequence, serviced, jumps)

    left  = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])

    sequence = [head]
    serviced = [True]
    jumps = []

    if direction == "right":
        # Service right side
        jumps += [False] * len(right)
        sequence += right
        serviced += [True] * len(right)

        # Go to far boundary (unserviced)
        boundary_high = disk_size - 1
        if not right or right[-1] != boundary_high:
            jumps.append(False)
            sequence.append(boundary_high)
            serviced.append(False)

        # Jump to track 0 (unserviced)
        jumps.append(True)
        sequence.append(0)
        serviced.append(False)

        # Service left side (ascending order for C-SCAN)
        jumps += [False] * len(left)
        sequence += left
        serviced += [True] * len(left)

    else:
        # Service left side (descending)
        jumps += [False] * len(left)
        sequence += left[::-1]
        serviced += [True] * len(left)

        # Go to track 0 (unserviced)
        if not left or left[0] != 0:
            jumps.append(False)
            sequence.append(0)
            serviced.append(False)

        # Jump to far boundary (unserviced)
        jumps.append(True)
        sequence.append(disk_size - 1)
        serviced.append(False)

        # Service right side (descending)
        jumps += [False] * len(right)
        sequence += right[::-1]
        serviced += [True] * len(right)

    return build_result(sequence, serviced, jumps)


# =========================
# LOOK
# =========================

def look(requests, head, direction="right"):
    left  = sorted([r for r in requests if r < head])
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
    left  = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])

    sequence = [head]
    jumps = []

    if direction == "right":
        jumps += [False] * len(right)
        sequence += right
        if right and left:
            jumps.append(True)
        jumps += [False] * max(len(left) - 1, 0)
        sequence += left
    else:
        jumps += [False] * len(left)
        sequence += left[::-1]
        if left and right:
            jumps.append(True)
        jumps += [False] * max(len(right) - 1, 0)
        sequence += right[::-1]

    return build_result(sequence, jumps=jumps)


# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":
    app.run(debug=True)
