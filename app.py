from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash, json, send_from_directory, make_response
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin, login_user, login_required, logout_user, current_user
import os
from oauthlib.oauth2 import TokenExpiredError
import re
from flask_dance.contrib.google import make_google_blueprint, google
from extensions import db
from flask_login import UserMixin
from urllib.parse import urljoin
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import cast, Integer
from datetime import datetime, timedelta
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
from uuid import uuid4
from flask_dance.consumer import oauth_authorized
from flask_dance.contrib.google import google

s = URLSafeTimedSerializer('your-secret-key')
db = SQLAlchemy()
login_manager = LoginManager()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.Text, unique=True)
    charactername = db.Column(db.Text, nullable=True)
    password = db.Column(db.Text)
    wallpaper = db.Column(db.String(120), nullable=True)
    notecontent = db.Column(db.Text, nullable=True)
    tasks = db.Column(db.Text, nullable=True)
    pomodoro_time_count = db.Column(db.Integer, nullable=True, default=0)
    
    fs_uniquifier = db.Column(db.Text, nullable=False)
    checked = db.Column(db.Boolean, default=False)
    
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
uri = os.getenv("DATABASE_URL")  # or other relevant config var
if uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['MAIL_SERVER']='smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = os.environ.get("MAIL_USERNAMES")
app.config['MAIL_PASSWORD'] = os.environ.get("MAIL_PASSWORDS")
app.config['MAIL_DEFAULT_SENDER'] = 'support@mousewerk.de'
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
mail = Mail(app)

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

@app.route('/sitemap.xml', methods=['GET'])
def sitemap():
    """Generate sitemap.xml. Makes a list of urls and date modified."""
    pages=[]
    ten_days_ago=(datetime.now() - timedelta(days=7)).date().isoformat()
    # static pages
    static_pages = url_for('static', filename='robots.txt'), url_for('static', filename='sitemap.xml')
    for page in static_pages:
        pages.append(
            [urljoin(request.url, page),ten_days_ago]
        )
    sitemap_xml = render_template('sitemap_template.xml', pages=pages)
    response= make_response(sitemap_xml)
    response.headers["Content-Type"] = "application/xml"    
    return response

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
        charactername = request.form.get('charactername')
        username = request.form.get('email')
        password = request.form.get('password')
        repeat_password = request.form.get('repeat_password')
        fs_uniquifier=str(uuid4()),
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
        new_user = User(username=username, fs_uniquifier=fs_uniquifier, password=generate_password_hash(password, method='pbkdf2:sha256'), charactername=charactername)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('home'))  # Redirect to home page
    return render_template('signup.html')

@app.route('/resetpassword', methods=['GET', 'POST'])
def resetpassword():
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(username=email).first()
        print(app.config.get('MAIL_USERNAMES'))
        if user:
            token = s.dumps(email, salt='email-confirm')
            print(app.config.get('MAIL_USERNAMES'))
            msg = Message('Password Reset Request for Lofistudy.social', sender=os.environ.get("MAIL_USERNAMES"), recipients=[email])
            link = url_for('reset_token', token=token, _external=True)
            msg.html = r"""
                    <html>
                        <body>
                            <div style="font-family: Arial, sans-serif; margin: 0 auto; padding: 20px; max-width: 600px;">
                                <img src="https://i.ibb.co/xCM5qjc/Lofistudy-02.png" style="width: 30%;
                        height: auto; alt="Logo">
                                <p>Um Ihr Passwort zurückzusetzen, klicken Sie auf den folgenden Button:</p>
                                <a href="{}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; font-size: 16px; color: #fff; background-color: #007BFF; border: none; border-radius: 4px; text-decoration: none;">Passwort zurücksetzen</a>
                                <p>Wenn Sie diese Anfrage nicht gestellt haben, kontaktieren Sie bitte unser Team.</p>
                            </div>
                        </body>
                    </html>
                """.format(link)
        mail.send(msg)
        return 'Email has been sent!'
    return render_template('resetpassword.html')

@app.route('/reset/<token>', methods=['GET', 'POST'])
def reset_token(token):
    user = User.verify_reset_token(token)
    if not user:
        # Wenn der Token ungültig ist, leiten Sie den Benutzer zu einer Fehlerseite weiter
        return redirect(url_for('token_invalid'))

    if request.method == 'POST':
        new_password = request.form['password']
        hashed_password = generate_password_hash(new_password, method='pbkdf2:sha256')
        user.password = hashed_password
        db.session.commit()
        return 'Password has been changed!'
    else:
        return render_template('reset_token.html', token=token)

@app.route('/robots.txt')
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])

@app.template_filter('sort_by_pomodoro_time_count')
def sort_by_pomodoro_time_count(users):
    return sorted(users, key=lambda user: int(user.pomodoro_time_count) if user.pomodoro_time_count is not None else 0, reverse=True)

