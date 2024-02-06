from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash, json
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin, login_user, login_required, logout_user, current_user
import os
from oauthlib.oauth2 import TokenExpiredError
import re
from flask_dance.contrib.google import make_google_blueprint, google
from extensions import db
from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
login_manager = LoginManager()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.Text, unique=True)  # changed to db.Text
    password = db.Column(db.Text)
    wallpaper = db.Column(db.String(120), nullable=True)
    notecontent = db.Column(db.Text, nullable=True)
    tasks = db.Column(db.Text, nullable=True)

class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text)
    user_username = db.Column(db.String(100), db.ForeignKey('user.username'))
    user = db.Column(db.Text, unique=True)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=True)
    totalPomodoros = db.Column(db.Integer, nullable=True)
    completedPomodoros = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'totalPomodoros': self.totalPomodoros,
        }    
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret-key'
uri = os.getenv("DATABASE_URL_NEU")  # or other relevant config var
if uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = uri

client = OpenAI(
  api_key=os.environ['OPENAI_API_KEY'],  # this is also the default, it can be omitted
)

google_blueprint = make_google_blueprint(
    client_id="97309802024-m1bt3vd3dgfcs8g7k7idngrkmvlvdb8m.apps.googleusercontent.com",
    client_secret="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",
     scope=[
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
    ],
    redirect_url="/google/authorized"
)
app.register_blueprint(google_blueprint, url_prefix="/login/google")
from flask_dance.consumer import oauth_authorized
from flask_dance.contrib.google import google
with app.app_context():
    @oauth_authorized.connect_via(google)
    def google_logged_in(blueprint, token):
        if not token:
            flash("Failed to log in with Google.", category="error")
            return False
        try:
            resp = blueprint.session.get("/oauth2/v1/userinfo")
        except TokenExpiredError:
            blueprint.session.refresh_token(blueprint.token_uri, refresh_token=blueprint.token.get('refresh_token'))
            resp = blueprint.session.get("/oauth2/v1/userinfo")
        if not resp.ok:
            msg = "Failed to fetch user info from Google."
            flash(msg, category="error")
            return False
        info = resp.json()
        blueprint.token = token
        if blueprint.token.get('expires_in') <= 0:
            blueprint.session.refresh_token(blueprint.token_uri, refresh_token=blueprint.token.get('refresh_token'))
        
        
db.init_app(app)
login_manager.login_view = 'login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/google/authorized')
def login_google():
    if not google.authorized:
        return redirect(url_for("google.login"))
    resp = google.get("/oauth2/v1/userinfo")
    if resp.ok:
        session['username'] = resp.json()['email']
        user = User.query.filter_by(username=session['username']).first()
        if user is None:
            user = User(username=session['username'])
            db.session.add(user)
            db.session.commit()
        login_user(user)
    return redirect(url_for('home'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password, password):
            flash('Invalid username or password.')
            return redirect(url_for('login'))
        login_user(user)
        return redirect(url_for('home'))
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('email')
        password = request.form.get('password')
        repeat_password = request.form.get('repeat_password')
        if not re.match(r"[^@]+@[^@]+\.[^@]+", username):
            flash('Invalid email address.')
            return redirect(url_for('signup'))
        if password != repeat_password:
            flash('Passwords do not match.')
            return redirect(url_for('signup'))
        user = User.query.filter_by(username=username).first()
        if user:
            flash('User already exists.')
            return redirect(url_for('signup'))
        new_user = User(username=username, password=generate_password_hash(password, method='pbkdf2:sha256'))
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('home'))  # Redirect to home page
    return render_template('signup.html')

@app.route('/resetpassword')
def resetpassword():
    return render_template('resetpassword.html')

