import os
import re
import urllib.parse
import subprocess
from flask import Flask, render_template, request, jsonify, Response, send_file
import yt_dlp
import requests

app = Flask(__name__, template_folder='templates')

def sanitize_filename(name):
    clean = re.sub(r'[/\\?%*:|"<>#]', '', name)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean[:100] if clean else "media"

def normalize_youtube_url(raw_url):
    raw_url = raw_url.strip()
    if not raw_url.startswith(('http://', 'https://')):
        raw_url = f"https://{raw_url}"
    try:
        parsed = urllib.parse.urlparse(raw_url)
        if parsed.path.startswith('/shorts/'):
            video_id = parsed.path.replace('/shorts/', '').split('/')[0].split('?')[0]
            return f"https://www.youtube.com/watch?v={video_id}"
        if 'youtu.be' in parsed.netloc:
            video_id = parsed.path.replace('/', '').split('?')[0]
            return f"https://www.youtube.com/watch?v={video_id}"
        return raw_url
    except Exception:
        return raw_url

def format_bytes(b, fallback_bitrate=None, duration=None):
    size = b
    if (not size or size <= 0) and fallback_bitrate and duration and duration > 0:
        size = (fallback_bitrate * 1000 / 8) * duration
    if not size or size <= 0:
        return "Direct Stream"
    mb = size / (1024 * 1024)
    if mb < 1:
        return f"{int(size / 1024)} KB"
    elif mb > 1024:
        return f"{round(mb / 1024, 2)} GB"
    return f"{round(mb, 1)} MB"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.get_json() or {}
    url = data.get('url', '').strip()

    if not url:
        return jsonify({'success': False, 'error': 'Please provide a valid YouTube URL.'}), 400

    normalized_url = normalize_youtube_url(url)

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'no_check_certificates': True,
        'extractor_args': {'youtube': {'player_client': ['web_embedded', 'mweb']}}
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(normalized_url, download=False)
            
            duration_sec = info.get('duration', 0)
            formats = info.get('formats', [])
            
            video_formats = []
            audio_formats = []
            seen_video_keys = set()
            seen_audio_keys = set()

            for f in formats:
                vcodec = f.get('vcodec', 'none')
                acodec = f.get('acodec', 'none')
                height = f.get('height')
                ext = f.get('ext', 'mp4')
                format_id = f.get('format_id')
                tbr = f.get('tbr') or f.get('vbr') or f.get('abr')
                size_str = format_bytes(f.get('filesize') or f.get('filesize_approx'), tbr, duration_sec)

                # Progressive video
                if vcodec != 'none' and acodec != 'none' and height:
                    key = f"prog_{height}"
                    if key not in seen_video_keys:
                        seen_video_keys.add(key)
                        video_formats.append({
                            'format_id': format_id,
                            'quality': f"{height}p",
                            'height': height,
                            'container': 'mp4',
                            'hasAudio': True,
                            'isProgressive': True,
                            'size': size_str,
                            'badge': 'HD Video + Audio' if height >= 720 else 'Standard Video + Audio',
                            'description': 'Video with Sound'
                        })

                # High-res video streams
                if vcodec != 'none' and acodec == 'none' and height and height >= 720:
                    key = f"stream_{height}_{ext}"
                    if key not in seen_video_keys:
                        seen_video_keys.add(key)
                        video_formats.append({
                            'format_id': format_id,
                            'quality': f"{height}p",
                            'height': height,
                            'container': ext,
                            'hasAudio': False,
                            'isProgressive': False,
                            'size': size_str,
                            'badge': '4K Ultra HD' if height >= 2160 else f'{height}p Full HD',
                            'description': 'High Resolution Stream'
                        })

                # Audio only
                if vcodec == 'none' and acodec != 'none':
                    abr = int(f.get('abr') or f.get('audio_bitrate') or 128)
                    key = f"audio_{ext}_{abr}"
                    if key not in seen_audio_keys:
                        seen_audio_keys.add(key)
                        audio_formats.append({
                            'format_id': format_id,
                            'quality': f"{abr} kbps",
                            'container': 'm4a' if ext == 'm4a' else 'mp3',
                            'codec': acodec,
                            'abr': abr,
                            'size': size_str,
                            'badge': 'Universal M4A' if ext == 'm4a' else 'High-Fidelity Audio',
                            'description': 'AAC Audio (Plays on all devices)'
                        })

            video_formats.sort(key=lambda x: x.get('height', 0), reverse=True)
            audio_formats.sort(key=lambda x: x.get('abr', 0), reverse=True)

            if not video_formats:
                video_formats.append({
                    'format_id': 'best',
                    'quality': '720p HD',
                    'height': 720,
                    'container': 'mp4',
                    'hasAudio': True,
                    'isProgressive': True,
                    'size': 'Adaptive',
                    'badge': 'Auto Format',
                    'description': 'Adaptive High Quality Stream'
                })

            if not audio_formats:
                audio_formats.append({
                    'format_id': 'bestaudio',
                    'quality': '128 kbps',
                    'container': 'm4a',
                    'codec': 'aac',
                    'abr': 128,
                    'size': 'Adaptive',
                    'badge': 'Default Audio',
                    'description': 'Direct Audio Stream'
                })

            # Subtitles
            sub_langs = []
            all_subs = {**(info.get('subtitles') or {}), **(info.get('automatic_captions') or {})}
            for code in list(all_subs.keys())[:12]:
                is_auto = bool(info.get('automatic_captions', {}).get(code) and not info.get('subtitles', {}).get(code))
                sub_langs.append({
                    'code': code,
                    'name': f"{code.upper()} (Auto)" if is_auto else code.upper()
                })

            # Thumbnails
            thumb_list = []
            if info.get('thumbnails'):
                for t in info['thumbnails'][-3:]:
                    if t.get('url'):
                        thumb_list.append({
                            'resolution': t.get('resolution') or 'HD',
                            'url': t['url']
                        })
            if not thumb_list and info.get('thumbnail'):
                thumb_list.append({'resolution': '1920x1080 (HD)', 'url': info['thumbnail']})

            return jsonify({
                'success': True,
                'isPlaylist': False,
                'videoInfo': {
                    'id': info.get('id'),
                    'title': info.get('title') or 'YouTube Video',
                    'author': info.get('uploader') or info.get('channel') or 'Creator',
                    'subscribers': f"{round(info['channel_follower_count']/1000000, 1)}M Subscribers" if info.get('channel_follower_count') else None,
                    'likes': f"{info.get('like_count', 0):,} Likes" if info.get('like_count') else None,
                    'duration': info.get('duration_string') or '--:--',
                    'views': f"{info.get('view_count', 0):,}",
                    'thumbnail': thumb_list[-1]['url'] if thumb_list else info.get('thumbnail'),
                    'thumbnailList': thumb_list,
                    'subtitles': sub_langs,
                    'videoFormats': video_formats,
                    'audioFormats': audio_formats
                }
            })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stream')
