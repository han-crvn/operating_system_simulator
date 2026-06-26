# src/logic/memory_management.py

# ==================================================
# MFT ALGORITHMS
# ==================================================

def best_fit(partitions, processes):
    occupied = [False] * len(partitions)
    allocations = []
    used_memory = 0
    total_memory = sum(p["size"] for p in partitions)

    for proc in processes:
        size = proc["size"]
        best_index = -1
        best_size = float("inf")

        for j in range(len(partitions)):
            if not occupied[j] and partitions[j]["size"] >= size and partitions[j]["size"] < best_size:
                best_size = partitions[j]["size"]
                best_index = j

        if best_index != -1:
            allocations.append({
                "process": proc["name"],
                "size": size,
                "allocated": partitions[best_index]["name"],
                "status": "Allocated"
            })
            occupied[best_index] = True
            used_memory += size
        else:
            allocations.append({
                "process": proc["name"],
                "size": size,
                "allocated": "-",
                "status": "Not Allocated"
            })

    return _build_mft_result(partitions, occupied, allocations, used_memory, total_memory)


def first_fit(partitions, processes):
    occupied = [False] * len(partitions)
    allocations = []
    used_memory = 0
    total_memory = sum(p["size"] for p in partitions)

    for proc in processes:
        size = proc["size"]
        allocated = False

        for j in range(len(partitions)):
            if not occupied[j] and partitions[j]["size"] >= size:
                allocations.append({
                    "process": proc["name"],
                    "size": size,
                    "allocated": partitions[j]["name"],
                    "status": "Allocated"
                })
                occupied[j] = True
                used_memory += size
                allocated = True
                break

        if not allocated:
            allocations.append({
                "process": proc["name"],
                "size": size,
                "allocated": "-",
                "status": "Not Allocated"
            })

    return _build_mft_result(partitions, occupied, allocations, used_memory, total_memory)


def worst_fit(partitions, processes):
    occupied = [False] * len(partitions)
    allocations = []
    used_memory = 0
    total_memory = sum(p["size"] for p in partitions)

    for proc in processes:
        size = proc["size"]
        worst_index = -1
        largest = -1

        for j in range(len(partitions)):
            if not occupied[j] and partitions[j]["size"] >= size and partitions[j]["size"] > largest:
                largest = partitions[j]["size"]
                worst_index = j

        if worst_index != -1:
            allocations.append({
                "process": proc["name"],
                "size": size,
                "allocated": partitions[worst_index]["name"],
                "status": "Allocated"
            })
            occupied[worst_index] = True
            used_memory += size
        else:
            allocations.append({
                "process": proc["name"],
                "size": size,
                "allocated": "-",
                "status": "Not Allocated"
            })

    return _build_mft_result(partitions, occupied, allocations, used_memory, total_memory)


def _build_mft_result(partitions, occupied, allocations, used_memory, total_memory):
    proc_in_partition = {}
    for alloc in allocations:
        if alloc["status"] == "Allocated":
            proc_in_partition[alloc["allocated"]] = alloc

    memory_map = []
    for i, part in enumerate(partitions):
        alloc = proc_in_partition.get(part["name"])
        used_size = alloc["size"] if alloc else 0
        free_size = part["size"] - used_size
        memory_map.append({
            "partition": part["name"],
            "partitionSize": part["size"],
            "usedSize": used_size,
            "freeSize": free_size,
            "process": alloc["process"] if alloc else None
        })

    return {
        "allocations": allocations,
        "memory_map": memory_map,
        "total_memory": total_memory,
        "used_memory": used_memory,
        "free_memory": total_memory - used_memory,
        "utilization": round((used_memory / total_memory) * 100, 2) if total_memory > 0 else 0
    }


# ==================================================
# CPU SCHEDULING — determines load order for MVT
# ==================================================

