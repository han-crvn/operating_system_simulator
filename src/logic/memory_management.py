from flask import Flask, request, jsonify

app = Flask(__name__)

# ==================================================
# MFT ALGORITHMS
# ==================================================

def best_fit(partitions, processes):

    free = partitions.copy()
    allocations = []
    used_memory = 0

    for i, process in enumerate(processes):

        best_index = -1
        best_size = float("inf")

        for j in range(len(free)):

            if free[j] >= process and free[j] < best_size:

                best_size = free[j]
                best_index = j

        if best_index != -1:

            allocations.append({
                "process": f"P{i+1}",
                "size": process,
                "allocated": f"P{best_index+1}",
                "status": "Allocated"
            })

            free[best_index] -= process
            used_memory += process

        else:

            allocations.append({
                "process": f"P{i+1}",
                "size": process,
                "allocated": "-",
                "status": "Not Allocated"
            })

    return {
        "allocations": allocations,
        "used_memory": used_memory,
        "free_memory": sum(free),
        "utilization": round(
            (used_memory / sum(partitions)) * 100,
            2
        )
    }


def first_fit(partitions, processes):

    free = partitions.copy()
    allocations = []
    used_memory = 0

    for i, process in enumerate(processes):

        allocated = False

        for j in range(len(free)):

            if free[j] >= process:

                allocations.append({
                    "process": f"P{i+1}",
                    "size": process,
                    "allocated": f"P{j+1}",
                    "status": "Allocated"
                })

                free[j] -= process
                used_memory += process
                allocated = True
                break

        if not allocated:

            allocations.append({
                "process": f"P{i+1}",
                "size": process,
                "allocated": "-",
                "status": "Not Allocated"
            })

    return {
        "allocations": allocations,
        "used_memory": used_memory,
        "free_memory": sum(free),
        "utilization": round(
            (used_memory / sum(partitions)) * 100,
            2
        )
    }


def worst_fit(partitions, processes):

    free = partitions.copy()
    allocations = []
    used_memory = 0

    for i, process in enumerate(processes):

        worst_index = -1
        largest = -1

        for j in range(len(free)):

            if free[j] >= process and free[j] > largest:

                largest = free[j]
                worst_index = j

        if worst_index != -1:

            allocations.append({
                "process": f"P{i+1}",
                "size": process,
                "allocated": f"P{worst_index+1}",
                "status": "Allocated"
            })

            free[worst_index] -= process
            used_memory += process

        else:

            allocations.append({
                "process": f"P{i+1}",
                "size": process,
                "allocated": "-",
                "status": "Not Allocated"
            })

    return {
        "allocations": allocations,
        "used_memory": used_memory,
        "free_memory": sum(free),
        "utilization": round(
            (used_memory / sum(partitions)) * 100,
            2
        )
    }


# ==================================================
# MVT
# ==================================================

def mvt_without_compaction(
        total_memory,
        os_size,
        processes
):

    available = total_memory - os_size

    used = 0

    memory_map = []

    for process in processes:

        if process <= available:

            memory_map.append({
                "type": "PROCESS",
                "size": process
            })

            available -= process
            used += process

    memory_map.append({
        "type": "HOLE",
        "size": available
    })

    return {

        "memory_map": memory_map,

        "used_memory": used,

        "free_memory": available,

        "holes": 1,

        "utilization": round(
            (used / total_memory) * 100,
            2
        )
    }


def mvt_with_compaction(
        total_memory,
        os_size,
        processes
):

    available = total_memory - os_size

    used = sum(processes)

    free = available - used

    memory_map = []

    for process in processes:

        memory_map.append({
            "type": "PROCESS",
            "size": process
        })

    memory_map.append({
        "type": "HOLE",
        "size": free
    })

    return {

        "memory_map": memory_map,

        "used_memory": used,

        "free_memory": free,

        "holes": 1,

        "utilization": round(
            (used / total_memory) * 100,
            2
        )
    }