@app.route('/')
@login_required
def home():
    if current_user.pomodoro_time_count is None:
        current_user.pomodoro_time_count = 0
    music_dirs = []
    music_files = []
    video_files = [url_for('static', filename=f) for f in ['bg_wp.mp4', 'bg_wp2.mp4', 'bg_wp3.mp4', 'bg_wp4.mp4', 'bg_wp5.mp4', 'bg_wp6.mp4', 'bg_wp7.mp4', 'bg_wp8.mp4']]
    wallpaper = current_user.wallpaper if current_user.wallpaper else 'bg_wp.mp4'
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    username = User.query.filter_by(username=current_user.username).first()
    leaderboard = User.query.filter(User.charactername.isnot(None)).order_by(cast(User.pomodoro_time_count, Integer).desc()).limit(10).all()
    leaderboard_current_user = User.query.filter_by(username=current_user.username).first()
    charactername = current_user.charactername
    for music_dir in music_dirs:
        dir_path = os.path.join(app.static_folder, music_dir)
        music_files += [url_for('static', filename=music_dir + '/' + f) for f in os.listdir(dir_path) if f.endswith('.mp3')]
    return render_template('index.html', music_files=music_files, video_files=video_files, leaderboard=leaderboard, leaderboard_current_user=leaderboard_current_user, wallpaper=wallpaper, notes=current_user.notecontent, username=username, tasks=tasks, charactername=charactername)	

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
    users = User.query.all()
    for passwords in users:
        print(passwords)
    return render_template('privacy_policy.html')

@app.route('/api/leaderboard')
def leaderboard_api():
    leaderboard = User.query.filter(User.charactername.isnot(None)).order_by(cast(User.pomodoro_time_count, Integer).desc()).limit(10).all()
    leaderboard_data = []
    for user in leaderboard:
        leaderboard_data.append({
            'charactername': user.charactername,
            'pomodoro_time_count': user.pomodoro_time_count
        })
    return jsonify(leaderboard_data)

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
    new_password = request.form.get('new-password')
    confirm_password = request.form.get('confirm-password')

    print(f"Neues Passwort: {new_password}")
    print(f"Bestätigtes Passwort: {confirm_password}")

    # Überprüfen, ob die neuen Passwörter übereinstimmen
    if new_password != confirm_password:
        flash('Die neuen Passwörter stimmen nicht überein.')
        return jsonify({'message': 'Die neuen Passwörter stimmen nicht überein.'}), 400

    hashed_password = generate_password_hash(new_password, method='pbkdf2:sha256')
    print(f"Gehashtes Passwort: {hashed_password}")

    current_user.password = hashed_password
    db.session.commit()

    print("Passwort erfolgreich geändert.")
    return jsonify({'message': 'new password set'}), 200

@app.route('/delete_account', methods=['POST'])
@login_required
def delete_account():
    db.session.delete(current_user)
    db.session.commit()
    logout_user()
    return redirect(url_for('login'))

@app.route('/add-task', methods=['POST'])
@login_required
def add_task():
    task = Task(name=request.json['name'], totalPomodoros=request.json['totalPomodoros'], user_id=current_user.id)
    db.session.add(task)
    db.session.commit()
    print(task.id)
   
    print("test")
    return jsonify(success=True, id=task.id)

@app.route('/edit-task/<int:task_id>', methods=['PUT'])
@login_required
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
@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/FAQ')
def FAQ():
    return render_template('faq.html')

from flask import request, jsonify

@app.route('/update_charactername', methods=['POST'])
@login_required
def update_charactername():
    data = request.get_json()
    new_charactername = data.get('charactername')
    if new_charactername:
        current_user.charactername = new_charactername
        db.session.commit()
        return jsonify({'success': True}), 200
    else:
        return jsonify({'success': False}), 400
    
@app.route('/update_pomodoros', methods=['POST'])
@login_required
def update_pomodoros():
    print("Updating pomodoros for user:", current_user.charactername)
    if current_user.pomodoro_time_count is None:
        current_user.pomodoro_time_count = 1
    else:
        current_user.pomodoro_time_count = int(current_user.pomodoro_time_count) + 1
    try:
        db.session.commit()
        print("Successfully updated pomodoros")
    except Exception as e:
        print("Error updating pomodoros:", e)
    return jsonify({'success': True})

class Checkbox(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    checked = db.Column(db.Boolean, default=False)

@app.route('/get-checkbox-value')
@login_required
def get_checkbox_value():
    return jsonify({'checked': current_user.checked})

@app.route('/update-checkbox-value', methods=['POST'])
@login_required
def update_checkbox_value():
    current_user.checked = request.json.get('checked', False)
    db.session.commit()
    return jsonify({'success': True})

migrate = Migrate(app, db)
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    

    app.run(debug=True, host='0.0.0.0', port=5050)