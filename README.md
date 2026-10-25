# ✨ Gemini Canvas Lyric Video Generator

An in-browser, high-performance HTML5 Canvas application that turns uploaded music tracks into animated kinetic typography lyric videos using **Google Gemini Multimodal Audio AI**.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Format](https://img.shields.io/badge/Format-16%3A9%20%7C%209%3A16%20%7C%201%3A1-purple.svg)](#)
[![Zero Backend](https://img.shields.io/badge/Architecture-100%25%20Client--Side-green.svg)](#)

---

## 🚀 Key Features

- **🤖 Gemini Multimodal Audio Sync:**
  Upload any MP3/WAV song and let **Gemini 2.5 Flash / 1.5 Flash** transcribe and align each lyric line with exact millisecond timestamps automatically.
- **🎨 60 FPS HTML5 Canvas Animation Engine:**
  Smooth kinetic typography, glowing active states, multi-line auto-wrapping, and previous/next line context fading.
- **🔊 Audio-Reactive Beat Dynamics:**
  Built-in Web Audio API `AnalyserNode` drives real-time bass/kick pulse and audio-reactive glow that bounces with the music.
- **📐 Multi-Aspect Ratio Support:**
  - `16:9` Landscape (YouTube Full HD)
  - `9:16` Portrait (YouTube Shorts, TikTok, Instagram Reels)
  - `1:1` Square (Feeds & Album Art visualizers)
- **✨ Curated Aesthetic Presets:**
  - **Lofi Chill:** Floating bokeh particles, soft pastel accents, relaxed pacing.
  - **Cyberpunk:** Neon magenta/cyan glow, frequency bars, tech typography.
  - **Minimal Dark:** Classy serif font, dark aesthetic gradient, editorial layout.
  - **Karaoke Glow:** Active lyric line pop and high contrast.
- **🎬 In-Browser Video Export:**
  Combines the Canvas render stream and Web Audio destination into a synchronized video export (`.webm` / `.mp4`) directly inside your browser—no backend server, FFmpeg installation, or cloud rendering required.
- **🔒 Privacy First:**
  Your Gemini API key is stored strictly in your browser's `localStorage` and sent only to Google's official Gemini endpoint.

---

## 🛠️ Architecture & Pipeline

```
[ Upload MP3 / WAV ]
         │
         ▼
[ Gemini 2.5/1.5 Audio API ] ──► Auto-Sync Timestamps [ {start, end, text}, ... ]
         │
         ▼
[ Web Audio API Analyser ] ──► Real-time FFT / RMS / Bass extraction
         │
         ▼
[ HTML5 Canvas 60FPS Engine ] ──► Kinetic Typography + Particle / Waveform Visuals
         │
         ▼
[ MediaRecorder API ] ──► Synchronized Video File Export (.webm / .mp4)
```

---

## 💻 Quick Start / Local Setup

This project is a modern client-side application with zero build step required.

### 1. Clone the repository:
```bash
git clone https://github.com/adityafirmansyah/gemini-canvas-lyric-video.git
cd gemini-canvas-lyric-video
```

### 2. Serve with any local HTTP server:
Because it uses ES Modules, open it via a local web server:

**Using Python:**
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Using Node / npx:**
```bash
npx serve .
```

---

## 🌐 Deploy to GitHub Pages (1-Click)

1. Go to your GitHub repository **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select `Deploy from a branch`.
3. Choose the `main` branch and `/ (root)` folder, then click **Save**.
4. Your lyric video generator will be live at `https://adityafirmansyah.github.io/gemini-canvas-lyric-video/`.

---

## 📖 How to Use

1. **Step 1: Upload Music**
   - Drag and drop your audio track (MP3 or WAV) into the drop zone.
2. **Step 2: Sync with Gemini**
   - Enter your [Google AI Studio Gemini API Key](https://aistudio.google.com/app/apikey).
   - (Optional) Paste known lyrics into the reference box if you want Gemini to strictly align existing text.
   - Click **Analyze & Sync with Gemini**.
   - Gemini will return structured JSON timestamps that populate into the editor.
3. **Step 3: Customize Style**
   - Pick an aspect ratio (`16:9` for YouTube or `9:16` for Shorts).
   - Select a visual preset (Lofi, Cyberpunk, Minimal) or tweak fonts and colors.
   - Upload a custom background image or toggle the audio-reactive beat pulse.
4. **Step 4: Record & Export**
   - Switch to the **Export** tab and click **Record & Export Video**.
   - The app will play the track, animate the canvas in sync, and automatically download your video file when complete!

---

## 📄 License

MIT License. Free to use, modify, and distribute for personal or commercial projects.
