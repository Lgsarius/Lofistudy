from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash, json, send_from_directory, make_response
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin, login_user, login_required, logout_user, current_user
import os
from authlib.integrations.flask_client import OAuth
import re
from itsdangerous import URLSafeTimedSerializer as Serializer
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from flask import current_app
from extensions import db
from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import cast, Integer
from datetime import datetime, timedelta, date
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
from uuid import uuid4
from flask_sitemap import Sitemap
from flask import send_from_directory, make_response
from flask_sitemap import Sitemap
from sqlalchemy import func

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
    pomodoro_time_count_alltime = db.Column(db.Integer, nullable=True, default=0)
    fs_uniquifier = db.Column(db.Text, nullable=False)
    checked = db.Column(db.Boolean, default=False)
    
    @staticmethod
    def verify_reset_token(token):
        s = Serializer(current_app.config['SECRET_KEY'])
        try:
            data = s.loads(token)
            email = data['email']
        except Exception as e:
            print(f"Failed to decode token: {e}")  # Debug output
            return None
        user = User.query.filter_by(username=email).first()
        if user is None:
            print(f"No user found with email: {email}")  # Debug output
        return user
    
class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text)
    user_username = db.Column(db.String(100), db.ForeignKey('user.username'))
    user = db.Column(db.Text, unique=True)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    completed = db.Column(db.Boolean, default=False)
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'completed': self.completed,
        }
