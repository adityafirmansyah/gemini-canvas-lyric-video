/**
 * canvas-renderer.js
 * Master Single-Template Fluid Kinetic Lyric Video Engine:
 * - 3D Procedural WebGL Background via Three.js (Particle Waves, Ethereal Silk, Cyber Grid, Starfield)
 * - Fluid Kinetic Typography (Staggered liquid springs, per-word wave undulation, vocal pop focus)
 * - Strict Max <= 5 words chunking rule
 * - 100% Canvas Compositing for 60FPS Video Export and PNG Thumbnail Snapshot
 */

import { ThreeBackground } from './three-background.js?v=4.1';
import { LrcParser } from './lrc-parser.js?v=4.1';

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Dimensions
    this.targetWidth = 1920;
    this.targetHeight = 1080;
    this.aspectRatio = '16:9';

    // 1. Three.js 3D Background Engine
    this.threeBg = new ThreeBackground(this.targetWidth, this.targetHeight);

    // 2. Fluid Kinetic Lyric Configuration
    this.fontFamily = "'Outfit', sans-serif";
    this.baseFontSize = 56;
    this.textColor = '#ffffff';
    this.accentColor = '#64ffda';
    this.glowSize = 25;
    this.glowDensity = 1.0;
    this.maxWordsPerChunk = 4; // Strictly <= 5 words!
    this.motionStyle = 'liquid-spring'; // 'liquid-spring', 'vocal-pop', 'ethereal-mist', 'minimal'
    this.containerStyle = 'clean-glow'; // 'clean-glow', 'pill-badge', 'contrast-box', 'ambient-scrim'

    // Container / Badge styling details
    this.badgeConfig = {
      boxColor: '#64ffda',
      textColor: '#080b14',
      radius: 20,
      padding: 14,
      uppercase: false
    };

    // Foreground subject layer (Text Behind Subject)
    this.fgCutoutImage = null;
    this.showSafeGuides = false;
    this.enableAudioReactive = true;

    // Timing & Data
    this.rawLyrics = [];
    this.chunkedLyrics = [];
    this.currentTime = 0;
    this.audioMetrics = { bass: 0, mid: 0, treble: 0, overall: 0, rawFreq: [] };
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

    if (this.threeBg) {
      this.threeBg.setSize(this.targetWidth, this.targetHeight);
    }
  }

  setLyrics(lyrics) {
    this.rawLyrics = Array.isArray(lyrics) ? lyrics : [];
    this.rechunkLyrics();
  }

  setMaxWords(val) {
    this.maxWordsPerChunk = Math.max(1, Math.min(5, parseInt(val) || 4));
    this.rechunkLyrics();
  }

  rechunkLyrics() {
    this.chunkedLyrics = LrcParser.chunkLyricsToMaxWords(this.rawLyrics, this.maxWordsPerChunk);
  }

  setFgCutoutImage(imgElement) {
    this.fgCutoutImage = imgElement;
  }

  updateState({ currentTime, audioMetrics, lyrics }) {
    if (currentTime !== undefined) this.currentTime = currentTime;
    if (audioMetrics) this.audioMetrics = audioMetrics;
    if (lyrics) this.setLyrics(lyrics);
  }

  getPosterY() {
    if (this.aspectRatio === '9:16') return this.targetHeight * 0.36; // Elevated for Shorts UI safety
    if (this.aspectRatio === '1:1') return this.targetHeight * 0.46;
    return this.targetHeight * 0.5; // Centered for 16:9
  }

  render(dt = 0.016) {
    this.animTime += dt;
    const ctx = this.ctx;
    const W = this.targetWidth;
    const H = this.targetHeight;

    const beatPulse = this.enableAudioReactive ? (this.audioMetrics.bass || 0) : 0;
    const overallGlow = this.enableAudioReactive ? ((this.audioMetrics.overall || 0) * 20) : 10;

    // 1. Render Three.js 3D Procedural Background
    if (this.threeBg) {
      this.threeBg.render(dt, this.audioMetrics);

      ctx.fillStyle = this.threeBg.bgColor || '#080b14';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(this.threeBg.canvas, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#080b14';
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Render Fluid Kinetic Lyrics (Strictly <= 5 words per chunk)
    const posterY = this.getPosterY();
    this.drawFluidLyrics(ctx, W, H, beatPulse, overallGlow, posterY);

    // 3. Foreground Subject Layer (Text Behind Subject)
    if (this.fgCutoutImage) {
      this.drawForegroundSubject(ctx, W, H, beatPulse);
    }

    // 4. Preview-only Safe Area Guides
    if (this.showSafeGuides) {
      this.drawSafeAreaGuides(ctx, W, H, posterY);
    }
  }

  drawFluidLyrics(ctx, W, H, beatPulse, overallGlow, posterY) {
    const lyrics = this.chunkedLyrics;
    if (!lyrics || lyrics.length === 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = `500 32px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Upload music & sync lyrics to begin.', W / 2, posterY);
      ctx.restore();
      return;
    }

    const t = this.currentTime;
    const firstChunk = lyrics[0];
    const lastChunk = lyrics[lyrics.length - 1];

    // If audio is paused at the beginning (t === 0), preview the first chunk so user sees typography live
    const isPausedAtStart = (t === 0);
    if (!isPausedAtStart && t < firstChunk.start) return; // Clean screen during real playback intro

    // Find active chunk
    let activeIdx = 0;
    let isInGap = false;

    if (!isPausedAtStart) {
      activeIdx = -1;
      for (let i = 0; i < lyrics.length; i++) {
        const item = lyrics[i];
        if (t >= item.start && t <= item.end) {
          activeIdx = i;
          isInGap = false;
          break;
        } else if (i < lyrics.length - 1 && t > item.end && t < lyrics[i + 1].start) {
          activeIdx = i;
          isInGap = true;
          break;
        }
      }

      if (activeIdx === -1 && t <= lastChunk.end + 0.45) {
        activeIdx = lyrics.length - 1;
        isInGap = true;
      }

      if (activeIdx === -1) return;
    }

    const chunk = lyrics[activeIdx];
    let alpha = 1.0;

    if (isInGap && !isPausedAtStart) {
      const timeInGap = t - chunk.end;
      const fadeTime = 0.35;
      if (timeInGap < fadeTime) {
        alpha = Math.max(0, 1.0 - (timeInGap / fadeTime));
      } else {
        return;
      }
    }

    const duration = Math.max(0.1, chunk.end - chunk.start);
    const progress = isPausedAtStart ? 0.35 : Math.min(1, Math.max(0, (t - chunk.start) / duration));
    const inTime = isPausedAtStart ? 1.0 : Math.max(0.001, t - chunk.start);

    ctx.save();
    ctx.globalAlpha = alpha;
    this.renderFluidChunk({
      ctx,
      text: chunk.text,
      chunkWords: chunk.words, // True AI word timestamps
      centerX: W / 2,
      centerY: posterY,
      maxWidth: W * (this.aspectRatio === '9:16' ? 0.88 : 0.82),
      baseSize: this.baseFontSize,
      progress,
      inTime,
      currentTime: isPausedAtStart ? (chunk.words ? chunk.words[0].start + 0.1 : chunk.start + 0.2) : t,
      chunkStart: chunk.start,
      chunkDuration: duration,
      isPausedAtStart,
      beatPulse,
      overallGlow
    });
    ctx.restore();
  }

  renderFluidChunk({ ctx, text, chunkWords, centerX, centerY, maxWidth, baseSize, progress, inTime, currentTime, chunkStart, chunkDuration, isPausedAtStart, beatPulse, overallGlow }) {
    const isUpper = this.badgeConfig && this.badgeConfig.uppercase;
    const displayText = isUpper ? text.toUpperCase() : text;
    const words = displayText.split(/\s+/).filter(Boolean);
    const totalWords = words.length;
    if (totalWords === 0) return;

    // Auto-fit font size calculation so <= 5 words always look balanced
    let fontSize = baseSize;
    ctx.font = `800 ${fontSize}px ${this.fontFamily}`;
    const testWidth = ctx.measureText(displayText).width + (totalWords * 18);
    if (testWidth > maxWidth) {
      fontSize = Math.max(28, Math.floor(baseSize * (maxWidth / testWidth)));
    }

    ctx.font = `800 ${fontSize}px ${this.fontFamily}`;
    const spaceW = ctx.measureText(' ').width;
    const wordMetrics = words.map(w => ({
      text: w,
      width: ctx.measureText(w).width
    }));

    const totalLineWidth = wordMetrics.reduce((sum, m) => sum + m.width, 0) + (spaceW * (totalWords - 1));
    let curX = centerX - totalLineWidth / 2;

    const gSize = this.glowSize;
    const gDensity = this.glowDensity;

    // --- ACCURATE WORD-TO-WORD TIMING ENGINE ---
    // If AI word timestamps exist, check exactly which word matches current playback time!
    const hasWordTimestamps = Array.isArray(chunkWords) && chunkWords.length === totalWords;
    let activeWordIdx = 0;

    if (hasWordTimestamps) {
      activeWordIdx = -1;
      for (let j = 0; j < totalWords; j++) {
        const w = chunkWords[j];
        if (currentTime >= w.start && currentTime <= w.end) {
          activeWordIdx = j;
          break;
        } else if (j < totalWords - 1 && currentTime > w.end && currentTime < chunkWords[j + 1].start) {
          activeWordIdx = j; // sustained vowel or micro-gap between words
          break;
        }
      }
      if (activeWordIdx === -1) {
        if (currentTime < chunkWords[0].start) activeWordIdx = 0;
        else activeWordIdx = totalWords - 1;
      }
    } else {
      // Syllable / character weight distribution across chunk duration (natural pacing fallback)
      const wordWeights = words.map(w => Math.max(1, w.length));
      const totalWeight = wordWeights.reduce((a, b) => a + b, 0) || 1;
      let elapsedWeight = 0;
      activeWordIdx = -1;
      for (let j = 0; j < totalWords; j++) {
        const wStart = chunkStart + chunkDuration * (elapsedWeight / totalWeight);
        const wEnd = wStart + chunkDuration * (wordWeights[j] / totalWeight);
        if (currentTime >= wStart && currentTime <= wEnd) {
          activeWordIdx = j;
          break;
        }
        elapsedWeight += wordWeights[j];
      }
      if (activeWordIdx === -1) {
        activeWordIdx = isPausedAtStart ? 0 : Math.min(totalWords - 1, Math.floor(progress * totalWords));
      }
    }

    for (let i = 0; i < totalWords; i++) {
      const m = wordMetrics[i];
      const wordCenterX = curX + m.width / 2;

      // 1. Organic Staggered Liquid-Spring Entrance
      const STAGGER = 0.08;
      const wordInTime = Math.max(0, inTime - i * STAGGER);
      const enterDur = 0.38;
      const p = Math.min(1, wordInTime / enterDur);

      let enterScale = 1.0;
      let enterY = 0;
      let enterAlpha = 1.0;

      if (p < 1.0) {
        // Liquid spring curve with overshoot bounce (Damping ~0.78)
        const bounce = Math.sin(p * Math.PI) * 0.16;
        enterScale = 0.8 + (p * 0.2) + bounce;
        enterY = (1.0 - p) * 20;
        enterAlpha = p;
      }

      // 2. Fluid Wave Float (continuous organic breathing)
      let waveFloatY = 0;
      let waveRot = 0;
      if (this.motionStyle === 'liquid-spring' || this.motionStyle === 'ethereal-mist') {
        waveFloatY = Math.sin(this.animTime * 2.6 + i * 0.85) * (4.5 * (1 + beatPulse * 0.6));
        waveRot = Math.cos(this.animTime * 1.8 + i * 0.7) * 0.016;
      }

      // 3. Active Word Spotlight & Vocal Pop
      const isActive = (i === activeWordIdx);
      const isPast = hasWordTimestamps
        ? (currentTime > chunkWords[i].end)
        : (i < activeWordIdx);

      let wordScale = enterScale * (1.0 + beatPulse * 0.06);
      let wordColor = this.textColor || '#ffffff';
      let glowBlur = 0;
      let glowColor = 'transparent';

      if (isActive) {
        if (this.motionStyle === 'vocal-pop') {
          wordScale *= 1.15;
        } else {
          wordScale *= 1.08;
        }
        wordColor = this.accentColor || '#64ffda';
        glowBlur = Math.max(12, gSize * gDensity + (beatPulse * 20));
        glowColor = this.accentColor || '#64ffda';
      } else if (isPast) {
        wordColor = '#ffffff';
        glowBlur = gSize * 0.3 * gDensity;
        glowColor = 'rgba(255, 255, 255, 0.4)';
      } else {
        wordColor = 'rgba(255, 255, 255, 0.72)';
      }

      const finalY = centerY + enterY + waveFloatY;

      ctx.save();
      ctx.translate(wordCenterX, finalY);
      ctx.rotate(waveRot);
      ctx.scale(wordScale, wordScale);
      ctx.globalAlpha = (ctx.globalAlpha || 1.0) * enterAlpha;

      // 4. Container / Badge Style rendering
      if (this.containerStyle === 'pill-badge' || this.containerStyle === 'contrast-box') {
        const padX = 14;
        const padY = 8;
        const bW = m.width + padX * 2;
        const bH = fontSize * 1.1 + padY;
        const rad = this.containerStyle === 'pill-badge' ? bH / 2 : (this.badgeConfig.radius || 4);

        ctx.fillStyle = isActive ? (this.accentColor || '#64ffda') : 'rgba(18, 22, 31, 0.75)';
        ctx.shadowColor = isActive ? this.accentColor : 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = isActive ? glowBlur : 8;

        this.drawRoundedRect(ctx, -bW / 2, -bH / 2, bW, bH, rad);

        ctx.shadowBlur = 0;
        ctx.fillStyle = isActive ? (this.badgeConfig.textColor || '#080b14') : '#ffffff';
      } else if (this.containerStyle === 'ambient-scrim') {
        const padX = 12;
        const padY = 6;
        const bW = m.width + padX * 2;
        const bH = fontSize * 1.1 + padY;

        ctx.fillStyle = isActive ? 'rgba(100, 255, 218, 0.15)' : 'rgba(255, 255, 255, 0.06)';
        this.drawRoundedRect(ctx, -bW / 2, -bH / 2, bW, bH, 8);

        ctx.fillStyle = wordColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowBlur;
      } else {
        // Clean Glowing Typography
        ctx.fillStyle = wordColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowBlur;

        // Multi-pass neon radiance for rich glow density
        if (isActive && gDensity > 1.25 && gSize > 0) {
          ctx.fillText(m.text, 0, 0);
        }
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.text, 0, 0);

      ctx.restore();

      curX += m.width + spaceW;
    }
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    if (!radius || radius <= 0) {
      ctx.fillRect(x, y, width, height);
      return;
    }
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  drawForegroundSubject(ctx, W, H, beatPulse) {
    const img = this.fgCutoutImage;
    if (!img) return;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    const maxH = H * (this.aspectRatio === '9:16' ? 0.52 : 0.62);
    let dh = Math.min(maxH, H * 0.9);
    let dw = dh * (iw / ih);
    if (dw > W * 0.9) { dw = W * 0.9; dh = dw * (ih / iw); }

    const breath = 1 + beatPulse * 0.04;
    const cx = W / 2;
    const cy = H - dh / 2;

    ctx.save();
    // Ambient dark vignette at bottom
    const g = ctx.createLinearGradient(0, H - dh * 0.5, 0, H);
    g.addColorStop(0, 'rgba(8, 11, 20, 0)');
    g.addColorStop(1, 'rgba(8, 11, 20, 0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H - dh * 0.55, W, dh * 0.55);

    ctx.translate(cx, cy);
    ctx.scale(breath, breath);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  drawSafeAreaGuides(ctx, W, H, posterY) {
    const m = H * 0.143;
    ctx.save();
    ctx.setLineDash([10, 7]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.strokeRect(m, m, W - m * 2, H - m * 2);

    ctx.setLineDash([]);
    const rH = H * 0.22, y0 = H - rH;
    ctx.fillStyle = 'rgba(255, 0, 82, 0.16)';
    ctx.fillRect(0, y0, W * 0.42, rH);
    ctx.fillStyle = 'rgba(255, 0, 82, 0.3)';
    const noUi = ['♡', '💬', '↗'];
    ctx.font = `600 ${Math.round(H * 0.032)}px ${this.fontFamily}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const padx = W * 0.035, gap = rH / 4.2;
    noUi.forEach((s, i) => ctx.fillText(s, W - padx, y0 + gap * (i + 1)));

    ctx.strokeStyle = 'rgba(100, 255, 218, 0.8)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, posterY - H * 0.09);
    ctx.lineTo(W, posterY - H * 0.09);
    ctx.moveTo(0, posterY + H * 0.09);
    ctx.lineTo(W, posterY + H * 0.09);
    ctx.stroke();

    ctx.fillStyle = 'rgba(100, 255, 218, 0.95)';
    ctx.font = `600 ${Math.round(H * 0.022)}px ${this.fontFamily}`;
    ctx.fillText('FLUID LYRIC HERO ZONE (≤ 5 WORDS)', W * 0.04, posterY - H * 0.105);
    ctx.restore();
  }
}
