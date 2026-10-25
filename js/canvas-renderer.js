/**
 * canvas-renderer.js
 * High-performance 60FPS Canvas engine for animated kinetic lyrics & audio-reactive visuals.
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
    this.baseFontSize = 54;
    this.textColor = '#ffffff';
    this.accentColor = '#22d3ee';
    this.bgType = 'gradient';
    this.customBgImage = null;
    this.enableAudioReactive = true;

    // Particles State
    this.particles = [];
    this.initParticles(60);

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
  }

  initParticles(count) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.targetWidth,
        y: Math.random() * this.targetHeight,
        radius: Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -Math.random() * 0.6 - 0.2,
        alpha: Math.random() * 0.6 + 0.2
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
    const beatPulse = this.enableAudioReactive ? (this.audioMetrics.bass * 0.12) : 0;
    const overallGlow = this.enableAudioReactive ? (this.audioMetrics.overall * 20) : 10;

    // 1. Draw Background
    this.drawBackground(ctx, W, H, beatPulse);

    // 2. Draw Audio Reactive Visualizer (Waveform / Bars)
    if (this.bgType === 'waveform' || this.enableAudioReactive) {
      this.drawWaveform(ctx, W, H);
    }

    // 3. Draw Lyrics
    this.drawLyrics(ctx, W, H, beatPulse, overallGlow);
  }

  drawBackground(ctx, W, H, beatPulse) {
    if (this.bgType === 'custom-img' && this.customBgImage) {
      // Subtle Ken-burns zoom with beat bounce
      const scale = 1.0 + (Math.sin(this.animTime * 0.2) * 0.03) + beatPulse * 0.05;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(scale, scale);
      ctx.drawImage(this.customBgImage, -W / 2, -H / 2, W, H);
      ctx.restore();

      // Dark overlay for text readability
      ctx.fillStyle = 'rgba(10, 12, 16, 0.65)';
      ctx.fillRect(0, 0, W, H);
      return;
    }

    if (this.bgType === 'particles') {
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, W, H);

      // Draw floating bokeh particles
      ctx.save();
      for (const p of this.particles) {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < 0) p.y = H;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1 + beatPulse * 2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 255, 218, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.accentColor;
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // Default: Animated Gradient
    const shift = Math.sin(this.animTime * 0.3) * 0.5 + 0.5;
    const grad = ctx.createRadialGradient(
      W * 0.5, H * 0.5, 50,
      W * 0.5, H * 0.5, Math.max(W, H) * (0.8 + beatPulse * 0.2)
    );

    // Subtle dark aesthetic gradient
    grad.addColorStop(0, '#16192b');
    grad.addColorStop(0.5, '#0b0d18');
    grad.addColorStop(1, '#05060a');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  drawWaveform(ctx, W, H) {
    const rawFreq = this.audioMetrics.rawFreq;
    if (!rawFreq || rawFreq.length === 0) return;

    ctx.save();
    const barCount = 48;
    const barWidth = (W * 0.6) / barCount;
    const startX = (W - W * 0.6) / 2;
    const baseY = H * 0.88;

    for (let i = 0; i < barCount; i++) {
      const freqIndex = Math.floor((i / barCount) * rawFreq.length * 0.7);
      const val = rawFreq[freqIndex] / 255.0;
      const barHeight = Math.max(4, val * (H * 0.12));

      ctx.fillStyle = `rgba(34, 211, 238, ${0.2 + val * 0.6})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.accentColor;

      // Rounded symmetrical bars
      const x = startX + i * barWidth;
      ctx.fillRect(x + 2, baseY - barHeight / 2, barWidth - 4, barHeight);
    }
    ctx.restore();
  }

  drawLyrics(ctx, W, H, beatPulse, overallGlow) {
    if (!this.lyrics || this.lyrics.length === 0) {
      // Empty state prompt
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = `600 32px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Ready. Upload music & sync lyrics.', W / 2, H / 2);
      ctx.restore();
      return;
    }

    const t = this.currentTime;
    let activeIdx = -1;

    for (let i = 0; i < this.lyrics.length; i++) {
      const item = this.lyrics[i];
      if (t >= item.start && t <= item.end) {
        activeIdx = i;
        break;
      } else if (i < this.lyrics.length - 1 && t > item.end && t < this.lyrics[i + 1].start) {
        // In-between lines
        activeIdx = i;
        break;
      }
    }

    if (activeIdx === -1) {
      // If before first lyric
      if (this.lyrics.length > 0 && t < this.lyrics[0].start) {
        activeIdx = 0;
      } else {
        activeIdx = this.lyrics.length - 1;
      }
    }

    const currentLine = this.lyrics[activeIdx];
    const prevLine = activeIdx > 0 ? this.lyrics[activeIdx - 1] : null;
    const nextLine = activeIdx < this.lyrics.length - 1 ? this.lyrics[activeIdx + 1] : null;

    const centerY = H / 2;
    const fontSize = this.baseFontSize * (1.0 + beatPulse * 0.8);

    // 1. Draw Active Line
    if (currentLine) {
      ctx.save();
      ctx.font = `700 ${fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Glow effect
      ctx.shadowColor = this.accentColor;
      ctx.shadowBlur = Math.min(40, 15 + overallGlow);
      ctx.fillStyle = this.textColor;

      // Calculate karaoke word fill or smooth fade
      const isCurrentlyActive = (t >= currentLine.start && t <= currentLine.end);
      if (isCurrentlyActive) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.shadowBlur = 5;
      }

      this.wrapAndDrawText(ctx, currentLine.text, W / 2, centerY, W * 0.8, fontSize * 1.3);
      ctx.restore();
    }

    // 2. Draw Previous Line (faded above)
    if (prevLine) {
      ctx.save();
      const prevSize = this.baseFontSize * 0.65;
      ctx.font = `500 ${prevSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.shadowBlur = 0;

      this.wrapAndDrawText(ctx, prevLine.text, W / 2, centerY - (fontSize * 1.6), W * 0.8, prevSize * 1.3);
      ctx.restore();
    }

    // 3. Draw Next Line (faded below)
    if (nextLine) {
      ctx.save();
      const nextSize = this.baseFontSize * 0.65;
      ctx.font = `500 ${nextSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.shadowBlur = 0;

      this.wrapAndDrawText(ctx, nextLine.text, W / 2, centerY + (fontSize * 1.6), W * 0.8, nextSize * 1.3);
      ctx.restore();
    }
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