# ✨ AI Lyric Canvas Studio (Multi-AI & LRC)

An in-browser, high-performance HTML5 Canvas application that turns uploaded music tracks into animated kinetic typography lyric videos using **Multi-AI Audio Alignment (Gemini, Groq Whisper, OpenAI Whisper)** or **Direct .LRC / .SRT Subtitle Import (Zero API)**.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Format](https://img.shields.io/badge/Format-16%3A9%20%7C%209%3A16%20%7C%201%3A1-purple.svg)](#)
[![Zero Backend](https://img.shields.io/badge/Architecture-100%25%20Client--Side-green.svg)](#)
[![Sync](https://img.shields.io/badge/Sync-Multi--AI%20%7C%20LRC%20%7C%20SRT-cyan.svg)](#)

---

## 🚀 Key Features

- **🌐 Multi-AI Audio Detection & Alignment:**
  - **Google Gemini (gemini-3.8-flash / gemini-3.8-pro):** Native multimodal audio understanding directly in-browser.
  - **Groq Whisper (whisper-large-v3-turbo):** Lightning fast ASR transcription with segment timestamps.
  - **OpenAI Whisper (whisper-1):** Industry standard high-accuracy speech-to-text.
  - **Custom OpenAI-Compatible Endpoint:** Connect to your own local Whisper/Ollama server.
- **📄 Zero-API .LRC / .SRT Direct Import:**
  - Already have timed lyrics from Spotify, Musixmatch, or Suno? Drag & drop `.lrc` or `.srt` files and render immediately—no AI calls, no internet connection, zero API keys required.
- **🎨 60 FPS Kinetic Typography Animation Engine:**
  - **Smooth Slide-Up:** Cinematic cubic ease-out glide upward.
  - **Karaoke Progressive Fill:** Spotify/Apple Music style progressive left-to-right highlight wipe.
  - **Beat Pop & Scale:** Punchy spring bounce timed to vocal onsets and kick drum bass.
  - **Progressive Word Stacking (Highway Drive / Viral POV):** Accumulates words progressively on beat as they are sung into a massive, multi-line typography stack (exact viral road POV format).
  - **Floating Ambient Wave:** Dreamy vertical sine-wave undulating motion.
  - **Typewriter Reveal:** Vintage terminal character-by-character typing with blinking cursor.
  - **Cyber Glitch:** Chromatic aberration RGB channel splitting and digital jitter.
  - **Glow Size & Density Controls:** Real-time Glow Radius (0px to 60px) and Glow Density (0% to 200%) for dense, multi-pass neon radiance.
- **🏷️ Subtitle & Box Badge Design (Agency / TikTok Viral Styles):**
  - **Badge Styles:** Solid Highlight Box Banner, Dual-Tone Inverted Badges (alternating Lime Green & Dark boxes like creative agency branding), Individual Word Badges, Active Word Pop-out Badge (karaoke spoken-word pop), and Heavy Comic Outline.
  - **Customizable Badges:** Box background color, inner text color, quick palette buttons (Volt Lime, Electric Yellow, Cyan, Pink, Red, White, Pitch Black).
  - **Corner Rounding & Padding:** Sliders for sharp crisp rectangular sticker corners (0px) to rounded pills (24px).
  - **ALL CAPS Impact:** Toggle for bold high-contrast uppercase lettering.
- **🖼️ Custom Artwork Backdrop & Cinematic Motion Engine:**
  - **Upload Any Background:** Drag & drop Midjourney art, anime illustrations, lofi room visuals, or album covers.
  - **Motion Animation Styles:** Ken Burns breathing zoom, Continuous Zoom In, Continuous Zoom Out, Slow Horizontal Pan Drift, Slow Vertical Pan Drift, Gentle Pendulum Sway/Tilt, Beat Bounce Only, or Static.
  - **Motion Controls:** Motion Speed (0.2x-3.0x), Motion Intensity (0%-250%), and Audio Beat Bounce Intensity (0%-250%).
  - **Adjustable Dimming Tint:** Slider from 10% to 90% with 1-click Reset Motion button.
- **🌌 Atmospheric Overlay Effects & Real-Time Physics Tuning:**
  - **Layered Effects:** Floating Dust Bokeh, Dreamy Rain on Glass, Starfield Hyperspace, Audio Reactive Waveform, Retro Synthwave 3D Grid.
  - **Flow Direction:** Custom physics direction: Default drift, Downward (rain/snow), Upward (rising embers/floating), Left, or Right.
  - **Fine-Tuning Sliders:** Real-time Density (20%-250%), Speed (0.2x-3.0x), Size (0.4x-2.5x), and Opacity (10%-100%).
  - **Custom Particle Image Upload:** Upload transparent PNG graphics (sakura petals, snowflakes, leaves, cash notes, sparks) with automatic realistic tumbling rotation and beat bounce.
  - **Color Picker & 1-Click Reset:** Custom particle color tinting and instant reset to defaults.
  - **None (Clean):** Display pristine artwork with zero overlay.
- **✨ 12 Curated Aesthetic Presets (1-Click Styling):**
  - **Lofi Chill:** Lavender & soft blue particles with clean slide typography.
  - **Cyberpunk:** Neon magenta/cyan chromatic glitch and frequency visualizer.
  - **Synthwave:** Sunset orange/magenta glow, rolling 3D wireframe grid, and beat pop.
  - **Rainy Dream:** Atmospheric moody rain window with floating wave text.
  - **Minimal Dark:** Luxury serif typography on deep monochrome backdrop.
  - **Karaoke Glow:** Electric cyan progressive wipe fill on high-contrast stage.
  - **Phonk Drift:** Blood crimson aura, aggressive beat bounce, and high-energy punch.
  - **Sakura Pastel:** Japanese lofi aesthetic with cherry blossom blush & floating wave text.
  - **Dark Academia:** Warm candlelit amber, espresso background, and retro typewriter reveal.
  - **Cosmic Space:** Starfield hyperspace warp with electric violet aura.
  - **Vintage Soul:** 70s warm terracotta & gold tones with Courier typewriter typography.
  - **Acid Rave:** High-voltage neon lime green with reactive equalizer bars and cyber glitch.
  - **Highway POV (Viral Road Track):** Tall ultra-bold Bebas Neue typography, progressive word-by-word cumulative stacking, deep asphalt drop shadow, 3D vanishing perspective tilt, and subtle road vibration.
- **🎬 In-Browser Video Export:**
  - Combines the Canvas render stream and Web Audio destination into a synchronized video export (`.webm` / `.mp4`) directly inside your browser—no backend server, FFmpeg installation, or cloud rendering required.
- **🔒 Privacy First:**
  - Your API keys are stored strictly in your browser's `localStorage` and sent only to the provider you select.

---

## 🛠️ Architecture & Pipeline

```
[ Upload MP3 / WAV ]
         │
         ├────────────────────────────────────────┐
         ▼                                        ▼
[ Mode A: Multi-AI Auto-Sync ]         [ Mode B: Direct .LRC / .SRT ]
(Gemini / Groq / OpenAI / Custom)       (Zero API / Instant Local Parse)
         │                                        │
         └───────────────────┬────────────────────┘
                             │
                             ▼
              [ Timed Lyrics JSON Matrix ]
                             │
                             ▼
                 [ Web Audio API Analyser ]
               (Real-time FFT & Bass Pulse)
                             │
                             ▼
                [ HTML5 Canvas 60FPS Engine ]
            (Kinetic Typography + Dynamic Glow)
                             │
                             ▼
                   [ MediaRecorder API ]
             (Synchronized Video File Export)
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
4. Your lyric video generator is live at `https://adityafirmansyah.github.io/gemini-canvas-lyric-video/`.

---

## 📖 How to Use

1. **Step 1: Upload Music**
   - Drag and drop your audio track (MP3 or WAV) into the drop zone.
2. **Step 2: Choose Sync Method**
   - **Method A (AI Auto-Detect):** Select your preferred AI provider, click the link to get your key if needed ([Google AI Studio](https://aistudio.google.com/app/apikey), [Groq Console](https://console.groq.com/keys), or [OpenAI Platform](https://platform.openai.com/api-keys)), enter your key, and click **Run Audio Detection & Alignment**.
   - **Method B (LRC/SRT Import):** Drag and drop your `.lrc` or `.srt` file to load timestamps instantly with zero API keys.
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
