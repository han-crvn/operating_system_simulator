from flask import Blueprint, request, jsonify
from src.logic.memory_management import best_fit, first_fit, worst_fit, mvt_without_compaction, mvt_with_compaction

memory_management_bp = Blueprint("memory_management", __name__)

@memory_management_bp.route("/simulate-memory", methods=["POST"])
def simulate_mft():

    data = request.json

    algorithm = data["algorithm"]

    partitions = data["partitions"]

    processes = data["processes"]

    if algorithm == "best_fit":

        result = best_fit(
            partitions,
            processes
        )

    elif algorithm == "first_fit":

        result = first_fit(
            partitions,
            processes
        )

    elif algorithm == "worst_fit":

        result = worst_fit(
            partitions,
            processes
        )

    else:

        return jsonify({
            "error": "Invalid Algorithm"
        }), 400

    return jsonify(result)


# ==================================================
# MVT
# ==================================================

@memory_management_bp.route(
    "/simulate-mvt",
    methods=["POST"]
)
def simulate_mvt():

    data = request.json

    mode = data["mode"]

    total_memory = data["total_memory"]

    os_size = data["os_size"]

    processes = data["processes"]

    if mode == "without_compaction":

        result = mvt_without_compaction(
            total_memory,
            os_size,
            processes
        )

    else:

        result = mvt_with_compaction(
            total_memory,
            os_size,
            processes
        )

    return jsonify(result)