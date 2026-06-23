VALID_ALGORITHMS = {
    "fcfs",
    "sjf-non",
    "sjf-pre",
    "priority-non",
    "priority-pre",
    "rr",
}

PRIORITY_ALGORITHMS = {"priority-non", "priority-pre"}


def calculate_cpu_schedule(algorithm, processes, quantum=2):
    if algorithm not in VALID_ALGORITHMS:
        raise ValueError("Invalid scheduling algorithm.")

    normalized = [_normalize_process(process) for process in processes]
    if not normalized:
        raise ValueError("At least one process is required.")

    if algorithm == "fcfs":
        return _fcfs(normalized)
    if algorithm == "sjf-non":
        return _sjf_non_preemptive(normalized)
    if algorithm == "sjf-pre":
        return _sjf_preemptive(normalized)
    if algorithm == "priority-non":
        return _priority_non_preemptive(normalized)
    if algorithm == "priority-pre":
        return _priority_preemptive(normalized)
    if algorithm == "rr":
        return _round_robin(normalized, max(1, int(quantum or 2)))

    raise ValueError("Invalid scheduling algorithm.")


def _normalize_process(process):
    pid = int(process.get("id", 0))
    arrival = int(process.get("arrival", 0))
    burst = int(process.get("burst", 1))
    priority = int(process.get("priority", 1))

    if pid <= 0:
        raise ValueError("Process id must be greater than 0.")
    if arrival < 0:
        raise ValueError("Arrival time must be 0 or greater.")
    if burst <= 0:
        raise ValueError("Burst time must be greater than 0.")
    if priority <= 0:
        raise ValueError("Priority must be greater than 0.")

    return {
        "id": pid,
        "arrival": arrival,
        "burst": burst,
        "priority": priority,
    }


def _fcfs(processes):
    procs = sorted((p.copy() for p in processes), key=lambda p: (p["arrival"], p["id"]))
    time = 0
    gantt = []

    for process in procs:
        time = max(time, process["arrival"])
        process["start"] = time
        process["finish"] = time + process["burst"]
        _append_gantt_block(gantt, process, process["start"], process["finish"])
        time = process["finish"]

    return _build_result(procs, gantt)


def _sjf_non_preemptive(processes):
    time = 0
    done = []
    gantt = []
    remaining = [p.copy() for p in processes]

    while remaining:
        available = [p for p in remaining if p["arrival"] <= time]
        if not available:
            time = min(p["arrival"] for p in remaining)
            continue

        process = min(available, key=lambda p: (p["burst"], p["arrival"], p["id"]))
        remaining.remove(process)
        process["start"] = time
        process["finish"] = time + process["burst"]
        _append_gantt_block(gantt, process, process["start"], process["finish"])
        time = process["finish"]
        done.append(process)

    return _build_result(done, gantt)


def _sjf_preemptive(processes):
    rem = [{**p, "rem": p["burst"], "start": -1, "finish": -1} for p in processes]
    time = 0
    done = 0
    gantt = []
    last_id = None

    while done < len(rem):
        available = [p for p in rem if p["arrival"] <= time and p["rem"] > 0]
        if not available:
            next_time = min(p["arrival"] for p in rem if p["rem"] > 0)
            _append_idle_block(gantt, time, next_time)
            time = next_time
            last_id = None
            continue

        process = min(available, key=lambda p: (p["rem"], p["arrival"], p["id"]))
        if process["start"] == -1:
            process["start"] = time

        if last_id != process["id"]:
            _append_gantt_block(gantt, process, time, time + 1)
        else:
            gantt[-1]["end"] += 1

        process["rem"] -= 1
        time += 1
        if process["rem"] == 0:
            process["finish"] = time
            done += 1
        last_id = process["id"]

    return _build_result(rem, gantt)


