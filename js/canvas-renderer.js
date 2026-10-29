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
    this.customBgVideo = null;

    // Subtitle & Box Badge Design configuration
    this.subtitleConfig = {
      style: 'none', // 'none', 'boxed-banner', 'alternating-badge', 'word-badges', 'karaoke-word-pop', 'outline-only'
      boxColor: '#c9fa53',
      boxTextColor: '#000000',
      boxRadius: 4,
      boxPadding: 14,
      uppercase: true,
      borderColor: '#000000'
    };

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

    // HyperFrames-inspired layout engine configuration
    this.autoFitFont = true;        // Auto-shrink font so wrapped lines never overflow hero zone
    this.showSafeGuides = false;    // Preview-only YouTube / Shorts UI safe-area overlay
    this.fgCutoutImage = null;      // Foreground subject layer (Text Behind Subject depth layering)
    this.groundTheme = 'biennale-yellow'; // HyperFrames Frame.md ground preset
    this._fitCache = new Map();     // Fit scale cache keyed by font|ratio|width|text

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

  setCustomVideo(videoElement) {
    this.customBgVideo = videoElement;
  }

  setCustomParticleImage(imgElement) {
    this.customParticleImage = imgElement;
  }

  setFgCutoutImage(imgElement) {
    this.fgCutoutImage = imgElement;
    this._fitCache.clear();
  }

  /**
   * HyperFrames 'fitTextFontSize' equivalent:
   * Given an animation style, a candidate font size, and a width budget, run a binary
   * search over wrapping cost and return the smallest scale (>= minScale) that keeps
   * every wrapped line inside maxWidth. Max 8 iteration steps like HF's step-2 loop.
   */
  fitLineScale(ctx, text, maxWidth, candidateSize, style) {
    const key = `${this.fontFamily}|${this.aspectRatio}|${Math.round(maxWidth)}|${text.length}|${text.split(' ').length}|${style}`;
    if (this._fitCache.has(key)) return this._fitCache.get(key);

    const minScale = 0.55;
    let scale = 1.0;

    if (this.autoFitFont) {
      const testLines = (size) => {
        ctx.font = `700 ${size}px ${this.fontFamily}`;
        let longest = 0;
        const words = text.split(' ');
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
          const w = ctx.measureText(currentLine + ' ' + words[i]).width;
          if (w < maxWidth) currentLine += ' ' + words[i];
          else {
            longest = Math.max(longest, ctx.measureText(currentLine).width);
            currentLine = words[i];
          }
        }
        longest = Math.max(longest, ctx.measureText(currentLine).width);
        return longest;
      };

      // Smallest scale that still fits? No — LARGEST scale that still fits.
      // Feasibility is monotonic decreasing in scale: bigger = overflows.
      // Binary search: if mid fits, answer is >= mid (hi=mid); else lo=mid. Return hi.
      let lo = minScale, hi = 1.0;
      if (testLines(candidateSize) <= maxWidth * 0.98) {
        scale = 1.0; // Already fits at full size: no shrink needed (hero impact).
      } else {
        for (let i = 0; i < 8; i++) {
          const mid = (lo + hi) / 2;
          const size = candidateSize * mid;
          if (testLines(size) <= maxWidth * 0.98) hi = mid;
          else lo = mid;
          if (hi - lo < 0.04) break;
        }
        scale = hi;
      }
    }

    this._fitCache.set(key, scale);
    return scale;
  }

  setBgConfig(newConfig) {
    this.bgConfig = { ...this.bgConfig, ...newConfig };
  }

  setSubtitleConfig(newConfig) {
    this.subtitleConfig = { ...this.subtitleConfig, ...newConfig };
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
    this.drawLyrics(ctx, W, H, beatPulse, overallGlow, this.getPosterY());

    // 4. Foreground Subject Layer ("Text Behind Subject" depth layering)
    //    Attention zone (HF): the subject sits immovable in the lowest 25% of the frame.
    if (this.fgCutoutImage) {
      this.drawForegroundSubject(ctx, W, H, beatPulse);
    }

    // 5. Preview-only UI Safe Area Guides (does NOT burn into exported video)
    if (this.showSafeGuides) {
      this.drawSafeAreaGuides(ctx, W, H, this.getPosterY());
    }
  }

  /** HyperFrames attention/hero band: portrait keeps empty space where platform UI lives. */
  getPosterY() {
    if (this.aspectRatio === '9:16') return this.targetHeight * 0.325; // ~626/1920: above Shorts UI
    if (this.aspectRatio === '1:1') return this.targetHeight * 0.44;
    return this.targetHeight * 0.5; // 16:9 centered
  }

  /** Draws the uploaded PNG cutout pinned to the bottom center (portrait: 55% height max). */
  drawForegroundSubject(ctx, W, H, beatPulse) {
    const img = this.fgCutoutImage;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    const maxH = H * (this.aspectRatio === '9:16' ? 0.52 : 0.62);
    let dh = Math.min(maxH, H * 0.9);
    let dw = dh * (iw / ih);
    if (dw > W * 0.9) { dw = W * 0.9; dh = dw * (ih / iw); }

    const breath = 1 + beatPulse * 0.45;
    const cx = W / 2;
    const cy = H - dh / 2;

    ctx.save();
    const g = ctx.createLinearGradient(0, H - dh * 0.5, 0, H);
    g.addColorStop(0, 'rgba(5, 6, 10, 0)');
    g.addColorStop(1, 'rgba(5, 6, 10, 0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H - dh * 0.55, W, dh * 0.55);

    ctx.translate(cx, cy);
    ctx.scale(breath, breath);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  /**
   * HyperFrames projector frame: UI sits in a 14.3% margin on every side (60/420 in
   * their 420p viewport). Red band = YouTube Shorts/TikTok action UI, amber = title-safe.
   */
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

    ctx.fillStyle = 'rgba(255, 193, 7, 0.22)';
    const th = H * 0.085;
    ctx.fillRect(W * 0.06, m, W * 0.75, th);
    ctx.fillStyle = 'rgba(255, 193, 7, 0.9)';
    ctx.textAlign = 'left';
    ctx.font = `600 ${Math.round(H * 0.026)}px ${this.fontFamily}`;
    ctx.fillText('@channel • #hashtag', W * 0.08, m + th / 2);

    ctx.strokeStyle = 'rgba(94, 234, 212, 0.8)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, posterY - H * 0.09);
    ctx.lineTo(W, posterY - H * 0.09);
    ctx.moveTo(0, posterY + H * 0.09);
    ctx.lineTo(W, posterY + H * 0.09);
    ctx.stroke();

    ctx.fillStyle = 'rgba(94, 234, 212, 0.95)';
    ctx.font = `600 ${Math.round(H * 0.022)}px ${this.fontFamily}`;
    ctx.fillText('LYRIC HERO ZONE', W * 0.04, posterY - H * 0.105);
    ctx.restore();
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

    const bgMedia = this.customBgVideo || this.customBgImage;
    if (bgMedia) {
      const isVideo = !!this.customBgVideo;
      ctx.save();
      ctx.translate(W / 2 + panX, H / 2 + panY);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);

      const mediaW = isVideo ? (bgMedia.videoWidth || W) : (bgMedia.naturalWidth || bgMedia.width || W);
      const mediaH = isVideo ? (bgMedia.videoHeight || H) : (bgMedia.naturalHeight || bgMedia.height || H);
      const imgRatio = (mediaW && mediaH) ? (mediaW / mediaH) : (W / H);
      const canvasRatio = W / H;
      let drawW, drawH;

      if (canvasRatio > imgRatio) {
        drawW = W;
        drawH = W / imgRatio;
      } else {
        drawH = H;
        drawW = H * imgRatio;
      }

      ctx.drawImage(bgMedia, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Darkening tint overlay for lyric readability
      ctx.fillStyle = `rgba(10, 12, 16, ${this.bgDim})`;
      ctx.fillRect(0, 0, W, H);
      return;
    }

    // Default when no custom media: Render HyperFrames official Frame.md ground layers
    ctx.save();
    ctx.translate(panX * 0.4, panY * 0.4);

    const theme = this.groundTheme || 'biennale-yellow';

    if (theme === 'biennale-yellow') {
      // Warm parchment ground (#E9E5DB)
      ctx.fillStyle = '#E9E5DB';
      ctx.fillRect(0, 0, W, H);

      // Signature Solar Yellow Sun Bloom (42-70% of frame)
      const sunX = W * 0.48 + panX * 0.3;
      const sunY = H * 0.45 + panY * 0.3;
      const sunR = Math.min(W, H) * (0.42 * scale + beatEffect * 1.5);
      const sunBloom = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
      sunBloom.addColorStop(0, 'rgba(241, 238, 46, 0.82)'); // #F1EE2E
      sunBloom.addColorStop(0.35, 'rgba(248, 243, 155, 0.55)');
      sunBloom.addColorStop(0.7, 'rgba(240, 218, 124, 0.22)');
      sunBloom.addColorStop(1, 'rgba(233, 229, 219, 0)');
      ctx.fillStyle = sunBloom;
      ctx.fillRect(0, 0, W, H);

      // Subordinate Ember counter-bloom in opposite corner
      const embBloom = ctx.createRadialGradient(W * 0.88, H * 0.82, 0, W * 0.88, H * 0.82, Math.min(W, H) * 0.35);
      embBloom.addColorStop(0, 'rgba(226, 107, 74, 0.18)'); // #E26B4A
      embBloom.addColorStop(1, 'rgba(233, 229, 219, 0)');
      ctx.fillStyle = embBloom;
      ctx.fillRect(0, 0, W, H);

      // 1px Hairline structural margins
      ctx.strokeStyle = 'rgba(27, 37, 102, 0.18)';
      ctx.lineWidth = 1;
      const m = W * 0.04;
      ctx.strokeRect(m, m, W - m * 2, H - m * 2);

    } else if (theme === 'blockframe') {
      // Crisp off-white ground (#FFFDF5)
      ctx.fillStyle = '#FFFDF5';
      ctx.fillRect(0, 0, W, H);

      // 4px Black border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, W - 40, H - 40);

      // Accent pastel block tile
      ctx.fillStyle = 'rgba(254, 144, 232, 0.18)';
      ctx.fillRect(W * 0.65, 40, W * 0.3, H * 0.45);

    } else if (theme === 'blue-professional') {
      // Warm cream canvas (#FDFCEB) + cobalt accent
      ctx.fillStyle = '#FDFCEB';
      ctx.fillRect(0, 0, W, H);

      const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 50, W * 0.5, H * 0.5, Math.max(W, H) * 0.65);
      grad.addColorStop(0, 'rgba(30, 43, 250, 0.08)');
      grad.addColorStop(1, 'rgba(253, 252, 235, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(30, 43, 250, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(30, 30, W - 60, H - 60);

    } else if (theme === 'bold-poster') {
      // Stark white (#FFFFFF) with tomato red poster double border
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#D8000F';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, W - 48, H - 48);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(32, 32, W - 64, H - 64);

    } else if (theme === 'broadside') {
      // Ink-black ground (#111111) with fire-orange plane (#E85D26)
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, W, H);

      const fireBloom = ctx.createRadialGradient(W * 0.3, H * 0.7, 0, W * 0.3, H * 0.7, Math.max(W, H) * 0.55);
      fireBloom.addColorStop(0, 'rgba(232, 93, 38, 0.28)');
      fireBloom.addColorStop(1, 'rgba(17, 17, 17, 0)');
      ctx.fillStyle = fireBloom;
      ctx.fillRect(0, 0, W, H);

    } else if (theme === 'capsule') {
      // Sun-bleached cream (#F5F5F0) with candy coral glow
      ctx.fillStyle = '#F5F5F0';
      ctx.fillRect(0, 0, W, H);

      const cBloom = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.min(W, H) * 0.5);
      cBloom.addColorStop(0, 'rgba(232, 93, 78, 0.15)');
      cBloom.addColorStop(0.5, 'rgba(197, 181, 224, 0.12)');
      cBloom.addColorStop(1, 'rgba(245, 245, 240, 0)');
      ctx.fillStyle = cBloom;
      ctx.fillRect(0, 0, W, H);

    } else if (theme === 'cartesian') {
      // Warm stone (#EDE8E0) with 1px taupe hairline grid
      ctx.fillStyle = '#EDE8E0';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(138, 129, 120, 0.2)';
      ctx.lineWidth = 1;
      const step = 80;
      for (let x = 0; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

    } else if (theme === 'cobalt-grid') {
      // Cream paper (#F0EBDE) with risograph cobalt grid (#1F2BE0)
      ctx.fillStyle = '#F0EBDE';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(31, 43, 224, 0.14)';
      ctx.lineWidth = 1;
      const rStep = 45;
      for (let x = 0; x < W; x += rStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += rStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

    } else if (theme === 'code-editorial') {
      // Deep warm-navy surface (#181715)
      ctx.fillStyle = '#181715';
      ctx.fillRect(0, 0, W, H);

      const coralGrad = ctx.createRadialGradient(W * 0.7, H * 0.3, 0, W * 0.7, H * 0.3, Math.min(W, H) * 0.6);
      coralGrad.addColorStop(0, 'rgba(204, 120, 92, 0.22)');
      coralGrad.addColorStop(1, 'rgba(24, 23, 21, 0)');
      ctx.fillStyle = coralGrad;
      ctx.fillRect(0, 0, W, H);

    } else if (theme === 'coral') {
      // Bold coral magazine (#E85D5D) with ink black split
      ctx.fillStyle = '#E85D5D';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#1A1A1A';
      ctx.beginPath();
      ctx.moveTo(W * 0.62, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, H);
      ctx.lineTo(W * 0.48, H);
      ctx.closePath();
      ctx.fill();

    } else if (theme === 'creative-mode') {
      // Warm cream (#EFE9D9) with 4px ink borders
      ctx.fillStyle = '#EFE9D9';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#0F0F0F';
      ctx.lineWidth = 6;
      ctx.strokeRect(25, 25, W - 50, H - 50);

    } else if (theme === 'daisy-days') {
      // Sunny pastel garden (#F5F0E6)
      const dGrad = ctx.createLinearGradient(0, 0, W, H);
      dGrad.addColorStop(0, '#F5F0E6');
      dGrad.addColorStop(0.5, '#FDE68A');
      dGrad.addColorStop(1, '#A8E6CF');
      ctx.fillStyle = dGrad;
      ctx.fillRect(0, 0, W, H);

    } else if (theme === 'editorial-forest') {
      // Deep botanical forest green (#2E4A2A) with blush pink atmosphere
      ctx.fillStyle = '#243A21';
      ctx.fillRect(0, 0, W, H);

      const fBloom = ctx.createRadialGradient(W * 0.5, H * 0.5, 50, W * 0.5, H * 0.5, Math.max(W, H) * 0.65);
      fBloom.addColorStop(0, 'rgba(232, 156, 177, 0.18)');
      fBloom.addColorStop(1, 'rgba(36, 58, 33, 0)');
      ctx.fillStyle = fBloom;
      ctx.fillRect(0, 0, W, H);

    } else {
      // Highway POV / Default deep breathing asphalt gradient
      const grad = ctx.createRadialGradient(
        W * 0.5, H * 0.5, 50,
        W * 0.5, H * 0.5, Math.max(W, H) * (0.8 * scale + beatEffect * 2.5)
      );
      grad.addColorStop(0, '#151928');
      grad.addColorStop(0.5, '#0b0d18');
      grad.addColorStop(1, '#05060a');
      ctx.fillStyle = grad;
      ctx.fillRect(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2);
    }

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

  drawLyrics(ctx, W, H, beatPulse, overallGlow, posterY) {
    if (!this.lyrics || this.lyrics.length === 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = `600 32px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Ready. Upload music & sync lyrics.', W / 2, posterY || H / 2);
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
          y: posterY || H / 2,
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
    const centerY = posterY || H / 2;
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

    // HyperFrames measured defaults: fast moves 0.3-0.6s, words stagger 60-120ms,
    // springs with 0.7-0.85 damping read premium, 0.5-0.6 playful; landed title = dead still.
    const STAGGER = 0.09;
    const inTime = Math.max(0.001, t - start);
    this._inTime = inTime; // read by wrapAndDrawText for word-level stagger timing
    const isWordLevelPerLine = ['word-stack', 'pop-bounce', 'cyber-glitch', 'smooth-slide'].includes(this.animType);
    const springIn = (r, ov = Math.min(1, 0.9 * r)) => Math.min(1.15, 1 + ov * 0.13);

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

    // 6. STYLE: Progressive Word Stacking (Highway Drive / Viral Stacker)
    if (this.animType === 'word-stack') {
      const allWords = text.split(' ');
      const N = allWords.length;
      const visibleCount = Math.min(N, Math.max(1, Math.floor(progress * N) + 1));
      const partialText = allWords.slice(0, visibleCount).join(' ');

      const wordProgress = (progress * N) % 1;
      const punchBounce = (wordProgress < 0.35) ? (1.0 + Math.sin((wordProgress / 0.35) * Math.PI) * 0.08) : 1.0;

      const fontSize = baseSize * 1.15 * punchBounce * (1.0 + beatPulse * 0.35);
      ctx.font = `900 ${fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.textColor || '#ffffff';
      ctx.shadowColor = this.accentColor;
      ctx.shadowBlur = activeGlowBlur;

      this.wrapAndDrawText(ctx, partialText, x, y, maxWidth, fontSize * 1.15, progress);
      ctx.restore();
      return;
    }

    // 7. DEFAULT: Smooth Slide-Up with Ease-Out
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
      this.wrapAndDrawText(ctx, text, x, y + slideY, maxWidth, fontSize * 1.3, progress);
    }
    this.wrapAndDrawText(ctx, text, x, y + slideY, maxWidth, fontSize * 1.3, progress);
    ctx.restore();
  }

    /**
     * HF replacement for wrapText + fillText: measure, wrap, and paint in one call.
     * entryStagger (seconds): words pop in with a premium spring (HF 0.7-0.9 damping,
     * overshoot <=15%) displaced STAGGER apart; at 1.5+ steps in the word is dead still.
     */
    wrapAndDrawText(ctx, rawText, x, y, maxWidth, lineHeight, animProgress = 1.0, entryStagger = 0) {
      this._internalWrapText(ctx, rawText, x, y, maxWidth, lineHeight, animProgress, (drawWord, wid, wordX, lineY_) => {
        let alpha = 1, scale = 1, dy = 0;
        if (entryStagger > 0) {
          const wi = entryStagger * wid;
          const r = Math.min(1, Math.max(0.001, ((this._inTime || 1) - wi) / 0.38));
          if (r >= 1) { alpha = 1; scale = 1; }
          else {
            alpha = r;
            const ov = Math.sin(Math.min(1, r) * Math.PI) * 0.12;
            scale = 1 + ov;
            dy = (1 - r) * 14;
          }
        }
        if (alpha > 0.01) {
          const was = ctx.globalAlpha;
          ctx.globalAlpha = was * alpha;
          drawWord(wordX, lineY_ - dy, scale);
          ctx.globalAlpha = was;
        }
      });
    }

  _internalWrapText(ctx, rawText, x, y, maxWidth, lineHeight, animProgress, wordPainter = null) {
    const sub = this.subtitleConfig || { style: 'none' };
    const style = sub.style || 'none';
    const isUpper = sub.uppercase !== false && style !== 'none';
    const text = isUpper ? rawText.toUpperCase() : rawText;
    const badgey = style !== 'none' && style !== 'outline-only' && style !== 'highway-3d';

    const words = text.split(' ');
    const lines = [];
    const lineWordIdx = [];
    let currentLine = words[0] || '';
    let lineStartIdx = 0;

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        lineWordIdx.push([lineStartIdx, i]);
        lineStartIdx = i;
        currentLine = word;
      }
    }
    lines.push(currentLine);
    lineWordIdx.push([lineStartIdx, words.length]);

    const baseAlign = ctx.textAlign;
    const startY = y - ((lines.length - 1) * lineHeight) / 2;

    const paintUnstyled = () => {
      ctx.textAlign = 'center';
      for (let li = 0; li < lines.length; li++) {
        const lineY = startY + li * lineHeight;
        const [ws, _we] = lineWordIdx[li];
        const wordsInLine = words.slice(ws, lineWordIdx[li][1]);
        const widths = wordsInLine.map(w => ctx.measureText(w).width);
        const spaceW = ctx.measureText(' ').width;
        const totalW = widths.reduce((a, b) => a + b, 0) + spaceW * (wordsInLine.length - 1);
        let wx = x - totalW / 2;
        const linePainter = (dx, dy, scale) => {
          const wasAlign = ctx.textAlign; ctx.textAlign = 'center';
          if (scale !== 1) {
            ctx.save();
            ctx.translate(dx, dy);
            ctx.scale(scale, scale);
            ctx.fillText(wordsInLine.join(' '), 0, 0);
            ctx.restore();
          } else {
            ctx.fillText(wordsInLine.join(' '), dx, dy);
          }
          ctx.textAlign = wasAlign;
        };
        if (wordPainter && !badgey) {
          for (let k = 0; k < wordsInLine.length; k++) {
            const cxk = wx + widths[k] / 2;
            wordPainter((dx, dy, scale) => {
              const wasAlign = ctx.textAlign; ctx.textAlign = 'center';
              if (scale !== 1) {
                ctx.save(); ctx.translate(dx, dy); ctx.scale(scale, scale);
                ctx.fillText(wordsInLine[k], 0, 0);
                ctx.restore();
              } else {
                ctx.fillText(wordsInLine[k], dx, dy);
              }
              ctx.textAlign = wasAlign;
            }, ws + k, cxk, lineY);
            wx += widths[k] + spaceW;
          }
        } else {
          linePainter(x, lineY, 1);
        }
      }
      ctx.textAlign = baseAlign;
    };

    // Mode A: Standard text (no box badge)
    if (style === 'none') {
      paintUnstyled();
      return;
    }

    // Mode B: Outline-only (Comic / TikTok bold outline)
    if (style === 'outline-only') {
      ctx.save();
      ctx.strokeStyle = sub.borderColor || '#000000';
      ctx.lineWidth = Math.max(4, lineHeight * 0.12);
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      for (let i = 0; i < lines.length; i++) {
        ctx.strokeText(lines[i], x, startY + i * lineHeight);
        ctx.fillText(lines[i], x, startY + i * lineHeight);
      }
      ctx.restore();
      return;
    }

    // Mode Highway 3D: Perspective tilt with deep asphalt ambient shadow & windshield road vibration
    if (style === 'highway-3d') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const roadShakeX = (Math.sin(this.animTime * 28) + Math.cos(this.animTime * 42)) * 1.2;
      const roadShakeY = (Math.cos(this.animTime * 32) + Math.sin(this.animTime * 51)) * 1.2;

      ctx.translate(x + roadShakeX, y + roadShakeY);
      ctx.transform(1, -0.042, 0.015, 1, 0, 0);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 7;
      ctx.fillStyle = this.textColor || '#ffffff';

      const lineStartY = -((lines.length - 1) * lineHeight) / 2;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 0, lineStartY + i * lineHeight);
      }
      ctx.restore();
      return;
    }

    const pad = sub.boxPadding !== undefined ? sub.boxPadding : 14;
    const radius = sub.boxRadius !== undefined ? sub.boxRadius : 4;
    const boxColor = sub.boxColor || '#c9fa53';
    const boxTextColor = sub.boxTextColor || '#000000';

    // Mode C: Solid Highlight Box Banner behind full line
    if (style === 'boxed-banner') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const textWidth = ctx.measureText(line).width;
        const boxW = textWidth + pad * 2.2;
        const boxH = lineHeight * 0.9 + pad * 0.5;
        const lineY = startY + i * lineHeight;

        ctx.fillStyle = boxColor;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 12;
        this.drawRoundedRect(ctx, x - boxW / 2, lineY - boxH / 2, boxW, boxH, radius);

        ctx.shadowBlur = 0;
        ctx.fillStyle = boxTextColor;
        ctx.fillText(line, x, lineY);
      }
      ctx.restore();
      return;
    }

    // Mode D: Word Badges, Alternating Badges (like user's image), or Active Word Pop
    if (style === 'word-badges' || style === 'alternating-badge' || style === 'karaoke-word-pop') {
      ctx.save();
      ctx.textBaseline = 'middle';

      let totalGlobalWords = 0;
      for (const l of lines) totalGlobalWords += l.split(' ').length;
      let wordIndexTracker = 0;

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        const lineWords = line.split(' ');
        const lineY = startY + lineIdx * lineHeight;

        const badgeGap = 8;
        const wordMetrics = lineWords.map(w => ({
          text: w,
          w: ctx.measureText(w).width + pad * 1.5,
          h: lineHeight * 0.9 + pad * 0.4
        }));

        const totalLineWidth = wordMetrics.reduce((sum, m) => sum + m.w, 0) + (lineWords.length - 1) * badgeGap;
        let curX = x - totalLineWidth / 2;

        for (let wIdx = 0; wIdx < lineWords.length; wIdx++) {
          const m = wordMetrics[wIdx];
          const curWordGlobalIdx = wordIndexTracker + wIdx;

          let currentBgColor = boxColor;
          let currentTextColor = boxTextColor;
          let wordScale = 1.0;

          if (style === 'alternating-badge') {
            // Alternates between Lime Green badge & Black badge with Lime text (Reference Image aesthetic)
            if (curWordGlobalIdx % 2 === 1) {
              currentBgColor = '#0a0c10';
              currentTextColor = boxColor;
            } else {
              currentBgColor = boxColor;
              currentTextColor = boxTextColor;
            }
          } else if (style === 'karaoke-word-pop') {
            const activeWIdx = Math.min(totalGlobalWords - 1, Math.floor(animProgress * totalGlobalWords));
            if (curWordGlobalIdx === activeWIdx) {
              currentBgColor = boxColor;
              currentTextColor = boxTextColor;
              wordScale = 1.12;
            } else {
              currentBgColor = 'rgba(10, 12, 16, 0.65)';
              currentTextColor = '#ffffff';
            }
          }

          ctx.save();
          if (wordScale !== 1.0) {
            ctx.translate(curX + m.w / 2, lineY);
            ctx.scale(wordScale, wordScale);
            ctx.translate(-(curX + m.w / 2), -lineY);
          }

          ctx.fillStyle = currentBgColor;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
          ctx.shadowBlur = 10;
          this.drawRoundedRect(ctx, curX, lineY - m.h / 2, m.w, m.h, radius);

          ctx.shadowBlur = 0;
          ctx.fillStyle = currentTextColor;
          ctx.textAlign = 'center';
          ctx.fillText(m.text, curX + m.w / 2, lineY);
          ctx.restore();

          curX += m.w + badgeGap;
        }

        wordIndexTracker += lineWords.length;
      }

      ctx.restore();
      return;
    }
  }
}
