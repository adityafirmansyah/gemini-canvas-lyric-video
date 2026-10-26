/**
 * canvas-renderer.js
 * Multi-style 60FPS Canvas engine for animated kinetic lyrics, typography animations,
 * and audio-reactive visualizer backgrounds.
 */

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Resolution & Aspect Ratio
    this.targetWidth = 1920;
    this.targetHeight = 1080;
    this.aspectRatio = '16:9';

    // Style Configuration
    this.fontFamily = "'Outfit', sans-serif";
    this.baseFontSize = 52;
    this.textColor = '#ffffff';
    this.accentColor = '#22d3ee';
    this.bgType = 'particles';
    this.animType = 'smooth-slide';
    this.customBgImage = null;
    this.enableAudioReactive = true;

    // Visual elements state
    this.particles = [];
    this.rainDrops = [];
    this.stars = [];
    this.gridOffset = 0;
    this.initVisualElements();

    // Timing & Lyrics Data
    this.lyrics = [];
    this.currentTime = 0;
    this.audioMetrics = { bass: 0, mid: 0, treble: 0, overall: 0, rawFreq: [] };

    // Animation time tracker
    this.animTime = 0;

    this.setAspectRatio('16:9', '1080p');
  }

  setAspectRatio(ratio, resolution = '1080p') {
    this.aspectRatio = ratio;
    const is1080p = resolution === '1080p';

    if (ratio === '16:9') {
      this.targetWidth = is1080p ? 1920 : 1280;
      this.targetHeight = is1080p ? 1080 : 720;
    } else if (ratio === '9:16') {
      this.targetWidth = is1080p ? 1080 : 720;
      this.targetHeight = is1080p ? 1920 : 1280;
    } else if (ratio === '1:1') {
      this.targetWidth = is1080p ? 1080 : 720;
      this.targetHeight = is1080p ? 1080 : 720;
    }

    this.canvas.width = this.targetWidth;
    this.canvas.height = this.targetHeight;
    this.initVisualElements();
  }

  initVisualElements() {
    // 1. Dust Particles
    this.particles = [];
    for (let i = 0; i < 70; i++) {
      this.particles.push({
        x: Math.random() * this.targetWidth,
        y: Math.random() * this.targetHeight,
        radius: Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -Math.random() * 0.6 - 0.2,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    // 2. Rain Drops
    this.rainDrops = [];
    for (let i = 0; i < 120; i++) {
      this.rainDrops.push({
        x: Math.random() * this.targetWidth,
        y: Math.random() * this.targetHeight,
        length: Math.random() * 24 + 12,
        speed: Math.random() * 12 + 16,
        alpha: Math.random() * 0.4 + 0.15
      });
    }

    // 3. 3D Stars
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * this.targetWidth,
        y: (Math.random() - 0.5) * this.targetHeight,
        z: Math.random() * this.targetWidth
      });
    }
  }

  setLyrics(lyrics) {
    this.lyrics = Array.isArray(lyrics) ? lyrics : [];
  }

  setCustomImage(imgElement) {
    this.customBgImage = imgElement;
  }

  updateState({ currentTime, audioMetrics, lyrics }) {
    if (currentTime !== undefined) this.currentTime = currentTime;
    if (audioMetrics) this.audioMetrics = audioMetrics;
    if (lyrics) this.lyrics = lyrics;
  }

  render(dt = 0.016) {
    this.animTime += dt;
    const ctx = this.ctx;
    const W = this.targetWidth;
    const H = this.targetHeight;

    // Audio-reactive scale factor (kick/bass bounce)
    const beatPulse = this.enableAudioReactive ? (this.audioMetrics.bass * 0.14) : 0;
    const overallGlow = this.enableAudioReactive ? (this.audioMetrics.overall * 25) : 10;

    // 1. Draw Background
    this.drawBackground(ctx, W, H, beatPulse, dt);

    // 2. Draw Audio Reactive Waveform if enabled or chosen
    if (this.bgType === 'waveform') {
      this.drawWaveform(ctx, W, H, beatPulse);
    }

    // 3. Draw Lyrics with selected animation
    this.drawLyrics(ctx, W, H, beatPulse, overallGlow);
  }

  drawBackground(ctx, W, H, beatPulse, dt) {
    // Custom Image Background
    if (this.bgType === 'custom-img' && this.customBgImage) {
      const scale = 1.0 + (Math.sin(this.animTime * 0.2) * 0.03) + beatPulse * 0.06;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(scale, scale);
      ctx.drawImage(this.customBgImage, -W / 2, -H / 2, W, H);
      ctx.restore();

      ctx.fillStyle = 'rgba(10, 12, 16, 0.68)';
      ctx.fillRect(0, 0, W, H);
      return;
    }

    // Rain Background
    if (this.bgType === 'rain') {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const r of this.rainDrops) {
        r.y += r.speed * (1 + beatPulse);
        if (r.y > H) {
          r.y = -r.length;
          r.x = Math.random() * W;
        }
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - 1, r.y + r.length);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Starfield Hyperspace Background
    if (this.bgType === 'starfield') {
      ctx.fillStyle = '#050608';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(W / 2, H / 2);
      const starSpeed = (600 + beatPulse * 900) * dt;

      for (const s of this.stars) {
        s.z -= starSpeed;
        if (s.z <= 0) {
          s.z = W;
          s.x = (Math.random() - 0.5) * W;
          s.y = (Math.random() - 0.5) * H;
        }

        const k = 250 / s.z;
        const px = s.x * k;
        const py = s.y * k;

        if (px >= -W / 2 && px <= W / 2 && py >= -H / 2 && py <= H / 2) {
          const size = Math.max(0.8, (1 - s.z / W) * 3);
          const alpha = Math.min(1, (1 - s.z / W) * 1.5);
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      }
      ctx.restore();
      return;
    }

    // Retro Synthwave Grid Background
    if (this.bgType === 'synthwave-grid') {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0a0017');
      grad.addColorStop(0.5, '#240046');
      grad.addColorStop(1, '#ff007f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Neon Horizon Sun
      const sunY = H * 0.52;
      const sunR = Math.min(W, H) * 0.22;
      const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
      sunGrad.addColorStop(0, '#ffbe0b');
      sunGrad.addColorStop(0.5, '#fb5607');
      sunGrad.addColorStop(1, '#ff006e');

      ctx.save();
      ctx.fillStyle = sunGrad;
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 30 + beatPulse * 40;
      ctx.beginPath();
      ctx.arc(W / 2, sunY, sunR, Math.PI, 0, false);
      ctx.fill();
      ctx.restore();

      // Horizon grid
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 1.5;
      this.gridOffset = (this.gridOffset + (40 + beatPulse * 80) * dt) % 35;

      const horizonY = H * 0.52;
      // Perspective vertical lines
      const fovCenter = W / 2;
      for (let x = -W * 0.8; x <= W * 1.8; x += 70) {
        ctx.beginPath();
        ctx.moveTo(fovCenter, horizonY);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // Horizontal rolling lines
      for (let y = horizonY; y < H; y += 12) {
        const norm = (y - horizonY) / (H - horizonY);
        const actualY = horizonY + Math.pow(norm, 2.2) * (H - horizonY) + (this.gridOffset * norm);
        if (actualY <= H) {
          ctx.beginPath();
          ctx.moveTo(0, actualY);
          ctx.lineTo(W, actualY);
          ctx.stroke();
        }
      }
      ctx.restore();
      return;
    }

    // Floating Dust Bokeh Particles
    if (this.bgType === 'particles') {
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      for (const p of this.particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.y < 0) p.y = H;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1 + beatPulse * 2.2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 255, 218, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.accentColor;
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // Default: Breathing Radial Gradient
    const grad = ctx.createRadialGradient(
      W * 0.5, H * 0.5, 50,
      W * 0.5, H * 0.5, Math.max(W, H) * (0.8 + beatPulse * 0.25)
    );
    grad.addColorStop(0, '#151928');
    grad.addColorStop(0.5, '#0b0d18');
    grad.addColorStop(1, '#05060a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  drawWaveform(ctx, W, H, beatPulse) {
    const rawFreq = this.audioMetrics.rawFreq;
    if (!rawFreq || rawFreq.length === 0) return;

    ctx.save();
    const barCount = 56;
    const barWidth = (W * 0.65) / barCount;
    const startX = (W - W * 0.65) / 2;
    const baseY = H * 0.88;

    for (let i = 0; i < barCount; i++) {
      const freqIndex = Math.floor((i / barCount) * rawFreq.length * 0.7);
      const val = rawFreq[freqIndex] / 255.0;
      const barHeight = Math.max(4, val * (H * 0.14) * (1 + beatPulse * 0.5));

      ctx.fillStyle = `rgba(34, 211, 238, ${0.25 + val * 0.65})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.accentColor;

      const x = startX + i * barWidth;
      ctx.fillRect(x + 2, baseY - barHeight / 2, barWidth - 4, barHeight);
    }
    ctx.restore();
  }

  drawLyrics(ctx, W, H, beatPulse, overallGlow) {
    if (!this.lyrics || this.lyrics.length === 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = `600 32px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Ready. Upload music & sync lyrics.', W / 2, H / 2);
      ctx.restore();
      return;
    }

    const t = this.currentTime;
    const firstLyric = this.lyrics[0];
    const lastLyric = this.lyrics[this.lyrics.length - 1];

    // 1. Before first lyric starts (Intro / Instrumental opening)
    if (t < firstLyric.start) {
      return; // Screen is completely clean during intro
    }

    // 2. After last lyric ends (Outro / Instrumental ending)
    if (t > lastLyric.end) {
      const timePastEnd = t - lastLyric.end;
      const fadeDuration = 0.5;
      if (timePastEnd < fadeDuration) {
        // Quick smooth fade out of the final lyric line
        const alpha = Math.max(0, 1.0 - (timePastEnd / fadeDuration));
        ctx.save();
        ctx.globalAlpha = alpha;
        this.renderActiveLineAnimation({
          ctx,
          text: lastLyric.text,
          x: W / 2,
          y: H / 2,
          maxWidth: W * 0.85,
          baseSize: this.baseFontSize,
          beatPulse: beatPulse * alpha,
          overallGlow: overallGlow * alpha,
          progress: 1.0,
          t,
          start: lastLyric.start,
          end: lastLyric.end
        });
        ctx.restore();
      }
      return; // Clean screen for outro visualizer
    }

    // 3. During lyrics playback — find only the active lyric
    let activeIdx = -1;
    let isInGap = false;

    for (let i = 0; i < this.lyrics.length; i++) {
      const item = this.lyrics[i];
      if (t >= item.start && t <= item.end) {
        activeIdx = i;
        isInGap = false;
        break;
      } else if (i < this.lyrics.length - 1 && t > item.end && t < this.lyrics[i + 1].start) {
        activeIdx = i;
        isInGap = true;
        break;
      }
    }

    if (activeIdx === -1) return;

    const currentLine = this.lyrics[activeIdx];
    const centerY = H / 2;
    const baseSize = this.baseFontSize;

    // Handle brief pause/gap between lines (fade out previous line quickly)
    let activeAlpha = 1.0;
    if (isInGap) {
      const timeInGap = t - currentLine.end;
      const fadeOutTime = 0.35;
      if (timeInGap < fadeOutTime) {
        activeAlpha = 1.0 - (timeInGap / fadeOutTime);
      } else {
        return; // Gap is active: clean screen between lines
      }
    }

    // Draw ONLY the Active Lyric Line in the center
    if (currentLine && activeAlpha > 0.01) {
      const lineDuration = Math.max(0.1, currentLine.end - currentLine.start);
      const lineProgress = Math.min(1, Math.max(0, (t - currentLine.start) / lineDuration));

      ctx.save();
      ctx.globalAlpha = activeAlpha;
      this.renderActiveLineAnimation({
        ctx,
        text: currentLine.text,
        x: W / 2,
        y: centerY,
        maxWidth: W * 0.85,
        baseSize,
        beatPulse,
        overallGlow,
        progress: lineProgress,
        t,
        start: currentLine.start,
        end: currentLine.end
      });
      ctx.restore();
    }
  }

  /**
   * Renders active lyric line according to selected animation type
   */
  renderActiveLineAnimation({ ctx, text, x, y, maxWidth, baseSize, beatPulse, overallGlow, progress, t, start, end }) {
    ctx.save();

    // 1. STYLE: Karaoke Progressive Fill (Spotify / Apple Music style)
    if (this.animType === 'karaoke-fill') {
      const fontSize = baseSize * (1.0 + beatPulse * 0.5);
      ctx.font = `800 ${fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw background un-filled text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.shadowBlur = 0;
      this.wrapAndDrawText(ctx, text, x, y, maxWidth, fontSize * 1.3);

      // Draw active fill via clipping
      const words = text.split(' ');
      const totalWidth = ctx.measureText(text).width;
      const fillWidth = totalWidth * progress;

      ctx.save();
      ctx.beginPath();
      // Clip rectangle from left to fillWidth
      ctx.rect(x - totalWidth / 2 - 20, y - fontSize * 1.5, fillWidth + 20, fontSize * 3);
      ctx.clip();

      ctx.fillStyle = this.accentColor;
      ctx.shadowColor = this.accentColor;
      ctx.shadowBlur = 20 + overallGlow;
      this.wrapAndDrawText(ctx, text, x, y, maxWidth, fontSize * 1.3);
      ctx.restore();
      ctx.restore();
      return;
    }

    // 2. STYLE: Pop & Beat Scale (Energetic / Phonk / Trap)
    if (this.animType === 'pop-bounce') {
      // Scale overshoot on entry
      let entryScale = 1.0;
      const timeIn = t - start;
      if (timeIn >= 0 && timeIn < 0.35) {
        const p = timeIn / 0.35;
        entryScale = 0.8 + Math.sin(p * Math.PI) * 0.35;
      }
      const fontSize = baseSize * entryScale * (1.0 + beatPulse * 1.2);

      ctx.font = `900 ${fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = this.accentColor;
      ctx.shadowBlur = 25 + overallGlow * 1.5;

      this.wrapAndDrawText(ctx, text, x, y, maxWidth, fontSize * 1.3);
      ctx.restore();
      return;
    }

    // 3. STYLE: Floating Ambient Wave (Ambient / Dreamy / Chill)
    if (this.animType === 'floating-wave') {
      const waveY = Math.sin(this.animTime * 2.8) * 14;
      const fontSize = baseSize * (1.0 + beatPulse * 0.4);

      ctx.font = `600 ${fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.textColor;
      ctx.shadowColor = this.accentColor;
      ctx.shadowBlur = 18 + overallGlow;

      this.wrapAndDrawText(ctx, text, x, y + waveY, maxWidth, fontSize * 1.3);
      ctx.restore();
      return;
    }

    // 4. STYLE: Typewriter (Retro Terminal / Lofi)
    if (this.animType === 'typewriter') {
      const fontSize = baseSize;
      ctx.font = `700 ${fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const visibleChars = Math.max(1, Math.floor(progress * text.length));
      const partialText = text.slice(0, visibleChars);
      const isBlink = Math.floor(this.animTime * 3) % 2 === 0;
      const cursor = (progress < 1.0 && isBlink) ? ' ▋' : '';

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = this.accentColor;
      ctx.shadowBlur = 12 + overallGlow * 0.5;

      this.wrapAndDrawText(ctx, partialText + cursor, x, y, maxWidth, fontSize * 1.3);
      ctx.restore();
      return;
    }

    // 5. STYLE: Cyber Glitch & Chromatic Aberration
    if (this.animType === 'cyber-glitch') {
      const fontSize = baseSize * (1.0 + beatPulse * 0.6);
      ctx.font = `700 ${fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const isGlitch = (Math.random() < 0.15) || (beatPulse > 0.08);
      const offset = isGlitch ? (Math.random() - 0.5) * 14 : 0;

      // Cyan channel
      ctx.save();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
      this.wrapAndDrawText(ctx, text, x - offset, y, maxWidth, fontSize * 1.3);
      ctx.restore();

      // Red/Magenta channel
      ctx.save();
      ctx.fillStyle = 'rgba(255, 0, 127, 0.75)';
      this.wrapAndDrawText(ctx, text, x + offset, y, maxWidth, fontSize * 1.3);
      ctx.restore();

      // Main white core
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = this.accentColor;
      ctx.shadowBlur = 15;
      this.wrapAndDrawText(ctx, text, x, y, maxWidth, fontSize * 1.3);
      ctx.restore();
      return;
    }

    // 6. DEFAULT: Smooth Slide-Up with Ease-Out
    const timeIn = t - start;
    let slideY = 0;
    if (timeIn >= 0 && timeIn < 0.45) {
      const p = timeIn / 0.45;
      const easeOut = 1 - Math.pow(1 - p, 3);
      slideY = (1 - easeOut) * 35;
    }

    const fontSize = baseSize * (1.0 + beatPulse * 0.7);
    ctx.font = `700 ${fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = this.accentColor;
    ctx.shadowBlur = Math.min(45, 18 + overallGlow);
    ctx.fillStyle = '#ffffff';

    this.wrapAndDrawText(ctx, text, x, y + slideY, maxWidth, fontSize * 1.3);
    ctx.restore();
  }

  wrapAndDrawText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);

    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, startY + i * lineHeight);
    }
  }
}
