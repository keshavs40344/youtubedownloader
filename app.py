import os
import re
import uuid
import threading
import tempfile
from flask import Flask, render_template, request, jsonify, send_file
import yt_dlp

app = Flask(__name__)

# Temporary download tasks storage for progress tracking
DOWNLOAD_TASKS = {}

def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', "", name)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_video():
    """Video ke sabhi available formats, thumbnail, aur info extract karta hai."""
    data = request.get_json()
    url = data.get('url', '').strip()

    if not url:
        return jsonify({'success': False, 'error': 'URL provide karein'}), 400

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            formats = info.get('formats', [])
            video_options = {}
            audio_options = []

            # Filter best resolutions
            for f in formats:
                height = f.get('height')
                ext = f.get('ext')
                vcodec = f.get('vcodec', 'none')
                acodec = f.get('acodec', 'none')

                # Video resolutions (MP4 preferred)
                if height and height in [360, 480, 720, 1080, 1440, 2160]:
                    res_label = f"{height}p"
                    if res_label not in video_options:
                        filesize = f.get('filesize') or f.get('filesize_approx')
                        size_mb = f"{round(filesize / (1024*1024), 1)} MB" if filesize else "Adaptive"
                        video_options[res_label] = {
                            'format_id': f['format_id'],
                            'resolution': res_label,
                            'height': height,
                            'size': size_mb,
                            'ext': 'mp4'
                        }

                # Audio Only
                if vcodec == 'none' and acodec != 'none':
                    abr = f.get('abr', 128)
                    audio_options.append({
                        'format_id': f['format_id'],
                        'quality': f"{int(abr)} kbps",
                        'ext': ext
                    })

            # Sort videos by resolution descending
            sorted_videos = sorted(video_options.values(), key=lambda x: x['height'], reverse=True)

            return jsonify({
                'success': True,
                'title': info.get('title'),
                'uploader': info.get('uploader'),
                'duration': info.get('duration_string'),
                'views': f"{info.get('view_count', 0):,}",
                'thumbnail': info.get('thumbnail'),
                'video_formats': sorted_videos,
                'has_audio': len(audio_options) > 0
            })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def progress_hook(d, task_id):
    if d['status'] == 'downloading':
        p = d.get('_percent_str', '0.0%').strip()
        speed = d.get('_speed_str', 'N/A').strip()
        DOWNLOAD_TASKS[task_id]['progress'] = p
        DOWNLOAD_TASKS[task_id]['speed'] = speed
        DOWNLOAD_TASKS[task_id]['status'] = 'downloading'
    elif d['status'] == 'finished':
        DOWNLOAD_TASKS[task_id]['progress'] = '100%'
        DOWNLOAD_TASKS[task_id]['status'] = 'processing'

def process_download_thread(task_id, url, format_type, height):
    temp_dir = tempfile.mkdtemp()
    out_template = os.path.join(temp_dir, '%(title)s.%(ext)s')

    if format_type == 'mp3':
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': out_template,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'progress_hooks': [lambda d: progress_hook(d, task_id)],
            'quiet': True
        }
    else:
        # Download specific resolution and merge best audio (FFmpeg mux)
        ydl_opts = {
            'format': f'bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/best[height<={height}]/best',
            'outtmpl': out_template,
            'merge_output_format': 'mp4',
            'progress_hooks': [lambda d: progress_hook(d, task_id)],
            'quiet': True
        }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            if format_type == 'mp3':
                filename = os.path.splitext(filename)[0] + '.mp3'
            
            DOWNLOAD_TASKS[task_id]['filepath'] = filename
            DOWNLOAD_TASKS[task_id]['status'] = 'completed'
    except Exception as e:
        DOWNLOAD_TASKS[task_id]['status'] = 'failed'
        DOWNLOAD_TASKS[task_id]['error'] = str(e)

@app.route('/api/start-download', methods=['POST'])
def start_download():
    data = request.get_json()
    url = data.get('url')
    format_type = data.get('format', 'mp4')
    height = data.get('height', '1080')

    task_id = str(uuid.uuid4())
    DOWNLOAD_TASKS[task_id] = {
        'status': 'starting',
        'progress': '0%',
        'speed': '0 MB/s',
        'filepath': None,
        'error': None
    }

    t = threading.Thread(target=process_download_thread, args=(task_id, url, format_type, height))
    t.start()

    return jsonify({'task_id': task_id})

@app.route('/api/task-status/<task_id>')
def task_status(task_id):
    task = DOWNLOAD_TASKS.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    return jsonify(task)

@app.route('/api/fetch-file/<task_id>')
def fetch_file(task_id):
    task = DOWNLOAD_TASKS.get(task_id)
    if not task or task.get('status') != 'completed':
        return "File not ready", 400
    
    return send_file(task['filepath'], as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000)