def _priority_non_preemptive(processes):
    time = 0
    done = []
    gantt = []
    remaining = [p.copy() for p in processes]

    while remaining:
        available = [p for p in remaining if p["arrival"] <= time]
        if not available:
            time = min(p["arrival"] for p in remaining)
            continue

        process = min(available, key=lambda p: (p["priority"], p["arrival"], p["id"]))
        remaining.remove(process)
        process["start"] = time
        process["finish"] = time + process["burst"]
        _append_gantt_block(gantt, process, process["start"], process["finish"])
        time = process["finish"]
        done.append(process)

    return _build_result(done, gantt, has_priority=True)


def _priority_preemptive(processes):
    rem = [{**p, "rem": p["burst"], "start": -1, "finish": -1} for p in processes]
    time = 0
    done = 0
    gantt = []
    last_id = None

    while done < len(rem):
        available = [p for p in rem if p["arrival"] <= time and p["rem"] > 0]
        if not available:
            next_time = min(p["arrival"] for p in rem if p["rem"] > 0)
            _append_idle_block(gantt, time, next_time)
            time = next_time
            last_id = None
            continue

        process = min(available, key=lambda p: (p["priority"], p["arrival"], p["id"]))
        if process["start"] == -1:
            process["start"] = time

        if last_id != process["id"]:
            _append_gantt_block(gantt, process, time, time + 1)
        else:
            gantt[-1]["end"] += 1

        process["rem"] -= 1
        time += 1
        if process["rem"] == 0:
            process["finish"] = time
            done += 1
        last_id = process["id"]

    return _build_result(rem, gantt, has_priority=True)


def _round_robin(processes, quantum):
    rem = sorted(
        ({**p, "rem": p["burst"], "start": -1, "finish": -1} for p in processes),
        key=lambda p: (p["arrival"], p["id"]),
    )
    time = 0
    idx = 0
    completed = 0
    queue = []
    gantt = []

    while idx < len(rem) and rem[idx]["arrival"] <= time:
        queue.append(rem[idx])
        idx += 1

    while completed < len(rem):
        if not queue:
            next_time = max(time, rem[idx]["arrival"])
            _append_idle_block(gantt, time, next_time)
            time = next_time
            while idx < len(rem) and rem[idx]["arrival"] <= time:
                queue.append(rem[idx])
                idx += 1

        process = queue.pop(0)
        if process["start"] == -1:
            process["start"] = time

        run = min(process["rem"], quantum)
        _append_gantt_block(gantt, process, time, time + run)
        time += run
        process["rem"] -= run

        while idx < len(rem) and rem[idx]["arrival"] <= time:
            queue.append(rem[idx])
            idx += 1

        if process["rem"] > 0:
            queue.append(process)
        else:
            process["finish"] = time
            completed += 1

    return _build_result(rem, gantt)


def _gantt_block(process, start, end):
    return {
        "name": f"P{process['id']}",
        "start": start,
        "end": end,
        "id": process["id"],
    }


def _idle_block(start, end):
    return {
        "name": "Idle",
        "start": start,
        "end": end,
        "id": "idle",
    }


def _append_idle_block(gantt, start, end):
    if start >= end:
        return
    if gantt and gantt[-1]["id"] == "idle" and gantt[-1]["end"] == start:
        gantt[-1]["end"] = end
        return
    gantt.append(_idle_block(start, end))


def _append_gantt_block(gantt, process, start, end):
    previous_end = gantt[-1]["end"] if gantt else 0
    _append_idle_block(gantt, previous_end, start)
    gantt.append(_gantt_block(process, start, end))


def _build_result(processes, gantt, has_priority=False):
    rows = []
    for process in processes:
        turnaround_time = process["finish"] - process["arrival"]
        waiting_time = turnaround_time - process["burst"]
        rows.append({
            "name": f"P{process['id']}",
            "arrival": process["arrival"],
            "burst": process["burst"],
            "priority": process["priority"],
            "tat": turnaround_time,
            "wt": waiting_time,
        })

    avg_wt = sum(row["wt"] for row in rows) / len(rows)
    avg_tat = sum(row["tat"] for row in rows) / len(rows)

    return {
        "gantt": gantt,
        "rows": rows,
        "avgWt": avg_wt,
        "avgTat": avg_tat,
        "hasPriority": has_priority,
    }
