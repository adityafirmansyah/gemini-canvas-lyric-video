/**
 * canvas-renderer.js
 * Master Single-Template Fluid Kinetic Lyric Video Engine:
 * - 3D Procedural WebGL Background via Three.js (Particle Waves, Ethereal Silk, Cyber Grid, Starfield)
 * - Fluid Kinetic Typography (Staggered liquid springs, per-word wave undulation, vocal pop focus)
 * - Strict Max <= 5 words chunking rule
 * - 100% Canvas Compositing for 60FPS Video Export and PNG Thumbnail Snapshot
 */

import { ThreeBackground } from './three-background.js?v=5.2';
import { LrcParser } from './lrc-parser.js?v=5.2';

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

    // 2. Fluid Kinetic Lyric & Typographic Collage Configuration
    this.fontFamily = "'Montserrat', sans-serif";
    this.baseFontSize = 56;
    this.textColor = '#121212';
    this.accentColor = '#F5B010'; // Solar Golden Yellow from attached image
    this.glowSize = 0;
    this.glowDensity = 1.0;
    this.maxWordsPerChunk = 4; // Strictly <= 5 words!
    this.motionStyle = 'poster-collage'; // 'poster-collage', 'hero-morph', 'liquid-spring', 'vocal-pop'
    this.wordDisplayMode = 'progressive-poster'; // 'progressive-poster', 'solo-flash', 'static-all'
    this.canvasTheme = 'poster-light'; // 'poster-light' (white background like image) or 'dark-studio'
    this.heroScale = 2.2;
    this.allowVerticalRotation = true;
    this.containerStyle = 'clean-glow'; // 'clean-glow', 'pill-badge', 'contrast-box', 'ambient-scrim'

    // Configure 3D Background for Poster Light mode
    if (this.threeBg) {
      this.threeBg.updateSettings({
        bgColor: '#FDFFFC',
        color: '#F5B010',
        waveHeight: 35
      });
    }

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

  setTheme(theme) {
    this.canvasTheme = theme;
    if (theme === 'poster-light') {
      this.textColor = '#121212';
      this.accentColor = '#F5B010';
      if (this.threeBg) {
        this.threeBg.updateSettings({
          bgColor: '#FDFFFC',
          color: '#F5B010',
          waveHeight: 35
        });
      }
    } else {
      this.textColor = '#ffffff';
      this.accentColor = '#F5B010';
      if (this.threeBg) {
        this.threeBg.updateSettings({
          bgColor: '#080B14',
          color: '#F5B010',
          waveHeight: 45
        });
      }
    }
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

    const isSolo = (this.wordDisplayMode === 'solo-flash');
    const useCollage = (this.motionStyle === 'poster-collage' || this.motionStyle === 'hero-morph');

    if (isSolo) {
      this.renderSoloWord({
        ctx,
        text: chunk.text,
        chunkWords: chunk.words,
        centerX: W / 2,
        centerY: posterY,
        maxWidth: W * (this.aspectRatio === '9:16' ? 0.88 : 0.85),
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
    } else if (useCollage) {
      this.renderTypographicCollage({
        ctx,
        text: chunk.text,
        chunkWords: chunk.words,
        centerX: W / 2,
        centerY: posterY,
        maxWidth: W * (this.aspectRatio === '9:16' ? 0.88 : 0.84),
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
    } else {
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
    }

    ctx.restore();
  }

  /**
   * Solo Word Engine (Viral Single-Word Poster Flash):
   * Displays exactly ONE word at a time in massive, high-contrast poster typography,
   * alternating between Solar Yellow (#F5B010) and Solid Black (#121212) with vertical/horizontal tilt!
   */
  renderSoloWord({ ctx, text, chunkWords, centerX, centerY, maxWidth, baseSize, progress, inTime, currentTime, chunkStart, chunkDuration, isPausedAtStart, beatPulse, overallGlow }) {
    const isUpper = this.badgeConfig ? this.badgeConfig.uppercase !== false : true;
    const displayText = isUpper ? text.toUpperCase() : text;
    const words = displayText.split(/\s+/).filter(Boolean);
    const totalWords = words.length;
    if (totalWords === 0) return;

    // 1. Determine active word index from real AI timestamps
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
          activeWordIdx = j;
          break;
        }
      }
      if (activeWordIdx === -1) {
        if (currentTime < chunkWords[0].start) activeWordIdx = 0;
        else activeWordIdx = totalWords - 1;
      }
    } else {
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

    const wordText = words[activeWordIdx];
    if (!wordText) return;

    // Time calculations for single word entrance
    let wordInTime = 1.0;
    let wordDur = 0.5;

    if (hasWordTimestamps) {
      const w = chunkWords[activeWordIdx];
      wordDur = Math.max(0.12, w.end - w.start);
      wordInTime = isPausedAtStart ? 1.0 : Math.max(0, currentTime - w.start);
    } else {
      const wordWeights = words.map(w => Math.max(1, w.length));
      const totalWeight = wordWeights.reduce((a, b) => a + b, 0) || 1;
      wordDur = Math.max(0.15, chunkDuration * (wordWeights[activeWordIdx] / totalWeight));
      wordInTime = isPausedAtStart ? 1.0 : (inTime % wordDur);
    }

    const enterP = Math.min(1, wordInTime / 0.22);
    // Punchy elastic spring arrival
    const springBounce = Math.sin(enterP * Math.PI) * 0.16;
    const enterScale = 0.82 + (enterP * 0.18) + springBounce;
    const enterAlpha = enterP;

    // Fluid organic micro-float breathing
    const waveFloatY = Math.sin(this.animTime * 2.8 + activeWordIdx * 1.5) * (4.5 * (1 + beatPulse * 0.5));
    const waveRot = Math.cos(this.animTime * 2.0 + activeWordIdx) * 0.012;

    const isLight = this.canvasTheme === 'poster-light';

    // Style variation per word:
    // Alternate between Solar Yellow (#F5B010) and Solid Black (#121212) or White (#FFFFFF)
    const isHeroColor = (activeWordIdx % 2 === 1) || (wordText.length >= 6);
    let color = isHeroColor ? this.accentColor : (isLight ? '#121212' : '#FFFFFF');

    // Orientation:
    // If vertical rotation enabled, rotate selected words by 90 deg to break visual monotony!
    let angle = 0;
    const allowVert = this.allowVerticalRotation !== false && this.aspectRatio !== '9:16';
    if (allowVert && (activeWordIdx % 3 === 2) && wordText.length >= 4 && wordText.length <= 8) {
      angle = (activeWordIdx % 2 === 0 ? 1 : -1) * (Math.PI / 2);
    }

    // Font size: MASSIVE viral impact!
    let fontSize = Math.round(baseSize * (this.heroScale || 2.2) * 1.45);
    ctx.font = `900 ${fontSize}px ${this.fontFamily}`;

    // Fit check
    let measuredW = ctx.measureText(wordText).width;
    const maxBound = (angle !== 0 ? this.targetHeight * 0.72 : maxWidth * 0.88);
    if (measuredW > maxBound) {
      fontSize = Math.max(48, Math.floor(fontSize * (maxBound / measuredW)));
      ctx.font = `900 ${fontSize}px ${this.fontFamily}`;
      measuredW = ctx.measureText(wordText).width;
    }

    const finalScale = enterScale * (1.0 + beatPulse * 0.14);

    ctx.save();
    ctx.translate(centerX, centerY + waveFloatY);
    ctx.rotate(angle + waveRot);
    ctx.scale(finalScale, finalScale);
    ctx.globalAlpha = (ctx.globalAlpha || 1.0) * enterAlpha;

    ctx.fillStyle = color;
    if (isHeroColor) {
      ctx.shadowColor = isLight ? 'rgba(245, 176, 16, 0.45)' : this.accentColor;
      ctx.shadowBlur = isLight ? 14 : 28;
    } else {
      ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)';
      ctx.shadowBlur = 8;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(wordText, 0, 0);

    // If on dark mode and hero color, multi-pass for dense radiance
    if (!isLight && isHeroColor && this.glowDensity > 1.2) {
      ctx.fillText(wordText, 0, 0);
    }

    ctx.restore();
  }

  /**
   * Typographic Poster Collage Engine (Word Cloud Image Replica):
   * Features giant golden yellow hero focal word + interlocking vertical and horizontal words,
   * with fluid spring physics and active singing word spotlights.
   */
  renderTypographicCollage({ ctx, text, chunkWords, centerX, centerY, maxWidth, baseSize, progress, inTime, currentTime, chunkStart, chunkDuration, isPausedAtStart, beatPulse, overallGlow }) {
    const isUpper = this.badgeConfig ? this.badgeConfig.uppercase !== false : true; // uppercase by default for poster impact
    const displayText = isUpper ? text.toUpperCase() : text;
    const words = displayText.split(/\s+/).filter(Boolean);
    const totalWords = words.length;
    if (totalWords === 0) return;

    // 1. Determine active word index from real AI timestamps
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
          activeWordIdx = j;
          break;
        }
      }
      if (activeWordIdx === -1) {
        if (currentTime < chunkWords[0].start) activeWordIdx = 0;
        else activeWordIdx = totalWords - 1;
      }
    } else {
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

    // 2. Select Hero Word Index
    let heroIdx = 0;
    if (this.motionStyle === 'hero-morph') {
      heroIdx = activeWordIdx;
    } else {
      // In poster-collage: Longest word anchors the center as the hero (like CREATIVE'S in image)
      let maxLen = -1;
      for (let j = 0; j < totalWords; j++) {
        if (words[j].length > maxLen) {
          maxLen = words[j].length;
          heroIdx = j;
        }
      }
    }

    const heroWord = words[heroIdx];
    const isLight = this.canvasTheme === 'poster-light';

    // 3. Size and Measure Hero Word
    let heroFontSize = Math.round(baseSize * (this.heroScale || 2.2));
    ctx.font = `900 ${heroFontSize}px ${this.fontFamily}`;
    let heroWidth = ctx.measureText(heroWord).width;

    // Clamp hero width to 82% of maxWidth so it never clips
    const heroMaxW = maxWidth * 0.82;
    if (heroWidth > heroMaxW) {
      heroFontSize = Math.max(48, Math.floor(heroFontSize * (heroMaxW / heroWidth)));
      ctx.font = `900 ${heroFontSize}px ${this.fontFamily}`;
      heroWidth = ctx.measureText(heroWord).width;
    }
    const heroHeight = heroFontSize * 0.85;

    // 4. Size for Supporting Words
    const supFontSize = Math.max(26, Math.round(heroFontSize * 0.38));

    // 5. Assign Roles to Other Words
    const otherIndices = [];
    for (let j = 0; j < totalWords; j++) {
      if (j !== heroIdx) otherIndices.push(j);
    }

    const allowVert = this.allowVerticalRotation !== false && this.aspectRatio !== '9:16';
    const roleCycle = allowVert
      ? ['top', 'left_vert', 'right_vert', 'bottom']
      : ['top', 'bottom', 'top', 'bottom'];

    const slots = {};
    slots[heroIdx] = { role: 'hero', x: centerX, y: centerY, angle: 0, fontSize: heroFontSize };

    for (let k = 0; k < otherIndices.length; k++) {
      const idx = otherIndices[k];
      const role = roleCycle[k % roleCycle.length];
      let x = centerX, y = centerY, angle = 0, sz = supFontSize;

      if (role === 'hero') {
        x = centerX; y = centerY; angle = 0; sz = heroFontSize;
      } else if (role === 'top') {
        x = centerX - heroWidth * 0.15 + (k * 20);
        y = centerY - heroHeight * 0.62 - (supFontSize * 0.55);
        angle = 0;
        sz = Math.round(supFontSize * 1.08);
      } else if (role === 'bottom') {
        x = centerX + heroWidth * 0.12 - (k * 20);
        y = centerY + heroHeight * 0.62 + (supFontSize * 0.55);
        angle = 0;
        sz = Math.round(supFontSize * 1.08);
      } else if (role === 'left_vert') {
        x = centerX - heroWidth / 2 - (supFontSize * 0.7) - 16;
        y = centerY;
        angle = -Math.PI / 2; // rotated -90 deg
        sz = supFontSize;
      } else if (role === 'right_vert') {
        x = centerX + heroWidth / 2 + (supFontSize * 0.7) + 16;
        y = centerY;
        angle = Math.PI / 2; // rotated 90 deg
        sz = supFontSize;
      }

      slots[idx] = { role, x, y, angle, fontSize: sz };
    }

    // Precalculate word start and end times
    const wordStartTimes = [];
    const wordEndTimes = [];
    if (hasWordTimestamps) {
      for (let j = 0; j < totalWords; j++) {
        wordStartTimes.push(chunkWords[j].start);
        wordEndTimes.push(chunkWords[j].end);
      }
    } else {
      const wordWeights = words.map(w => Math.max(1, w.length));
      const totalWeight = wordWeights.reduce((a, b) => a + b, 0) || 1;
      let elapsedWeight = 0;
      for (let j = 0; j < totalWords; j++) {
        const wStart = chunkStart + chunkDuration * (elapsedWeight / totalWeight);
        const wEnd = wStart + chunkDuration * (wordWeights[j] / totalWeight);
        wordStartTimes.push(wStart);
        wordEndTimes.push(wEnd);
        elapsedWeight += wordWeights[j];
      }
    }

    // 6. Draw each word in its collage slot (Progressive reveal: words appear ONE BY ONE as sung!)
    for (let i = 0; i < totalWords; i++) {
      const wStart = wordStartTimes[i];
      const wEnd = wordEndTimes[i];

      // Key: If word has not started yet, do not draw it! (Only revealed one by one following timing)
      if (this.wordDisplayMode === 'progressive-poster' && !isPausedAtStart && currentTime < wStart) {
        continue;
      }

      const wordText = words[i];
      const slot = slots[i];
      const isActive = (currentTime >= wStart && currentTime <= wEnd);
      const isPast = (currentTime > wEnd);

      // Staggered liquid entrance animation calculated from when THIS word starts!
      const wordInTime = isPausedAtStart ? 1.0 : Math.max(0, currentTime - wStart);
      const enterDur = 0.26;
      const p = Math.min(1.0, wordInTime / enterDur);

      let enterScale = 1.0;
      let enterY = 0;
      let enterAlpha = 1.0;

      if (p < 1.0) {
        const bounce = Math.sin(p * Math.PI) * 0.16;
        enterScale = 0.75 + (p * 0.25) + bounce;
        enterY = (1.0 - p) * 18;
        enterAlpha = p;
      }

      // Organic micro-floating breathing wave
      const waveFloatY = Math.sin(this.animTime * 2.2 + i * 1.3) * (3.0 * (1 + beatPulse * 0.4));
      const waveRot = Math.cos(this.animTime * 1.8 + i * 0.9) * 0.012;

      // Color and Scale styling
      let finalScale = enterScale;
      let color = this.textColor;
      let shadowBlur = 0;
      let shadowColor = 'transparent';

      if (slot.role === 'hero') {
        // Hero word is prominent in Solar Yellow!
        color = this.accentColor;
        if (isActive) {
          finalScale *= (1.12 + beatPulse * 0.14);
          shadowBlur = isLight ? 10 : 24;
          shadowColor = isLight ? 'rgba(245, 176, 16, 0.45)' : this.accentColor;
        } else {
          finalScale *= (1.0 + beatPulse * 0.05);
        }
      } else {
        // Supporting words: Pop in Solar Yellow when sung, settle in Solid Black/White!
        if (isActive) {
          finalScale *= (1.18 + beatPulse * 0.12);
          color = this.accentColor; // Spotlight active word in yellow!
          shadowBlur = isLight ? 8 : 20;
          shadowColor = isLight ? 'rgba(245, 176, 16, 0.4)' : this.accentColor;
        } else {
          // Settles into solid crisp black (#111111) like reference image
          color = isLight ? '#111111' : '#FFFFFF';
        }
      }

      ctx.save();
      ctx.translate(slot.x, slot.y + enterY + waveFloatY);
      ctx.rotate(slot.angle + waveRot);
      ctx.scale(finalScale, finalScale);
      ctx.globalAlpha = (ctx.globalAlpha || 1.0) * enterAlpha;

      ctx.font = `900 ${slot.fontSize}px ${this.fontFamily}`;
      ctx.fillStyle = color;
      if (shadowBlur > 0) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw word
      ctx.fillText(wordText, 0, 0);

      // If active and glow density high, multi-pass
      if (isActive && this.glowDensity > 1.25 && isLight === false) {
        ctx.fillText(wordText, 0, 0);
      }

      ctx.restore();
    }
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

    // Precalculate word start and end times
    const wordStartTimes = [];
    const wordEndTimes = [];
    if (hasWordTimestamps) {
      for (let j = 0; j < totalWords; j++) {
        wordStartTimes.push(chunkWords[j].start);
        wordEndTimes.push(chunkWords[j].end);
      }
    } else {
      const wordWeights = words.map(w => Math.max(1, w.length));
      const totalWeight = wordWeights.reduce((a, b) => a + b, 0) || 1;
      let elapsedWeight = 0;
      for (let j = 0; j < totalWords; j++) {
        const wStart = chunkStart + chunkDuration * (elapsedWeight / totalWeight);
        const wEnd = wStart + chunkDuration * (wordWeights[j] / totalWeight);
        wordStartTimes.push(wStart);
        wordEndTimes.push(wEnd);
        elapsedWeight += wordWeights[j];
      }
    }

    for (let i = 0; i < totalWords; i++) {
      const m = wordMetrics[i];
      const wStart = wordStartTimes[i];
      const wEnd = wordEndTimes[i];

      // Progressive reveal in line mode: word only appears once its sung timestamp arrives!
      if (this.wordDisplayMode === 'progressive-poster' && !isPausedAtStart && currentTime < wStart) {
        curX += m.width + spaceW;
        continue;
      }

      const wordCenterX = curX + m.width / 2;

      // 1. Organic Staggered Liquid-Spring Entrance from when THIS word was sung!
      const wordInTime = isPausedAtStart ? 1.0 : Math.max(0, currentTime - wStart);
      const enterDur = 0.26;
      const p = Math.min(1.0, wordInTime / enterDur);

      let enterScale = 1.0;
      let enterY = 0;
      let enterAlpha = 1.0;

      if (p < 1.0) {
        // Liquid spring curve with overshoot bounce (Damping ~0.78)
        const bounce = Math.sin(p * Math.PI) * 0.16;
        enterScale = 0.8 + (p * 0.2) + bounce;
        enterY = (1.0 - p) * 18;
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
