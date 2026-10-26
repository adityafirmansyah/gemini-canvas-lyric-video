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
    this.glowSize = 25; // in pixels (0 to 60)
    this.glowDensity = 1.0; // multiplier (0.0 to 2.0)
    this.overlayType = 'particles';
    this.bgType = 'particles';
    this.animType = 'smooth-slide';
    this.customBgImage = null;
    this.bgDim = 0.55; // 0.0 to 0.95 dark tint over custom image
    this.enableAudioReactive = true;
    this.customParticleImage = null;

    // Background motion configuration
    this.bgConfig = {
      animType: 'ken-burns', // 'ken-burns', 'zoom-in', 'zoom-out', 'pan-horizontal', 'pan-vertical', 'sway', 'beat-only', 'static'
      speed: 1.0,           // 0.2 to 3.0
      intensity: 1.0,       // 0.0 to 2.5
      beatBounce: 1.0       // 0.0 to 2.5
    };

    // Overlay fine-tuning configuration
    this.overlayConfig = {
      density: 1.0,         // Multiplier: 0.2 to 2.5
      speed: 1.0,           // Multiplier: 0.2 to 3.0
      direction: 'default', // 'default', 'down', 'up', 'left', 'right'
      size: 1.0,            // Multiplier: 0.4 to 2.5
      opacity: 1.0,         // Multiplier: 0.2 to 1.5
      color: '#64ffda'      // Particle / overlay color
    };

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
    const density = (this.overlayConfig && this.overlayConfig.density) ? this.overlayConfig.density : 1.0;

    // 1. Dust Particles (base 70)
    const particleCount = Math.floor(70 * density);
    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.targetWidth,
        y: Math.random() * this.targetHeight,
        radius: Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -Math.random() * 0.6 - 0.2,
        alpha: Math.random() * 0.6 + 0.2,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.5
      });
    }

    // 2. Rain Drops (base 120)
    const rainCount = Math.floor(120 * density);
    this.rainDrops = [];
    for (let i = 0; i < rainCount; i++) {
      this.rainDrops.push({
        x: Math.random() * this.targetWidth,
        y: Math.random() * this.targetHeight,
        length: Math.random() * 24 + 12,
        speed: Math.random() * 12 + 16,
        alpha: Math.random() * 0.4 + 0.15
      });
    }

    // 3. 3D Stars (base 150)
    const starCount = Math.floor(150 * density);
    this.stars = [];
    for (let i = 0; i < starCount; i++) {
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

  setCustomParticleImage(imgElement) {
    this.customParticleImage = imgElement;
  }

  setBgConfig(newConfig) {
    this.bgConfig = { ...this.bgConfig, ...newConfig };
  }

  setOverlayType(type) {
    this.overlayType = type;
    this.bgType = type;
  }

  setOverlayConfig(newConfig) {
    const prevDensity = this.overlayConfig ? this.overlayConfig.density : 1.0;
    this.overlayConfig = { ...this.overlayConfig, ...newConfig };
    if (newConfig.density !== undefined && newConfig.density !== prevDensity) {
      this.initVisualElements();
    }
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

    // 1. Draw Base Backdrop (Custom Image or Ambient Gradient)
    this.drawBaseBackdrop(ctx, W, H, beatPulse);

    // 2. Draw Atmospheric Overlay Effect (Rain, Dust Particles, Stars, Waveform, Grid)
    this.drawOverlayEffect(ctx, W, H, beatPulse, dt);

    // 3. Draw Lyrics with selected animation
    this.drawLyrics(ctx, W, H, beatPulse, overallGlow);
  }

  drawBaseBackdrop(ctx, W, H, beatPulse) {
    const cfg = this.bgConfig || {
      animType: 'ken-burns',
      speed: 1.0,
      intensity: 1.0,
      beatBounce: 1.0
    };

    const anim = cfg.animType || 'ken-burns';
    const spd = (cfg.speed !== undefined ? cfg.speed : 1.0) * 0.22;
    const intensity = (cfg.intensity !== undefined ? cfg.intensity : 1.0);
    const beatMult = (cfg.beatBounce !== undefined ? cfg.beatBounce : 1.0);
    const beatEffect = anim === 'static' ? 0 : (beatPulse * 0.05 * beatMult);

    let scale = 1.0;
    let panX = 0;
    let panY = 0;
    let rotation = 0;

    if (anim === 'static') {
      scale = 1.0;
    } else if (anim === 'beat-only') {
      scale = 1.0 + beatEffect;
    } else if (anim === 'ken-burns') {
      const tScale = Math.sin(this.animTime * spd) * 0.038 * intensity;
      scale = 1.05 + tScale + beatEffect;
    } else if (anim === 'zoom-in') {
      const p = (this.animTime * spd * 0.25) % 1;
      scale = 1.02 + (p * 0.1 * intensity) + beatEffect;
    } else if (anim === 'zoom-out') {
      const p = (this.animTime * spd * 0.25) % 1;
      scale = 1.12 - (p * 0.1 * intensity) + beatEffect;
    } else if (anim === 'pan-horizontal') {
      scale = 1.07 + beatEffect;
      panX = Math.sin(this.animTime * spd) * (W * 0.035 * intensity);
    } else if (anim === 'pan-vertical') {
      scale = 1.07 + beatEffect;
      panY = Math.sin(this.animTime * spd) * (H * 0.035 * intensity);
    } else if (anim === 'sway') {
      scale = 1.07 + beatEffect;
      rotation = Math.sin(this.animTime * spd) * (0.025 * intensity);
    }

    if (this.customBgImage) {
      ctx.save();
      ctx.translate(W / 2 + panX, H / 2 + panY);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);

      const imgW = this.customBgImage.naturalWidth || this.customBgImage.width || W;
      const imgH = this.customBgImage.naturalHeight || this.customBgImage.height || H;
      const imgRatio = imgW / imgH;
      const canvasRatio = W / H;
      let drawW, drawH;

      if (canvasRatio > imgRatio) {
        drawW = W;
        drawH = W / imgRatio;
      } else {
        drawH = H;
        drawW = H * imgRatio;
      }

      ctx.drawImage(this.customBgImage, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Darkening tint overlay for lyric readability
      ctx.fillStyle = `rgba(10, 12, 16, ${this.bgDim})`;
      ctx.fillRect(0, 0, W, H);
      return;
    }

    // Default when no custom image: Deep breathing radial gradient
    ctx.save();
    ctx.translate(panX * 0.4, panY * 0.4);
    const grad = ctx.createRadialGradient(
      W * 0.5, H * 0.5, 50,
      W * 0.5, H * 0.5, Math.max(W, H) * (0.8 * scale + beatEffect * 2.5)
    );
    grad.addColorStop(0, '#151928');
    grad.addColorStop(0.5, '#0b0d18');
    grad.addColorStop(1, '#05060a');
    ctx.fillStyle = grad;
    ctx.fillRect(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2);
    ctx.restore();
  }

  parseColorRgb(colorStr, defaultRgb = [100, 255, 218]) {
    if (!colorStr) return defaultRgb;
    if (colorStr.startsWith('#')) {
      let c = colorStr.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      if (!isNaN(num)) {
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
      }
    }
    return defaultRgb;
  }

  drawOverlayEffect(ctx, W, H, beatPulse, dt) {
    const effect = this.overlayType || this.bgType || 'particles';
    if (effect === 'none') return;

    const cfg = this.overlayConfig || {
      speed: 1.0,
      direction: 'default',
      size: 1.0,
      opacity: 1.0,
      color: '#64ffda'
    };
    const speed = cfg.speed;
    const size = cfg.size;
    const opacity = cfg.opacity;
    const dir = cfg.direction;
    const partColor = cfg.color || this.accentColor || '#64ffda';
    const rgb = this.parseColorRgb(partColor, [100, 255, 218]);

    // 1. Rain on Glass Overlay
    if (effect === 'rain') {
      ctx.save();
      const alpha = Math.min(1, 0.45 * opacity);
      ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
      ctx.lineWidth = 1.6 * size;
      ctx.beginPath();

      let vx = -1 * speed;
      let vy = (1 + beatPulse) * speed;
      if (dir === 'down') { vx = 0; vy = (1 + beatPulse) * speed; }
      else if (dir === 'up') { vx = 0; vy = -(1 + beatPulse) * speed; }
      else if (dir === 'left') { vx = -12 * speed; vy = 3 * speed; }
      else if (dir === 'right') { vx = 12 * speed; vy = 3 * speed; }

      for (const r of this.rainDrops) {
        r.x += vx;
        r.y += r.speed * vy;

        if (vy > 0 && r.y > H) { r.y = -r.length * size; r.x = Math.random() * W; }
        else if (vy < 0 && r.y < -r.length * size) { r.y = H; r.x = Math.random() * W; }
        if (vx < 0 && r.x < 0) r.x = W;
        else if (vx > 0 && r.x > W) r.x = 0;

        const dropLen = r.length * size;
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + (vx * 2), r.y + (vy >= 0 ? dropLen : -dropLen));
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 2. Floating Dust Bokeh Particles Overlay
    if (effect === 'particles') {
      ctx.save();
      for (const p of this.particles) {
        let vx = p.speedX * speed;
        let vy = p.speedY * speed;

        if (dir === 'down') {
          vy = Math.abs(p.speedY) * 2.2 * speed;
        } else if (dir === 'up') {
          vy = -Math.abs(p.speedY) * 2.2 * speed;
        } else if (dir === 'left') {
          vx = -Math.abs(p.speedX + 0.6) * 2.0 * speed;
        } else if (dir === 'right') {
          vx = Math.abs(p.speedX + 0.6) * 2.0 * speed;
        }

        p.x += vx;
        p.y += vy;

        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;

        const radius = p.radius * size * (1 + beatPulse * 2.2);
        const pAlpha = Math.min(1, p.alpha * opacity);

        if (this.customParticleImage) {
          p.angle = (p.angle || 0) + (p.rotSpeed || 1) * dt * speed;
          const imgSize = (p.radius * 9 + 16) * size * (1 + beatPulse * 0.9);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.globalAlpha = pAlpha;
          ctx.shadowBlur = 8 * size;
          ctx.shadowColor = partColor;
          ctx.drawImage(this.customParticleImage, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${pAlpha})`;
          ctx.shadowBlur = 10 * size;
          ctx.shadowColor = partColor;
          ctx.fill();
        }
      }
      ctx.restore();
      return;
    }

    // 3. Starfield Hyperspace Overlay
    if (effect === 'starfield') {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      let starSpeed = (600 + beatPulse * 900) * dt * speed;
      if (dir === 'down') starSpeed = -starSpeed;

      for (const s of this.stars) {
        if (dir === 'left') {
          s.x -= starSpeed * 0.8;
          if (s.x < -W / 2) s.x = W / 2;
        } else if (dir === 'right') {
          s.x += starSpeed * 0.8;
          if (s.x > W / 2) s.x = -W / 2;
        } else {
          s.z -= starSpeed;
          if (s.z <= 0) {
            s.z = W;
            s.x = (Math.random() - 0.5) * W;
            s.y = (Math.random() - 0.5) * H;
          } else if (s.z > W) {
            s.z = 10;
          }
        }

        const k = 250 / s.z;
        const px = s.x * k;
        const py = s.y * k;

        if (px >= -W / 2 && px <= W / 2 && py >= -H / 2 && py <= H / 2) {
          const sSize = Math.max(0.8, (1 - s.z / W) * 3) * size;
          const sAlpha = Math.min(1, (1 - s.z / W) * 1.5) * opacity;
          ctx.beginPath();
          ctx.arc(px, py, sSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${sAlpha})`;
          ctx.shadowBlur = 6 * size;
          ctx.shadowColor = partColor;
          ctx.fill();
        }
      }
      ctx.restore();
      return;
    }

    // 4. Retro Synthwave Grid Overlay
    if (effect === 'synthwave-grid') {
      ctx.save();
      if (!this.customBgImage) {
        const sunY = H * 0.52;
        const sunR = Math.min(W, H) * 0.22 * size;
        const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
        sunGrad.addColorStop(0, '#ffbe0b');
        sunGrad.addColorStop(0.5, '#fb5607');
        sunGrad.addColorStop(1, '#ff006e');
        ctx.fillStyle = sunGrad;
        ctx.shadowColor = partColor;
        ctx.shadowBlur = (30 + beatPulse * 40) * size;
        ctx.beginPath();
        ctx.arc(W / 2, sunY, sunR, Math.PI, 0, false);
        ctx.fill();
      }

      ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.min(1, 0.45 * opacity)})`;
      ctx.lineWidth = 1.5 * size;
      this.gridOffset = (this.gridOffset + (40 + beatPulse * 80) * dt * speed) % 35;

      const horizonY = H * 0.56;
      const fovCenter = W / 2;
      for (let x = -W * 0.8; x <= W * 1.8; x += 70) {
        ctx.beginPath();
        ctx.moveTo(fovCenter, horizonY);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

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

    // 5. Audio Reactive Equalizer Bars Overlay
    if (effect === 'waveform') {
      this.drawWaveform(ctx, W, H, beatPulse, rgb, partColor);
      return;
    }
  }

  drawWaveform(ctx, W, H, beatPulse, rgb = [34, 211, 238], partColor = '#22d3ee') {
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

      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.25 + val * 0.65})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = partColor;

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

    const gSize = (this.glowSize !== undefined ? this.glowSize : 25);
    const gDensity = (this.glowDensity !== undefined ? this.glowDensity : 1.0);
    const activeGlowBlur = gSize === 0 ? 0 : (gSize * gDensity + (this.enableAudioReactive ? overallGlow * 0.7 * gDensity : 0));

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
      ctx.shadowBlur = activeGlowBlur;
      if (gDensity > 1.25 && gSize > 0) {
        this.wrapAndDrawText(ctx, text, x, y, maxWidth, fontSize * 1.3);
      }
      this.wrapAndDrawText(ctx, text, x, y, maxWidth, fontSize * 1.3);
      ctx.restore();
      ctx.restore();
      return;
    }

    // 2. STYLE: Pop & Beat Scale (Energetic / Phonk / Trap)
    if (this.animType === 'pop-bounce') {
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
      ctx.shadowBlur = activeGlowBlur * 1.2;

      if (gDensity > 1.25 && gSize > 0) {
        this.wrapAndDrawText(ctx, text, x, y, maxWidth, fontSize * 1.3);
      }
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
      ctx.shadowBlur = activeGlowBlur;

      if (gDensity > 1.25 && gSize > 0) {
        this.wrapAndDrawText(ctx, text, x, y + waveY, maxWidth, fontSize * 1.3);
      }
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
      ctx.shadowBlur = activeGlowBlur * 0.7;

      if (gDensity > 1.25 && gSize > 0) {
        this.wrapAndDrawText(ctx, partialText + cursor, x, y, maxWidth, fontSize * 1.3);
      }
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
      ctx.shadowBlur = activeGlowBlur;
      if (gDensity > 1.25 && gSize > 0) {
        this.wrapAndDrawText(ctx, text, x, y, maxWidth, fontSize * 1.3);
      }
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
    ctx.shadowBlur = activeGlowBlur;
    ctx.fillStyle = '#ffffff';

    if (gDensity > 1.25 && gSize > 0) {
      this.wrapAndDrawText(ctx, text, x, y + slideY, maxWidth, fontSize * 1.3);
    }
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
