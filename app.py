from flask import Flask, render_template, url_for, request, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    music_dirs = ['lofi', 'chillbeat']
    music_files = []
    video_files = [url_for('static', filename=f) for f in ['bg_wp.mp4', 'bg_wp2.mp4', 'bg_wp3.mp4', 'bg_wp4.mp4', 'bg_wp5.mp4', 'bg_wp6.mp4', 'bg_wp7.mp4', 'bg_wp8.mp4', 'bg_wp9.mp4']]
    for music_dir in music_dirs:
        dir_path = os.path.join(app.static_folder, music_dir)
        music_files += [url_for('static', filename=music_dir + '/' + f) for f in os.listdir(dir_path) if f.endswith('.mp3')]

    return render_template('index.html', music_files=music_files, video_files=video_files)

@app.route('/get_songs')
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
if __name__ == '__main__':
     app.run(debug=True, host='0.0.0.0', port=5050)