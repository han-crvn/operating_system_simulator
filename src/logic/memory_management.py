from flask import Flask, request, jsonify
from collections import deque, defaultdict, OrderedDict

app = Flask(__name__)

# FORMAT RESULT
def build_result(frames_history, hits, faults):
    return {
        "framesHistory": frames_history,
        "pageFaults": faults,
        "pageHits": hits
    }

# FIFO
def fifo(pages, capacity):
    frames = deque()
    history = []
    hits = 0
    faults = 0

    for page in pages:
        if page in frames:
            hits += 1
        else:
            faults += 1
            if len(frames) == capacity:
                frames.popleft()
            frames.append(page)

        history.append(list(frames))

    return build_result(history, hits, faults)

# OPTIMAL
def optimal(pages, capacity):
    frames = []
    history = []
    hits = 0
    faults = 0

    for i in range(len(pages)):
        page = pages[i]

        if page in frames:
            hits += 1
        else:
            faults += 1

            if len(frames) < capacity:
                frames.append(page)
            else:
                farthest_index = -1
                replace_index = -1

                for j in range(len(frames)):
                    try:
                        next_use = pages[i+1:].index(frames[j])
                    except ValueError:
                        next_use = float('inf')

                    if next_use > farthest_index:
                        farthest_index = next_use
                        replace_index = j

                frames[replace_index] = page

        history.append(frames.copy())

    return build_result(history, hits, faults)

# LRU
def lru(pages, capacity):
    frames = OrderedDict()
    history = []
    hits = 0
    faults = 0

    for page in pages:
        if page in frames:
            hits += 1
            frames.move_to_end(page)
        else:
            faults += 1
            if len(frames) == capacity:
                frames.popitem(last=False)
            frames[page] = True

        history.append(list(frames.keys()))

    return build_result(history, hits, faults)

# LRU APPROX (Second Chance)

def lru_approx(pages, capacity):
    frames = []
    ref_bits = {}
    queue = deque()

    history = []
    hits = 0
    faults = 0

    for page in pages:
        if page in frames:
            hits += 1
            ref_bits[page] = 1
        else:
            faults += 1

            if len(frames) < capacity:
                frames.append(page)
                queue.append(page)
                ref_bits[page] = 1
            else:
                while True:
                    candidate = queue[0]
                    if ref_bits[candidate] == 0:
                        queue.popleft()
                        frames.remove(candidate)
                        break
                    else:
                        ref_bits[candidate] = 0
                        queue.rotate(-1)

                frames.append(page)
                queue.append(page)
                ref_bits[page] = 1

        history.append(frames.copy())

    return build_result(history, hits, faults)


# LFU
def lfu(pages, capacity):
    frames = set()
    freq = defaultdict(int)
    history = []
    hits = 0
    faults = 0

    for page in pages:
        freq[page] += 1

        if page in frames:
            hits += 1
        else:
            faults += 1

            if len(frames) < capacity:
                frames.add(page)
            else:
                lfu_page = min(frames, key=lambda p: freq[p])
                frames.remove(lfu_page)
                frames.add(page)

        history.append(list(frames))

    return build_result(history, hits, faults)

# MFU
def mfu(pages, capacity):
    frames = set()
    freq = defaultdict(int)
    history = []
    hits = 0
    faults = 0

    for page in pages:
        freq[page] += 1

        if page in frames:
            hits += 1
        else:
            faults += 1

            if len(frames) < capacity:
                frames.add(page)
            else:
                mfu_page = max(frames, key=lambda p: freq[p])
                frames.remove(mfu_page)
                frames.add(page)

        history.append(list(frames))

    return build_result(history, hits, faults)

if __name__ == "__main__":
    app.run(debug=True)