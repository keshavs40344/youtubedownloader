# Vortex Stream — Clean YouTube Media Downloader

A modern, fast, and privacy-focused YouTube media extraction web application built with **Next.js 15**, **React 19**, **Tailwind CSS**, **Framer Motion**, and **yt-dlp**.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-13-purple?style=flat-square)

---

## ✨ Features

- **Direct Stream Downloads**: 1-click video (MP4) and audio (M4A / WebM) streaming directly to browser download manager.
- **Subtitles & Closed Captions**: Download `.srt` or `.vtt` caption tracks in any available language.
- **Full HD Thumbnail Art**: Download original full-resolution video covers with 1 click.
- **Creator Tags & Info**: View video tags, descriptions, likes count, and channel stats.
- **Playlist Batch Downloader**: Multi-select playlist tracks with checkboxes and queue batch downloads.
- **In-App Player Preview**: Embedded video preview player with full-width Theater Mode.
- **Mobile QR Code Generator**: Scan any video directly with your phone camera to download onto mobile.
- **Theme Customizer**: 5 curated warm color styles with ambient lighting.
- **Tactile Audio Feedback**: Synthesized Web Audio API micro-sounds.
- **Recent Downloads Drawer**: Persisted extraction history in `localStorage`.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ (or 20+)
- Python 3.8+ with `yt-dlp` installed:
  ```bash
  pip install -U yt-dlp
  ```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment to Vercel

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Vortex Stream Downloader"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Click **Deploy**.

---

## 📄 License
MIT License • Open Source Media Engine
