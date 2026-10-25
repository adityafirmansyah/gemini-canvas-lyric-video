/**
 * app.js
 * Main Controller coordinating Audio, Gemini AI, Canvas Rendering, and Video Export.
 */

import { AudioManager } from './audio-player.js';
import { GeminiService } from './gemini.js';
import { CanvasRenderer } from './canvas-renderer.js';
import { VideoRecorder } from './recorder.js';

// DOM Elements
const canvas = document.getElementById('lyric-canvas');
const audioPlayer = document.getElementById('audio-player');
const dropZone = document.getElementById('drop-zone');
const audioInput = document.getElementById('audio-input');
const audioInfo = document.getElementById('audio-info');
const trackNameEl = document.getElementById('track-name');
const trackDurationEl = document.getElementById('track-duration');

// Gemini Controls
const geminiKeyInput = document.getElementById('gemini-key');
const toggleKeyBtn = document.getElementById('toggle-key-visibility');
const geminiModelSelect = document.getElementById('gemini-model');
const optionalLyricsInput = document.getElementById('optional-lyrics');
const btnSyncGemini = document.getElementById('btn-sync-gemini');
const aiStatus = document.getElementById('ai-status');
const lyricsDataInput = document.getElementById('lyrics-data');
const btnSampleLyrics = document.getElementById('btn-sample-lyrics');

// Style Controls
const presetCards = document.querySelectorAll('.preset-card');
const fontFamilySelect = document.getElementById('font-family');
const fontSizeRange = document.getElementById('font-size');
const textColorInput = document.getElementById('text-color');
const accentColorInput = document.getElementById('accent-color');
const bgTypeSelect = document.getElementById('bg-type');
const customImgGroup = document.getElementById('custom-img-group');
const customBgInput = document.getElementById('custom-bg-input');
const toggleAudioReactive = document.getElementById('toggle-audio-reactive');

// Header Ratio Buttons
const ratioButtons = document.querySelectorAll('.ratio-btn');

// Playback Bar
const btnPlayPause = document.getElementById('btn-play-pause');
const seekSlider = document.getElementById('seek-slider');
const currentTimeDisplay = document.getElementById('current-time-display');
const totalTimeDisplay = document.getElementById('total-time-display');
const volumeSlider = document.getElementById('volume-slider');

// Export Controls
const exportResSelect = document.getElementById('export-res');
const btnStartRecord = document.getElementById('btn-start-record');
const btnStopRecord = document.getElementById('btn-stop-record');
const recordProgress = document.getElementById('record-progress');
const progressFill = document.getElementById('progress-fill');
const recordStatusText = document.getElementById('record-status');

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Instances
const audioManager = new AudioManager(audioPlayer);
const geminiService = new GeminiService();
const renderer = new CanvasRenderer(canvas);
let recorder = null;

let currentAudioFile = null;

// Helpers
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function showAiStatus(message, type = 'info') {
  aiStatus.className = `status-msg ${type}`;
  aiStatus.textContent = message;
  aiStatus.classList.remove('hidden');
}

// 1. Initialize API Key from storage
geminiKeyInput.value = geminiService.getSavedApiKey();
geminiKeyInput.addEventListener('input', (e) => {
  geminiService.saveApiKey(e.target.value);
});

toggleKeyBtn.addEventListener('click', () => {
  geminiKeyInput.type = geminiKeyInput.type === 'password' ? 'text' : 'password';
});

// 2. Tab Navigation
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  });
});

// 3. Audio File Handling
function handleAudioFile(file) {
  if (!file) return;
  currentAudioFile = file;

  trackNameEl.textContent = file.name;
  audioInfo.classList.remove('hidden');
  audioManager.loadAudioFile(file);

  audioPlayer.onloadedmetadata = () => {
    trackDurationEl.textContent = formatTime(audioPlayer.duration);
    totalTimeDisplay.textContent = formatTime(audioPlayer.duration);
    seekSlider.max = audioPlayer.duration;
    seekSlider.disabled = false;
    btnPlayPause.disabled = false;
    btnSyncGemini.disabled = false;
    btnStartRecord.disabled = false;
  };
}

audioInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleAudioFile(e.target.files[0]);
  }
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    handleAudioFile(e.dataTransfer.files[0]);
  }
});

// 4. Gemini Auto-Sync
btnSyncGemini.addEventListener('click', async () => {
  const apiKey = geminiKeyInput.value.trim();
  const model = geminiModelSelect.value;
  const refLyrics = optionalLyricsInput.value;

  if (!apiKey) {
    showAiStatus('Please provide a Gemini API key first.', 'error');
    return;
  }
  if (!currentAudioFile) {
    showAiStatus('Please upload an audio file first.', 'error');
    return;
  }

  try {
    btnSyncGemini.disabled = true;
    showAiStatus('Analyzing audio with Gemini Multimodal AI...', 'info');

    const syncedLyrics = await geminiService.syncLyrics({
      apiKey,
      model,
      audioFile: currentAudioFile,
      referenceLyrics: refLyrics,
      onProgress: (status) => showAiStatus(status, 'info')
    });

    lyricsDataInput.value = JSON.stringify(syncedLyrics, null, 2);
    renderer.setLyrics(syncedLyrics);
    showAiStatus(`Synced ${syncedLyrics.length} lines successfully!`, 'success');
  } catch (err) {
    console.error(err);
    showAiStatus(err.message, 'error');
  } finally {
    btnSyncGemini.disabled = false;
  }
});

// 5. Lyrics Input & Parser
function parseAndApplyLyrics() {
  try {
    const raw = lyricsDataInput.value.trim();
    if (!raw) {
      renderer.setLyrics([]);
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      renderer.setLyrics(parsed);
    }
  } catch (err) {
    // If typing incomplete JSON, don't crash
  }
}
lyricsDataInput.addEventListener('input', parseAndApplyLyrics);

// Sample Lyrics
btnSampleLyrics.addEventListener('click', () => {
  const sample = [
    { start: 0.0, end: 4.5, text: "Neon reflections in the rainy night" },
    { start: 4.8, end: 8.5, text: "Lost in the rhythm of the city lights" },
    { start: 8.8, end: 12.2, text: "Drifting through echoes of an old memory" },
    { start: 12.5, end: 17.0, text: "Finding peace where we're meant to be" }
  ];
  lyricsDataInput.value = JSON.stringify(sample, null, 2);
  parseAndApplyLyrics();
});

// 6. Visual Style Controls & Presets
const presets = {
  lofi: {
    font: "'Outfit', sans-serif",
    fontSize: 52,
    textColor: '#ffffff',
    accentColor: '#93c5fd',
    bgType: 'particles'
  },
  cyberpunk: {
    font: "'Space Grotesk', sans-serif",
    fontSize: 56,
    textColor: '#ffffff',
    accentColor: '#ff007f',
    bgType: 'waveform'
  },
  minimal: {
    font: "'Playfair Display', serif",
    fontSize: 48,
    textColor: '#f1f5f9',
    accentColor: '#ffffff',
    bgType: 'gradient'
  },
  karaoke: {
    font: "'Outfit', sans-serif",
    fontSize: 58,
    textColor: '#ffffff',
    accentColor: '#22d3ee',
    bgType: 'gradient'
  }
};

presetCards.forEach(card => {
  card.addEventListener('click', () => {
    presetCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    const p = presets[card.getAttribute('data-preset')];
    if (p) {
      renderer.fontFamily = p.font;
      renderer.baseFontSize = p.fontSize;
      renderer.textColor = p.textColor;
      renderer.accentColor = p.accentColor;
      renderer.bgType = p.bgType;

      // Sync form inputs
      fontFamilySelect.value = p.font;
      fontSizeRange.value = p.fontSize;
      textColorInput.value = p.textColor;
      accentColorInput.value = p.accentColor;
      bgTypeSelect.value = p.bgType;
      customImgGroup.classList.toggle('hidden', p.bgType !== 'custom-img');
    }
  });
});

