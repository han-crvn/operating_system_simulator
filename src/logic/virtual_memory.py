from flask import Flask, request, jsonify
from collections import deque, defaultdict, OrderedDict

app = Flask(__name__)


# =========================
# RESULT FORMATTER
# =========================

def build_result(history, faults, hits):
    return {
        "framesHistory": history,
        "pageFaults": faults,
        "pageHits": hits,
        "totalAccesses": faults + hits
    }


# =========================
# FIFO
# =========================

def fifo(ref, frames_count):
    frames = deque()
    history = []
    faults = 0
    hits = 0

    for page in ref:
        if page in frames:
            hits += 1
        else:
            faults += 1
            if len(frames) == frames_count:
                frames.popleft()
            frames.append(page)

        history.append(list(frames))

    return build_result(history, faults, hits)


# =========================
# OPTIMAL
# =========================

def optimal(ref, frames_count):
    frames = []
    history = []
    faults = 0
    hits = 0

    for i in range(len(ref)):
        page = ref[i]

        if page in frames:
            hits += 1
        else:
            faults += 1

            if len(frames) < frames_count:
                frames.append(page)
            else:
                farthest = -1
                replace_index = -1

                for j in range(len(frames)):
                    try:
                        next_use = ref[i+1:].index(frames[j])
                    except ValueError:
                        next_use = float('inf')

                    if next_use > farthest:
                        farthest = next_use
                        replace_index = j

                frames[replace_index] = page

        history.append(frames.copy())

    return build_result(history, faults, hits)


# =========================
# LRU
# =========================

def lru(ref, frames_count):
    frames = OrderedDict()
    history = []
    faults = 0
    hits = 0

    for page in ref:
        if page in frames:
            hits += 1
            frames.move_to_end(page)
        else:
            faults += 1
            if len(frames) == frames_count:
                frames.popitem(last=False)
            frames[page] = True

        history.append(list(frames.keys()))

    return build_result(history, faults, hits)


# =========================
# LRU APPROX (SECOND CHANCE)
# =========================

def lru_approx(ref, frames_count):
    frames = []
    ref_bit = {}
    queue = deque()

    history = []
    faults = 0
    hits = 0

    for page in ref:
        if page in frames:
            hits += 1
            ref_bit[page] = 1
        else:
            faults += 1

            if len(frames) < frames_count:
                frames.append(page)
                queue.append(page)
                ref_bit[page] = 1
            else:
                while True:
                    candidate = queue[0]
                    if ref_bit[candidate] == 0:
                        queue.popleft()
                        frames.remove(candidate)
                        break
                    else:
                        ref_bit[candidate] = 0
                        queue.rotate(-1)

                frames.append(page)
                queue.append(page)
                ref_bit[page] = 1

        history.append(frames.copy())

    return build_result(history, faults, hits)


# =========================
# LFU
# =========================

def lfu(ref, frames_count):
    frames = set()
    freq = defaultdict(int)

    history = []
    faults = 0
    hits = 0

    for page in ref:
        freq[page] += 1

        if page in frames:
            hits += 1
        else:
            faults += 1

            if len(frames) < frames_count:
                frames.add(page)
            else:
                victim = min(frames, key=lambda p: freq[p])
                frames.remove(victim)
                frames.add(page)

        history.append(list(frames))

    return build_result(history, faults, hits)


# =========================
# MFU
# =========================

def mfu(ref, frames_count):
    frames = set()
    freq = defaultdict(int)

    history = []
    faults = 0
    hits = 0

    for page in ref:
        freq[page] += 1

        if page in frames:
            hits += 1
        else:
            faults += 1

            if len(frames) < frames_count:
                frames.add(page)
            else:
                victim = max(frames, key=lambda p: freq[p])
                frames.remove(victim)
                frames.add(page)

        history.append(list(frames))

    return build_result(history, faults, hits)


# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":
    app.run(debug=True)