def stream_media():
    url = request.args.get('url')
    format_id = request.args.get('format_id', '18')
    ext = request.args.get('ext', 'mp4').lower()
    raw_title = request.args.get('title', 'video')

    if not url:
        return "URL is required", 400

    filename = f"{sanitize_filename(raw_title)}.{ext}"

    cmd = [
        "python", "-m", "yt_dlp",
        "--js-runtimes", "node",
        "--remote-components", "ejs:github",
        "--extractor-args", "youtube:player_client=web_embedded,mweb",
        "--no-check-certificates",
        "--concurrent-fragments", "4",
        "--buffer-size", "16M",
        "-f", format_id,
        "--no-warnings",
        "--no-progress",
        "-o", "-",
        url
    ]

    def generate_chunks():
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        while True:
            chunk = proc.stdout.read(64 * 1024)
            if not chunk:
                break
            yield chunk
        proc.stdout.close()
        proc.wait()

    mime_types = {
        'mp4': 'video/mp4',
        'm4a': 'audio/mp4',
        'webm': 'video/webm',
        'mp3': 'audio/mpeg'
    }

    quoted_filename = urllib.parse.quote(filename)
    headers = {
        'Content-Disposition': f'attachment; filename="{quoted_filename}"; filename*=UTF-8\'\'{quoted_filename}',
        'Content-Type': mime_types.get(ext, 'application/octet-stream')
    }

    return Response(generate_chunks(), headers=headers)

@app.route('/api/subtitle')
def stream_subtitles():
    url = request.args.get('url')
    lang = request.args.get('lang', 'en')
    fmt = request.args.get('format', 'vtt')
    raw_title = request.args.get('title', 'subtitles')

    if not url:
        return "URL is required", 400

    filename = f"{sanitize_filename(raw_title)}_{lang}.{fmt}"

    try:
        ydl_opts = {'quiet': True, 'skip_download': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            subs = (info.get('subtitles') or {}).get(lang) or (info.get('automatic_captions') or {}).get(lang)
            if not subs:
                return "Subtitles not found", 404

            matched = next((s for s in subs if s.get('ext') == fmt), subs[0])
            res = requests.get(matched['url'])
            
            quoted = urllib.parse.quote(filename)
            headers = {
                'Content-Disposition': f'attachment; filename="{quoted}"; filename*=UTF-8\'\'{quoted}',
                'Content-Type': 'text/vtt; charset=utf-8' if fmt == 'vtt' else 'application/x-subrip; charset=utf-8'
            }
            return Response(res.text, headers=headers)
    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)