from flask import Blueprint, request, jsonify
from src.logic.memory_management import (
    best_fit, first_fit, worst_fit,
    mvt_without_compaction, mvt_with_compaction
)

memory_management_bp = Blueprint("memory_management", __name__)

@memory_management_bp.route("/simulate-memory", methods=["POST"])
def simulate_mft():
    data = request.get_json()

    algorithm  = data.get("algorithm")
    partitions = data.get("partitions", [])
    processes  = data.get("processes", [])

    if not algorithm:
        return jsonify({"error": "No algorithm specified."}), 400
    if not partitions:
        return jsonify({"error": "No partitions provided."}), 400
    if not processes:
        return jsonify({"error": "No processes provided."}), 400

    algorithms = {
        "best_fit":  lambda: best_fit(partitions, processes),
        "first_fit": lambda: first_fit(partitions, processes),
        "worst_fit": lambda: worst_fit(partitions, processes),
    }

    if algorithm not in algorithms:
        return jsonify({"error": f"Invalid algorithm: {algorithm}"}), 400

    return jsonify(algorithms[algorithm]())

@memory_management_bp.route("/simulate-mvt", methods=["POST"])
def simulate_mvt():
    data = request.get_json()

    mode         = data.get("mode")
    total_memory = data.get("total_memory", 0)
    os_size      = data.get("os_size", 100)
    processes    = data.get("processes", [])
    cpu_algo     = data.get("cpu_algo", "fcfs")   # ← now read from request
    quantum      = data.get("quantum", 2)          # ← now read from request

    if not mode:
        return jsonify({"error": "No mode specified."}), 400
    if not processes:
        return jsonify({"error": "No processes provided."}), 400
    if not isinstance(total_memory, (int, float)) or total_memory <= 0:
        return jsonify({"error": "Total memory must be a positive number."}), 400
    if os_size >= total_memory:
        return jsonify({"error": f"OS size ({os_size} KB) must be smaller than total memory ({total_memory} KB)."}), 400

    modes = {
        "without_compaction": lambda: mvt_without_compaction(total_memory, os_size, processes, cpu_algo, quantum),
        "with_compaction":    lambda: mvt_with_compaction(total_memory, os_size, processes, cpu_algo, quantum),
    }

    if mode not in modes:
        return jsonify({"error": f"Invalid mode: {mode}"}), 400

    return jsonify(modes[mode]())