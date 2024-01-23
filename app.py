from flask import Flask, render_template, url_for, request, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    music_dirs = ['lofi', 'chillbeat']
    music_files = []

    for music_dir in music_dirs:
        dir_path = os.path.join(app.static_folder, music_dir)
        music_files += [url_for('static', filename=music_dir + '/' + f) for f in os.listdir(dir_path) if f.endswith('.mp3')]

    return render_template('index.html', music_files=music_files)

@app.route('/get_songs')
def get_songs():
    music_dirs = ['lofi', 'chillbeat']
    music_files = []

    for music_dir in music_dirs:
        dir_path = os.path.join(app.static_folder, music_dir)
        music_files += [url_for('static', filename=music_dir + '/' + f) for f in os.listdir(dir_path) if f.endswith('.mp3')]

    return jsonify(music_files=music_files)

if __name__ == '__main__':
     app.run(debug=True, host='0.0.0.0', port=5050)