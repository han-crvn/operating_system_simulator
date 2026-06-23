from flask import Blueprint, request, jsonify
from src.logic.memory_management import fifo, optimal, lru, lru_approx, lfu, mfu

memory_management_bp = Blueprint("memory_management", __name__)

@memory_management_bp.route("/simulate-memory", methods=["POST"])
def simulate_memory():
    data = request.get_json()

    algorithm = data.get("algorithm", "").lower()
    pages     = data.get("pages", [])
    capacity  = data.get("capacity", 0)

    if not algorithm or algorithm == "none":
        return jsonify({"error": "No algorithm specified."}), 400

    if not pages:
        return jsonify({"error": "Page reference string is empty."}), 400

    if not isinstance(capacity, int) or capacity <= 0:
        return jsonify({"error": "Frame capacity must be a positive integer."}), 400

    algorithms = {
        "fifo":      lambda: fifo(pages, capacity),
        "opt":       lambda: optimal(pages, capacity),
        "lru":       lambda: lru(pages, capacity),
        "lru-approx": lambda: lru_approx(pages, capacity),
        "lfu":       lambda: lfu(pages, capacity),
        "mfu":       lambda: mfu(pages, capacity),
    }

    if algorithm not in algorithms:
        return jsonify({"error": f"Unknown algorithm: {algorithm}"}), 400

    result = algorithms[algorithm]()
    return jsonify(result)