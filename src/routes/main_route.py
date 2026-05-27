from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('homepage.html')

@main_bp.route('/cpu_scheduling')
def cpu_scheduling():
    return render_template('cpu_scheduling.html')

@main_bp.route('/contacts')
def contacts():
    return render_template('contacts.html')

@main_bp.route('/projects')
def projects():
    return render_template('projects.html')