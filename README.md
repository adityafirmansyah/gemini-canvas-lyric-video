# ✨ Aura Canvas Studio — Fluid Kinetic AI Lyric Video

A modern, high-standard in-browser video production suite built with **Three.js WebGL** and **HTML5 Canvas** for generating fluid, viral kinetic typography lyric videos directly in your browser.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Format](https://img.shields.io/badge/Format-16%3A9%20%7C%209%3A16%20%7C%201%3A1-purple.svg)](#)
[![Zero Backend](https://img.shields.io/badge/Architecture-100%25%20Client--Side-green.svg)](#)
[![Sync](https://img.shields.io/badge/Sync-Three.js%20%7C%20Fluid%20Kinetic%20Lyrics-cyan.svg)](#)

---

## 💎 The Four Core Pillars

### 1. 🌌 Three.js 3D Procedural Audio-Reactive Background
No static backgrounds or boring repetitive video loops. The environment is procedurally generated in real-time WebGL:
- **Visual 3D Modes:**
  - *Cosmic Particle Waves:* Thousands of glowing 3D particles undulating in a continuous liquid plane.
  - *Ethereal Silk Flow:* Silk-like luminous mesh lines with additive light blending.
  - *Cyber Matrix Grid:* 3D rolling perspective wireframe grid.
  - *Celestial Starfield:* Deep cosmic hyperspace warp.
- **Audio-Reactive Physics:** Sub-bass kicks and rhythm frequencies physically ripple and elevate the 3D surface in real time.
- **Customizable:** Wave Speed (0.2x–3.0x), Wave Height/Amplitude (10px–100px), Particle Colors, and Deep Space Base Colors.

### 2. ✍️ Typographic Poster Engine (Progressive Word-by-Word Build)
Inspired by bold graphic poster typography and word-cloud branding (interlocking horizontal & vertical layouts):
- **★ Progressive Word-by-Word Reveal (Default):**
  - Kata-kata **TIDAK langsung muncul sekaligus satu kalimat penuh**, melainkan **muncul satu per satu mengikuti timestamp vokal penyanyi** (misal: detik pertama hanya muncul *"Membasu"*, detik berikutnya masuk *"peri"*, lalu *"di"*, lalu *"hatimu"*).
  - Kata-kata yang sudah dinyanyikan **tetap berada di layar** mengunci dalam posisinya hingga di akhir kalimat terbentuk poster utuh sebelum berganti ke kalimat berikutnya.
- **👑 Giant Dominant Center Hero Word:**
  - Kata utama di tengah (*Hero Word*) berukuran masif dan mendominasi panggung dalam warna **Solar Golden Yellow (`#F5B010`)**.
- **📐 Proportional Side Words (Strict Height Clamping):**
  - Kata-kata vertikal di samping kiri dan kanan (seperti *"TURUN"* & *"DERAS"*) secara otomatis diskalakan lebih kecil dan **dibatasi agar tingginya tidak pernah melebihi tinggi kata tengah**, membingkai kata tengah dengan elegan dan rapi.
- **✨ Clean & Uncluttered Styling (No Active Highlight Overrides):**
  - Kata pendukung di atas, bawah, kiri, dan kanan **tetap bersih dalam warna Solid Black (pada tema terang) atau Solid White (pada tema gelap)** tanpa highlight warna kuning yang mengganggu saat aktif dinyanyikan.
- **1-Click Theme Switch:** Toggle antara **Poster Gallery Light** (kanvas putih bersih seperti gambar referensi) dan **Obsidian Stage Dark** (hitam pekat bercahaya).

### 3. 🎯 Strict &le; 5 Words Pacing (Viral Reading Cadence)
- Wall-of-text lyrics kill viewer retention.
- All imported lyrics (AI alignment or LRC/SRT files) are **automatically chunked into short, punchy phrases of &le; 5 words** (configurable from 1 to 5 words).
- Pacing duration is weighted proportionally by character and word count for natural, effortless reading.

### 4. 🎛️ 100% Fully Customizable Through Clean Settings
- **Typography:** Outfit, Bebas Neue, Instrument Serif, Space Grotesk, Inter, Montserrat.
- **Font Size & Auto-Fit:** Scales seamlessly to prevent line clipping on 16:9, 9:16 Shorts, and 1:1 Square.
- **Colors & Glow:** Base text color, active glow accent color, glow radius (0–60px), multi-pass glow density (0%–200%).
- **Container / Badge Styling:**
  - *Clean Glowing Typography* (Minimalist direct glow)
  - *Liquid Pill Badges* (Rounded capsule badges)
  - *Modern Contrast Box* (Sharp agency badges)
  - *Ambient Glass Scrim* (Subtle frosted cards)
- **Depth Layering (Text Behind Subject):** Drag & drop a transparent PNG cutout to place the singer, vehicle, or subject in front of the animated 3D lyrics.
- **9:16 Shorts Safe Area Guides:** Non-destructive overlay for YouTube Shorts / TikTok UI safety zones.

---

## 🎬 In-Browser Video Export
- Renders the composite 3D Three.js WebGL scene and 2D fluid typography synchronously with the Web Audio stream directly into `.webm` / `.mp4` video.
- **1-Click 4K/HD Snapshot:** Capture the current animated frame as a high-resolution `.png` cover art thumbnail.

---

## 🚀 Live Demo
Deployable anywhere on GitHub Pages:
👉 **[adityafirmansyah.github.io/gemini-canvas-lyric-video](https://adityafirmansyah.github.io/gemini-canvas-lyric-video/)**