def apply_cpu_scheduling(processes, algorithm, quantum=2):
    """
    Reorders processes based on CPU scheduling algorithm.
    Each process must have: name, size, arrival, burst.
    Returns processes sorted in the order they should be loaded into memory.
    """
    procs = [p.copy() for p in processes]

    if algorithm == "fcfs":
        # Sort by arrival time
        procs.sort(key=lambda p: (p.get("arrival", 0), p["name"]))

    elif algorithm == "sjf":
        # Sort by burst time (shortest first), tie-break by arrival
        procs.sort(key=lambda p: (p.get("burst", 0), p.get("arrival", 0)))

    elif algorithm == "priority":
        # Sort by priority (lower number = higher priority), tie-break by arrival
        procs.sort(key=lambda p: (p.get("priority", 0), p.get("arrival", 0)))

    elif algorithm == "rr":
        # Round Robin: sort by arrival, then interleave by quantum
        # For memory loading purposes, order by arrival time
        procs.sort(key=lambda p: (p.get("arrival", 0), p["name"]))

    return procs


# ==================================================
# MVT ALGORITHMS
# ==================================================

def mvt_without_compaction(total_memory, os_size, processes, cpu_algo="fcfs", quantum=2):
    # Apply CPU scheduling to determine load order
    ordered = apply_cpu_scheduling(processes, cpu_algo, quantum)

    available = total_memory - os_size
    used = 0
    memory_map = [{"type": "OS", "size": os_size, "label": f"OS ({os_size} KB)"}]
    holes = []

    for proc in ordered:
        size = proc["size"]
        name = proc["name"]

        if size <= available:
            memory_map.append({
                "type": "PROCESS",
                "size": size,
                "label": f"{name} ({size} KB)"
            })
            available -= size
            used += size
        else:
            # Doesn't fit — record a hole for leftover space and stop
            if available > 0:
                memory_map.append({
                    "type": "HOLE",
                    "size": available,
                    "label": f"HOLE ({available} KB)"
                })
                holes.append(available)
                available = 0

    if available > 0:
        memory_map.append({
            "type": "HOLE",
            "size": available,
            "label": f"HOLE ({available} KB)"
        })
        holes.append(available)

    largest_hole = max(holes) if holes else 0
    has_fragmentation = len(holes) > 0

    return {
        "memory_map": memory_map,
        "load_order": [p["name"] for p in ordered],
        "total_memory": total_memory,
        "used_memory": used + os_size,
        "free_memory": sum(holes),
        "holes": len(holes),
        "largest_hole": largest_hole,
        "utilization": round(((used + os_size) / total_memory) * 100, 2) if total_memory > 0 else 0,
        "has_fragmentation": has_fragmentation
    }


def mvt_with_compaction(total_memory, os_size, processes, cpu_algo="fcfs", quantum=2):
    # Apply CPU scheduling to determine load order
    ordered = apply_cpu_scheduling(processes, cpu_algo, quantum)

    available = total_memory - os_size
    memory_map = [{"type": "OS", "size": os_size, "label": f"OS ({os_size} KB)"}]
    used = 0
    loaded = []

    for proc in ordered:
        size = proc["size"]
        name = proc["name"]

        if size <= (available - used):
            memory_map.append({
                "type": "PROCESS",
                "size": size,
                "label": f"{name} ({size} KB)"
            })
            used += size
            loaded.append(name)

    # After compaction: single contiguous hole at end
    free = available - used

    if free > 0:
        memory_map.append({
            "type": "HOLE",
            "size": free,
            "label": f"HOLE ({free} KB)\n[Compacted]"
        })

    return {
        "memory_map": memory_map,
        "load_order": [p["name"] for p in ordered],
        "total_memory": total_memory,
        "used_memory": used + os_size,
        "free_memory": free,
        "holes": 1 if free > 0 else 0,
        "largest_hole": free,
        "utilization": round(((used + os_size) / total_memory) * 100, 2) if total_memory > 0 else 0,
        "has_fragmentation": False   # compaction eliminates external fragmentation
    }