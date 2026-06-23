from flask import Flask
from src.routes.cpu_scheduling_api import cpu_scheduling_api_bp
from src.routes.main_route import main_bp
from src.routes.disk_scheduling_route import disk_scheduling_bp
from src.routes.memory_management_route import memory_management_bp
from src.routes.virtual_memory_route import virtual_memory_bp

app = Flask(__name__)

app.register_blueprint(main_bp)
app.register_blueprint(cpu_scheduling_api_bp)
app.register_blueprint(disk_scheduling_bp)
app.register_blueprint(memory_management_bp)
app.register_blueprint(virtual_memory_bp)

if __name__ == '__main__':
    app.run(debug=True)
