from flask import Flask
from src.routes.cpu_scheduling_api import cpu_scheduling_api_bp
from src.routes.main_route import main_bp

app = Flask(__name__)

app.register_blueprint(main_bp)
app.register_blueprint(cpu_scheduling_api_bp)

if __name__ == '__main__':
    app.run(debug=True)
