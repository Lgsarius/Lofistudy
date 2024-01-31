from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash, json
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin, login_user, login_required, logout_user, current_user
import os
from oauthlib.oauth2 import TokenExpiredError
import re
from models import User, Note
from extensions import db, login_manager
from flask_dance.contrib.google import make_google_blueprint, google

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = "postgres://wenginlbtrauvi:bf8dbc9bd09e18f75de9ce77018b02ddfd892133cbfe750f5050db0085fd0a94@ec2-34-241-82-91.eu-west-1.compute.amazonaws.com:5432/da93lp495dnq71?sslmode=require".replace("postgres://", "postgresql://", 1)

google_blueprint = make_google_blueprint(
    client_id="97309802024-m1bt3vd3dgfcs8g7k7idngrkmvlvdb8m.apps.googleusercontent.com",
    client_secret="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",
     scope=[
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/calendar.readonly" 
    ],
    redirect_url="/google/authorized"
)
app.register_blueprint(google_blueprint, url_prefix="/login/google")
from flask_dance.consumer import oauth_authorized
from flask_dance.contrib.google import google
with app.app_context():
    db.create_all()
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
        # use the user info here

        # Save the token to use it for future requests
        blueprint.token = token

        # If the token is expired, refresh it
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

        # Validate email
        if not re.match(r"[^@]+@[^@]+\.[^@]+", username):
            flash('Invalid email address.')
            return redirect(url_for('signup'))

        # Check if passwords match
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
    for music_dir in music_dirs:
        dir_path = os.path.join(app.static_folder, music_dir)
        music_files += [url_for('static', filename=music_dir + '/' + f) for f in os.listdir(dir_path) if f.endswith('.mp3')]

    return render_template('index.html', music_files=music_files, video_files=video_files)

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
    note = Note(content=json.dumps(data), user=current_user)
    db.session.add(note)
    db.session.commit()
    return '', 204

@app.route('/load', methods=['GET'])
@login_required
def load():
    note = current_user.notes.order_by(Note.id.desc()).first()
    if note is not None:
        return jsonify(json.loads(note.content))
    else:
        return jsonify({})
    
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5050)