@app.route('/')
@login_required
def home():
    music_dirs = []
    music_files = []
    video_files = [url_for('static', filename=f) for f in ['bg_wp.mp4', 'bg_wp2.mp4', 'bg_wp3.mp4', 'bg_wp4.mp4', 'bg_wp5.mp4', 'bg_wp6.mp4', 'bg_wp7.mp4', 'bg_wp8.mp4']]
    wallpaper = current_user.wallpaper if current_user.wallpaper else 'bg_wp.mp4'
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    username = User.query.filter_by(username=current_user.username).first()
    for music_dir in music_dirs:
        dir_path = os.path.join(app.static_folder, music_dir)
        music_files += [url_for('static', filename=music_dir + '/' + f) for f in os.listdir(dir_path) if f.endswith('.mp3')]
    return render_template('index.html', music_files=music_files, video_files=video_files, wallpaper=wallpaper, notes=current_user.notecontent, username=username, tasks=tasks )	

@app.route('/get_songs')
@login_required
def get_songs():
    music_dirs = []
    music_files = []
    for music_dir in music_dirs:
        dir_path = os.path.join(app.static_folder, music_dir)
        music_files += [url_for('static', filename=music_dir + '/' + f) for f in os.listdir(dir_path) if f.endswith('.mp3')]
    return jsonify(music_files=music_files)

@app.route('/calendar_events')
@login_required
def calendar_events():
    if not google.authorized:
        return jsonify([])  # Return an empty list if the user is not logged in
    resp = google.get("https://www.googleapis.com/calendar/v3/calendars/primary/events")
    if resp.ok:
        events = resp.json()['items']
        fullcalendar_events = [
            {
                'title': event['summary'],
                'start': event['start']['dateTime'],
                'end': event['end']['dateTime'],
            }
            for event in events
        ]
    else:
        fullcalendar_events = []  # Return an empty list if there was an error
    return jsonify(fullcalendar_events)

@app.route('/Legal Notice')
def legal_notice():
    return render_template('legal_notice.html')

@app.route('/Privacy Policy')
def privacy_policy():
    return render_template('privacy_policy.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/save', methods=['POST'])
@login_required
def save():
    print("saving notes")
    data = request.get_json()
    current_user.notecontent = json.dumps(data)
    db.session.commit()
    return '', 204

@app.route('/set_wallpaper', methods=['POST'])
@login_required
def set_wallpaper():
    data = request.get_json()
    if 'wallpaper' in data:
        current_user.wallpaper = data['wallpaper']
        db.session.commit()
        return jsonify({'message': 'Wallpaper set successfully'}), 200
    return jsonify({'message': 'No wallpaper provided'}), 400

@app.route('/load', methods=['GET'])
@login_required
def load():
    data = json.loads(current_user.notecontent)
    return jsonify(data), 200

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data['message']

 

    return jsonify({'message': 'success', 'response': user_message}), 200

@app.route('/change_password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json()
    current_password = data.get('current-password')
    new_password = data.get('new-password')
    confirm_password = data.get('confirm-password')

    if not current_user.check_password(current_password):
        return jsonify({'error': 'Current password is incorrect'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'New password and confirm password do not match'}), 400

    current_user.set_password(new_password)
    db.session.commit()

    return jsonify({'success': 'Password changed successfully'}), 200

@app.route('/delete_account', methods=['POST'])
@login_required
def delete_account():
    db.session.delete(current_user)
    db.session.commit()
    logout_user()
    return redirect(url_for('login'))

@app.route('/add-task', methods=['POST'])
def add_task():
    task = Task(name=request.json['name'], totalPomodoros=request.json['totalPomodoros'], user_id=current_user.id)
    db.session.add(task)
    db.session.commit()
    print(task.id)
   
    print("test")
    return jsonify(success=True, id=task.id)

@app.route('/edit-task/<int:task_id>', methods=['PUT'])
def edit_task(task_id):
    task = Task.query.get(task_id)
    if task is None:
        return jsonify(success=False, message="Task not found"), 404

    task.name = request.json.get('name', task.name)
    task.totalPomodoros = request.json.get('totalPomodoros', task.totalPomodoros)
    task.completedPomodoros = request.json.get('completedPomodoros', task.completedPomodoros)
    db.session.commit()
    return jsonify(success=True, id=task.id)

@app.route('/get-tasks')
@login_required
def get_tasks():
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    return jsonify(tasks=[task.to_dict() for task in tasks])

@app.route('/delete-task/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if task is None:
        return jsonify(success=False, message="Task not found"), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify(success=True)

migrate = Migrate(app, db)
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5050)