fontFamilySelect.addEventListener('change', (e) => renderer.fontFamily = e.target.value);
fontSizeRange.addEventListener('input', (e) => renderer.baseFontSize = parseInt(e.target.value));
textColorInput.addEventListener('input', (e) => renderer.textColor = e.target.value);
accentColorInput.addEventListener('input', (e) => renderer.accentColor = e.target.value);

bgTypeSelect.addEventListener('change', (e) => {
  renderer.bgType = e.target.value;
  customImgGroup.classList.toggle('hidden', e.target.value !== 'custom-img');
});

customBgInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => renderer.setCustomImage(img);
  }
});

toggleAudioReactive.addEventListener('change', (e) => {
  renderer.enableAudioReactive = e.target.checked;
});

// Aspect Ratio Switcher
ratioButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    ratioButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const ratio = btn.getAttribute('data-ratio');
    renderer.setAspectRatio(ratio, exportResSelect.value);
  });
});

exportResSelect.addEventListener('change', () => {
  const activeRatioBtn = document.querySelector('.ratio-btn.active');
  const ratio = activeRatioBtn ? activeRatioBtn.getAttribute('data-ratio') : '16:9';
  renderer.setAspectRatio(ratio, exportResSelect.value);
});

// 7. Playback Controls
btnPlayPause.addEventListener('click', () => {
  if (audioManager.isPlaying) {
    audioManager.pause();
    btnPlayPause.textContent = '▶';
  } else {
    audioManager.play();
    btnPlayPause.textContent = '⏸';
  }
});

seekSlider.addEventListener('input', (e) => {
  const time = parseFloat(e.target.value);
  audioManager.seek(time);
  currentTimeDisplay.textContent = formatTime(time);
});

volumeSlider.addEventListener('input', (e) => {
  audioPlayer.volume = parseFloat(e.target.value);
});

audioPlayer.addEventListener('timeupdate', () => {
  seekSlider.value = audioPlayer.currentTime;
  currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
});

audioPlayer.addEventListener('ended', () => {
  btnPlayPause.textContent = '▶';
  if (recorder && recorder.isRecording) {
    recorder.stop();
  }
});

// 8. Recording / Export Engine
btnStartRecord.addEventListener('click', () => {
  if (!currentAudioFile) return;

  const audioStream = audioManager.getAudioStream();
  recorder = new VideoRecorder({ canvas, audioStream });

  // Reset to start of track
  audioManager.seek(0);
  audioManager.play();
  btnPlayPause.textContent = '⏸';

  recorder.start({
    fps: 60,
    onStop: (blob) => {
      btnStartRecord.classList.remove('hidden');
      btnStopRecord.classList.add('hidden');
      recordProgress.classList.add('hidden');
      const filename = `${currentAudioFile.name.replace(/\.[^/.]+$/, "")}_lyric_video.webm`;
      recorder.downloadBlob(blob, filename);
    }
  });

  btnStartRecord.classList.add('hidden');
  btnStopRecord.classList.remove('hidden');
  recordProgress.classList.remove('hidden');
});

btnStopRecord.addEventListener('click', () => {
  if (recorder && recorder.isRecording) {
    audioManager.pause();
    recorder.stop();
  }
});

// 9. Main Animation Loop (60 FPS)
let lastTimestamp = performance.now();
function animate(now) {
  const dt = (now - lastTimestamp) / 1000;
  lastTimestamp = now;

  const metrics = audioManager.getAudioMetrics();
  renderer.updateState({
    currentTime: audioManager.currentTime,
    audioMetrics: metrics
  });

  renderer.render(dt);

  // Update recording progress if active
  if (recorder && recorder.isRecording && audioPlayer.duration) {
    const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressFill.style.width = `${pct}%`;
    recordStatusText.textContent = `Recording ${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
  }

  requestAnimationFrame(animate);
}

// Initial sample lyrics setup
btnSampleLyrics.click();
requestAnimationFrame(animate);