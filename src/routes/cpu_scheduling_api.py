from flask import Blueprint, jsonify, request

from src.logic.cpu_scheduling import calculate_cpu_schedule

cpu_scheduling_api_bp = Blueprint("cpu_scheduling_api", __name__)


@cpu_scheduling_api_bp.route("/api/cpu_scheduling/calculate", methods=["POST"])
def calculate_cpu_scheduling():
    data = request.get_json(silent=True) or {}

    try:
        result = calculate_cpu_schedule(
            algorithm=data.get("algorithm"),
            processes=data.get("processes", []),
            quantum=data.get("quantum", 2),
        )
    except (TypeError, ValueError) as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(result)
