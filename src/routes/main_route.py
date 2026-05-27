from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('homepage.html')

@main_bp.route('/cpu_scheduling')
def about():
    return render_template('cpu_scheduling.html')