from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_mail import Mail
from flask_sitemap import Sitemap
from flask_migrate import Migrate
from apscheduler.schedulers.background import BackgroundScheduler
from config import Config
from .models import db
from .routes import main as main_blueprint

db = SQLAlchemy()
login_manager = LoginManager()
mail = Mail()
sitemap = Sitemap()
scheduler = BackgroundScheduler()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)
    sitemap.init_app(app)
    migrate.init_app(app, db)
    
    app.register_blueprint(main_blueprint)

    return app

def reset_pomodoro_time_count():
    with app.app_context():
        users = User.query.all()
        for user in users:
            user.pomodoro_time_count = 0
        db.session.commit()

scheduler.add_job(func=reset_pomodoro_time_count, trigger="cron", day_of_week='sun', hour=23, minute=59, second=59)

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        scheduler.start()
        reset_pomodoro_time_count()
        app.run(debug=False, host='0.0.0.0', port=5050)
