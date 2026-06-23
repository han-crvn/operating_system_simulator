from flask import Blueprint, request, jsonify
from src.logic.disk_scheduling import fcfs, sstf, scan, cscan, look, clook

disk_scheduling_bp = Blueprint("disk_scheduling", __name__)

@disk_scheduling_bp.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json()

    algorithm = data.get("algorithm", "").upper()
    requests  = data.get("requests", [])
    head      = data.get("head", 0)
    direction = data.get("direction", "right")
    disk_size = data.get("disk_size")

    if not algorithm:
        return jsonify({"error": "No algorithm specified."}), 400

    if not requests:
        return jsonify({"error": "Request queue is empty."}), 400

    algorithms = {
        "FCFS":  lambda: fcfs(requests, head),
        "SSTF":  lambda: sstf(requests, head),
        "SCAN":  lambda: scan(requests, head, direction, disk_size),
        "CSCAN": lambda: cscan(requests, head, direction, disk_size),
        "LOOK":  lambda: look(requests, head, direction),
        "CLOOK": lambda: clook(requests, head, direction),
    }

    if algorithm not in algorithms:
        return jsonify({"error": f"Unknown algorithm: {algorithm}"}), 400

    result = algorithms[algorithm]()
    return jsonify(result)
