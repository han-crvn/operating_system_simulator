from flask import Blueprint, request, jsonify
from src.logic.virtual_memory import fifo, optimal, lru, lru_approx, lfu, mfu

virtual_memory_bp = Blueprint("virtual_memory", __name__)

@virtual_memory_bp.route("/simulate-virtual", methods=["POST"])
def simulate_virtual():
    data = request.get_json()

    algorithm    = data.get("algorithm", "").lower()
    ref          = data.get("pages", [])
    frames_count = data.get("capacity", 0)

    if not algorithm or algorithm == "none":
        return jsonify({"error": "No algorithm specified."}), 400

    if not ref:
        return jsonify({"error": "Reference string is empty."}), 400

    if not isinstance(frames_count, int) or frames_count <= 0:
        return jsonify({"error": "Frame count must be a positive integer."}), 400

    algorithms = {
        "fifo":       lambda: fifo(ref, frames_count),
        "opt":        lambda: optimal(ref, frames_count),
        "lru":        lambda: lru(ref, frames_count),
        "lru-approx": lambda: lru_approx(ref, frames_count),
        "lfu":        lambda: lfu(ref, frames_count),
        "mfu":        lambda: mfu(ref, frames_count),
    }

    if algorithm not in algorithms:
        return jsonify({"error": f"Unknown algorithm: {algorithm}"}), 400

    result = algorithms[algorithm]()
    return jsonify(result)
