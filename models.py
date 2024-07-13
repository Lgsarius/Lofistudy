from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from . import db

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    charactername = db.Column(db.String(150), nullable=True)
    password = db.Column(db.String(150), nullable=False)
    wallpaper = db.Column(db.String(120), nullable=True)
    notecontent = db.Column(db.Text, nullable=True)
    tasks = db.Column(db.Text, nullable=True)
    pomodoro_time_count = db.Column(db.Integer, nullable=True, default=0)
    pomodoro_time_count_alltime = db.Column(db.Integer, nullable=True, default=0)
    fs_uniquifier = db.Column(db.String(150), nullable=False, default=str(uuid4()))
    checked = db.Column(db.Boolean, default=False)

    @staticmethod
    def verify_reset_token(token):
        s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        try:
            data = s.loads(token)
            email = data['email']
        except Exception as e:
            print(f"Failed to decode token: {e}")
            return None
        return User.query.filter_by(username=email).first()

class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text)
    user_username = db.Column(db.String(100), db.ForeignKey('user.username'))
    user = db.relationship('User', backref='notes')

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    completed = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'completed': self.completed}

class Pomodoro(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    duration = db.Column(db.Interval)
    pomodoro_time_count = db.Column(db.Integer, nullable=True, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    completed = db.Column(db.Boolean, default=False)
    date = db.Column(db.Date, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'duration': str(self.duration),
            'pomodoro_time_count': self.pomodoro_time_count,
            'completed': self.completed,
            'date': self.date
        }

class DailyGoal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    goal = db.Column(db.String(200), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    completed = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'goal': self.goal,
            'completed': self.completed,
        }
