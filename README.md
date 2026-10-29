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

### 2. ✍️ Typographic Poster Collage Engine (Word-Cloud / Image Replica)
Inspired by bold graphic poster typography and word-cloud branding (interlocking horizontal & vertical layouts):
- **Hero Centerpiece Word:** The dominant keyword or currently sung word commands the center stage in massive, bold **Poster Golden Yellow (`#F5B010`)**.
- **Interlocking Vertical & Horizontal Rails:** Supporting words wrap closely around the hero word in contrasting **Solid Black (`#111111`)**—some placed horizontally above and below, and others rotated vertically (**&plusmn;90&deg;**) hugging the left and right flanks.
- **Vocal Spotlight Transitions:** As each word is sung, it lights up in vibrant yellow with an elastic spring punch, while already sung words settle into solid high-contrast black/white.
- **Organic Liquid Undulation:** Words never freeze like a flat JPEG; subtle phase-shifted sine-wave floating breathes life into every word on screen.
- **1-Click Theme Switch:** Toggle between **Poster Gallery Light** (clean white canvas like the reference image) and **Obsidian Stage Dark** (deep black with glowing gold & white).
- **Hero-Morph vs Fixed Poster:** Choose whether the active word actively slides into the giant hero slot or stays as an anchored typographic poster cloud.

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