class Checkbox(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    checked = db.Column(db.Boolean, default=False)
class Pomodoro(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    duration = db.Column(db.Interval)  # Duration of the session
    pomodoro_time_count = db.Column(db.Integer, nullable=True, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    completed = db.Column(db.Boolean, default=False)
    date = db.Column(db.Date, nullable=False)  # Date of the session

    def to_dict(self):
        return {
            'id': self.id,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'duration': str(self.duration),  # Convert to string for JSON serialization
            'pomodoro_time_count': self.pomodoro_time_count,
            'completed': self.completed,
            'date': self.date
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
db.init_app(app)
login_manager.login_view = 'login'
login_manager.init_app(app)
sitemap = Sitemap(app=app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@sitemap.register_generator
def generate_urls():
    today = date.today().isoformat()  # Get today's date in 'YYYY-MM-DD' format

    yield 'index', {}, {'lastmod': today, 'priority': 1.0}  # Home page
    yield 'login', {}, {'lastmod': today, 'priority': 0.8}  # Login page
    yield 'FAQ', {}, {'lastmod': today, 'priority': 0.7}    # FAQ page
    
  
@app.route('/sitemap.xml', methods=['GET'])
def generate_sitemap():
    return sitemap.generate()



@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username_or_charactername = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter((User.username == username_or_charactername) | (User.charactername == username_or_charactername)).first()
        if not user or not check_password_hash(user.password, password):
           flash('Invalid username/character name or password.')
           return redirect(url_for('login'))
        if user is None:
            flash('User does not exist.')
            return redirect(url_for('login'))
        login_user(user)
        return redirect(url_for('home'))
    return render_template('login.html')

@app.errorhandler(404)
def page_not_found(e):
   
    return render_template('404.html'), 404

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
        if re.match(r"[^@]+@[^@]+\.[^@]+", charactername):
            flash('Invalid Username.')
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
        print("User created successfully"),
        return redirect(url_for('home'))  # Redirect to home page
    return render_template('signup.html')

@app.route('/submit_contact', methods=['POST'])
def submit_contact():
    name = request.form['name']
    email = request.form['email']
    message = request.form['message']

    msg = Message(f'New Contact From: {name} <{email}>',  # Use f-string for formatting
                  sender=app.config['MAIL_DEFAULT_SENDER'],
                  recipients=[app.config['MAIL_USERNAME']])
    msg.body = f'\n\n{message}'
    mail.send(msg)
    
    flash('Your message was successfully sent!', 'success')
    return redirect(url_for('home'))

@app.route('/static/<path:filename>')
@login_required
def static_files(filename):
    response = make_response(send_from_directory('static', filename))
    response.headers['Cache-Control'] = 'max-age=86400'  # Cache for 1 hour
    return response

@app.route('/resetpassword', methods=['GET', 'POST'])
def resetpassword():
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(username=email).first()
        if user:
            s = Serializer(current_app.config['SECRET_KEY'])
            token = s.dumps({'email': email}, salt='email-confirm')
            print(f"Generated token: {token}") 
            print(app.config.get('MAIL_USERNAMES'))
            msg = Message('Password Reset Request for lo-fi.study', sender=os.environ.get("MAIL_USERNAMES"), recipients=[email])
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
    print(f"Token: {token}")  # Debug output
    user = User.verify_reset_token(token)
    print(f"User: {user}")  # Debug output
    if not user:
        return redirect(url_for('token_invalid'))
    if request.method == 'POST':
        new_password = request.form.get('password')
        if not new_password:
            return 'Password is required!', 400
        hashed_password = generate_password_hash(new_password, method='pbkdf2:sha256')
        user.password = hashed_password
        db.session.commit()
        return 'Password has been changed!'
    else:
        return render_template('reset_token.html', token=token)

@app.route('/token_invalid')
def token_invalid():
    return render_template('token_invalid.html')

@app.route('/robots.txt')
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])

@app.template_filter('sort_by_pomodoro_time_count')
def sort_by_pomodoro_time_count(users):
    return sorted(users, key=lambda user: int(user.pomodoro_time_count) if user.pomodoro_time_count is not None else 0, reverse=True)
@app.route('/')
def index():
    return render_template('homepage.html')


@app.route('/media/videos/<path:filename>')
@login_required
def serve_video(filename):
    video_path = os.path.join(app.static_folder, 'media', 'videos', filename)
    
    # Check if the file exists
    if not os.path.isfile(video_path):
        return "Video not found", 404

    # Set cache-control headers for the video files
    response = make_response(send_from_directory(os.path.join(app.static_folder, 'media', 'videos'), filename))
    response.headers['Cache-Control'] = 'max-age=86400'  # Cache for 1 day (86400 seconds)
    
    return response


@app.route('/app')
@login_required
def home():
    if current_user.pomodoro_time_count is None:
        current_user.pomodoro_time_count = 0
    
    db.session.commit()
    music_dirs = []
    music_files = []
    #video_files = [url_for('static', filename=f'media/videos/{f}') for f in ['bg_wp.mp4', 'bg_wp2.mp4', 'bg_wp3.mp4', 'bg_wp4.mp4', 'bg_wp5.mp4', 'bg_wp6.mp4', 'bg_wp7.mp4', 'bg_wp8.mp4', 'bg_wp9.mp4', 'bg_wp10.mp4', 'bg_wp11.mp4', 'bg_wp12.mp4', 'bg_wp13.mp4', 'bg_wp14.mp4']]
    wallpaper =  current_user.wallpaper if current_user.wallpaper else 'bg_wp.mp4'
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    username = User.query.filter_by(username=current_user.username).first()
    leaderboard = User.query.filter(User.charactername.isnot(None), User.pomodoro_time_count != '0').order_by(cast(User.pomodoro_time_count, Integer).desc()).limit(6).all()
    leaderboard_current_user = User.query.filter_by(username=current_user.username).first()
    charactername = current_user.charactername
    for music_dir in music_dirs:
        dir_path = os.path.join(app.static_folder, music_dir)
        music_files += [url_for('static', filename=music_dir + '/' + f) for f in os.listdir(dir_path) if f.endswith('.mp3')]
    user_agent = request.headers.get('User-Agent')
    
    return render_template('index.html', music_files=music_files,  leaderboard=leaderboard, leaderboard_current_user=leaderboard_current_user, wallpaper=wallpaper, notes=current_user.notecontent, username=username, tasks=tasks, charactername=charactername)	


@app.route('/get_songs')
@login_required
def get_songs():
    music_dirs = []
    music_files = []
    for music_dir in music_dirs:
        dir_path = os.path.join(app.static_folder, music_dir)
        music_files += [url_for('static', filename=music_dir + '/' + f) for f in os.listdir(dir_path) if f.endswith('.mp3')]
    return jsonify(music_files=music_files)


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
    leaderboard =  User.query.filter(User.charactername.isnot(None), User.pomodoro_time_count != '0').order_by(cast(User.pomodoro_time_count, Integer).desc()).limit(6).all()
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
    return redirect(url_for('index'))

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
        print(f"Setting wallpaper to {data['wallpaper']}")
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
    task = Task(name=request.json['name'], user_id=current_user.id)
    db.session.add(task)
    db.session.commit()
    print(task.id)
   
    print("test")
    return jsonify(success=True, id=task.id)


@app.route('/edit-task/<int:task_id>', methods=['PUT'])
@login_required
def edit_task(task_id):
    task = Task.query.get(task_id)
    if task and task.user_id == current_user.id:
        task.name = request.json.get('name', task.name)
        task.completed = request.json.get('completed', task.completed)
        db.session.commit()
        return jsonify(success=True)
    else:
        return jsonify(success=False), 404
    

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
    
from datetime import datetime

@app.route('/update_pomodoros', methods=['POST'])
@login_required
def update_pomodoros():
    print("Updating pomodoros for user:", current_user.charactername)
    start_time = datetime.now()  # Record session start time
    if current_user.pomodoro_time_count is None:
        current_user.pomodoro_time_count = 1
    else:
        current_user.pomodoro_time_count = int(current_user.pomodoro_time_count) + 1
    
    if current_user.pomodoro_time_count_alltime is None:
        current_user.pomodoro_time_count_alltime = 1
    else:
        current_user.pomodoro_time_count_alltime = int(current_user.pomodoro_time_count_alltime) + 1
    
    try:
        db.session.commit()
        print("Successfully updated pomodoros")
    except Exception as e:
        print("Error updating pomodoros:", e)
        
    return jsonify({'success': True})




@app.route('/get-checkbox-value')
@login_required
def get_checkbox_value():
    return jsonify({'checked': current_user.checked})

@app.route('/update-checkbox-value', methods=['POST'])
@login_required
def update_checkbox_value():
    print("Updating checkbox value for user:", current_user.charactername)
    checkbox_value = request.json.get('checked', False)
    current_user.checked = checkbox_value == True
    db.session.commit()
    return jsonify({'success': True})


@app.route('/test')
@login_required
def test():
    user_id = current_user.id 
    
    return render_template('test.html')


def reset_pomodoro_time_count():
    users = User.query.all()
    for user in users:
        user.pomodoro_time_count = 0
    db.session.commit()
    
scheduler = BackgroundScheduler()
scheduler.add_job(func=reset_pomodoro_time_count, trigger="cron", day_of_week='sun', hour=23, minute=59, second=59)

migrate = Migrate(app, db)
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        scheduler.start()
        reset_pomodoro_time_count()
    

    app.run(debug=True, host='0.0.0.0', port=5050)