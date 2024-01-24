from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password, password):
            return redirect(url_for('login'))

        login_user(user)

        return redirect(url_for('home'))

    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter_by(username=username).first()

        if user:
            return redirect(url_for('signup'))

        new_user = User(username=username, password=generate_password_hash(password, method='sha256'))

        db.session.add(new_user)
        db.session.commit()

        return redirect(url_for('login'))

    return render_template('signup.html')

@app.route('/')
@login_required
def home():
    music_dirs = ['lofi', 'chillbeat']
    music_files = []
    video_files = [url_for('static', filename=f) for f in ['bg_wp.mp4', 'bg_wp2.mp4', 'bg_wp3.mp4', 'bg_wp4.mp4', 'bg_wp5.mp4']]
    for music_dir in music_dirs:
        dir_path = os.path.join(app.static_folder, music_dir)
        music_files += [url_for('static', filename=music_dir + '/' + f) for f in os.listdir(dir_path) if f.endswith('.mp3')]

    return render_template('index.html', music_files=music_files, video_files=video_files)

@app.route('/get_songs')
@login_required
def get_songs():
    music_dirs = ['lofi', 'chillbeat']
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
    return render_template('privacy_policy.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

if __name__ == '__main__':
     app.run(debug=True, host='0.0.0.0', port=5050)