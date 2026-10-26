/**
 * app.js
 * Main Controller coordinating Audio, Multi-AI Service, LRC Parser, Canvas Rendering, and Video Export.
 */

import { AudioManager } from './audio-player.js?v=2.3';
import { AiService } from './ai-service.js?v=2.3';
import { LrcParser } from './lrc-parser.js?v=2.3';
import { CanvasRenderer } from './canvas-renderer.js?v=2.3';
import { VideoRecorder } from './recorder.js?v=2.3';

// DOM Elements
const canvas = document.getElementById('lyric-canvas');
const audioPlayer = document.getElementById('audio-player');
const dropZone = document.getElementById('drop-zone');
const audioInput = document.getElementById('audio-input');
const audioInfo = document.getElementById('audio-info');
const trackNameEl = document.getElementById('track-name');
const trackDurationEl = document.getElementById('track-duration');

// Sync Method Selector (AI vs LRC)
const syncMethodRadios = document.querySelectorAll('input[name="sync-method"]');
const methodAiPanel = document.getElementById('method-ai-panel');
const methodLrcPanel = document.getElementById('method-lrc-panel');
const lrcInput = document.getElementById('lrc-input');
const lrcDropZone = document.getElementById('lrc-drop-zone');

// AI Provider Controls
const aiProviderSelect = document.getElementById('ai-provider');
const aiModelSelect = document.getElementById('ai-model');
const groupCustomUrl = document.getElementById('group-custom-url');
const customEndpointUrl = document.getElementById('custom-endpoint-url');
const groupApiKey = document.getElementById('group-api-key');
const labelApiKey = document.getElementById('label-api-key');
const apiKeyLink = document.getElementById('api-key-link');
const apiKeyInput = document.getElementById('api-key');
const btnTestKey = document.getElementById('btn-test-key');
const keyTestResult = document.getElementById('key-test-result');
const toggleKeyBtn = document.getElementById('toggle-key-visibility');
const optionalLyricsInput = document.getElementById('optional-lyrics');
const btnSyncAi = document.getElementById('btn-sync-ai');
const aiStatus = document.getElementById('ai-status');

// Lyrics Editor
const lyricsDataInput = document.getElementById('lyrics-data');
const btnSampleLyrics = document.getElementById('btn-sample-lyrics');

// Style Controls
const presetCards = document.querySelectorAll('.preset-card');
const animTypeSelect = document.getElementById('anim-type');
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
const aiService = new AiService();
const renderer = new CanvasRenderer(canvas);
let recorder = null;
let currentAudioFile = null;

// Helper: Format Seconds to mm:ss
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

// 1. Multi-Provider Configuration
const providerModels = {
  gemini: [
    { value: 'gemini-3.8-flash', label: 'gemini-3.8-flash (Latest & Fast Multimodal Audio)' },
    { value: 'gemini-3.8-pro', label: 'gemini-3.8-pro (Highest Reasoning)' },
    { value: 'gemini-1.5-flash', label: 'gemini-1.5-flash (Legacy)' },
    { value: 'gemini-1.5-pro', label: 'gemini-1.5-pro (Legacy)' }
  ],
  groq: [
    { value: 'whisper-large-v3-turbo', label: 'whisper-large-v3-turbo (Ultra Fast)' },
    { value: 'whisper-large-v3', label: 'whisper-large-v3 (Maximum Accuracy)' }
  ],
  openai: [
    { value: 'whisper-1', label: 'whisper-1 (Industry Standard ASR)' }
  ],
  custom: [
    { value: 'whisper-1', label: 'whisper-1 / Custom Model' }
  ]
};

function updateProviderUI() {
  const provider = aiProviderSelect.value;

  // Populate models
  aiModelSelect.innerHTML = '';
  const models = providerModels[provider] || [];
  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.value;
    opt.textContent = m.label;
    aiModelSelect.appendChild(opt);
  });

  // Custom Endpoint input
  groupCustomUrl.classList.toggle('hidden', provider !== 'custom');

  // Key label, link & placeholder
  if (provider === 'gemini') {
    labelApiKey.textContent = 'Google Gemini API Key';
    apiKeyInput.placeholder = 'AIzaSy...';
    if (apiKeyLink) {
      apiKeyLink.href = 'https://aistudio.google.com/app/apikey';
      apiKeyLink.textContent = 'Get Free Gemini Key ↗';
      apiKeyLink.classList.remove('hidden');
    }
  } else if (provider === 'groq') {
    labelApiKey.textContent = 'Groq API Key';
    apiKeyInput.placeholder = 'gsk_...';
    if (apiKeyLink) {
      apiKeyLink.href = 'https://console.groq.com/keys';
      apiKeyLink.textContent = 'Get Free Groq Key ↗';
      apiKeyLink.classList.remove('hidden');
    }
  } else if (provider === 'openai') {
    labelApiKey.textContent = 'OpenAI API Key';
    apiKeyInput.placeholder = 'sk-...';
    if (apiKeyLink) {
      apiKeyLink.href = 'https://platform.openai.com/api-keys';
      apiKeyLink.textContent = 'Get OpenAI Key ↗';
      apiKeyLink.classList.remove('hidden');
    }
  } else {
    labelApiKey.textContent = 'Authorization Key (Optional)';
    apiKeyInput.placeholder = 'Bearer token or empty';
    if (apiKeyLink) {
      apiKeyLink.classList.add('hidden');
    }
  }

  apiKeyInput.value = aiService.getSavedApiKey(provider);
  if (keyTestResult) {
    keyTestResult.classList.add('hidden');
    keyTestResult.textContent = '';
  }
}

aiProviderSelect.addEventListener('change', updateProviderUI);
apiKeyInput.addEventListener('input', (e) => {
  aiService.saveApiKey(aiProviderSelect.value, e.target.value);
  if (keyTestResult) {
    keyTestResult.classList.add('hidden');
  }
});
toggleKeyBtn.addEventListener('click', () => {
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});

if (btnTestKey) {
  const runTest = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const provider = aiProviderSelect.value;
    const apiKey = apiKeyInput.value.trim();
    const customUrl = customEndpointUrl.value.trim();

    btnTestKey.textContent = '⏳ Checking...';
    btnTestKey.disabled = true;

    keyTestResult.className = 'key-status-badge loading';
    keyTestResult.textContent = `Connecting to ${provider.toUpperCase()} servers... ⏳`;
    keyTestResult.classList.remove('hidden');

    try {
      const successMsg = await aiService.testApiKey({ provider, apiKey, customUrl });
      keyTestResult.className = 'key-status-badge success';
      keyTestResult.textContent = successMsg;
      btnTestKey.textContent = '✓ OK';
    } catch (err) {
      keyTestResult.className = 'key-status-badge error';
      keyTestResult.textContent = `Error: ${err.message}`;
      btnTestKey.textContent = '✗ Error';
    } finally {
      setTimeout(() => {
        btnTestKey.textContent = '⚡ Test';
        btnTestKey.disabled = false;
      }, 3500);
    }
  };

  btnTestKey.addEventListener('click', runTest);
  btnTestKey.addEventListener('touchend', runTest);
}

updateProviderUI();

// 2. Sync Method Switcher (AI vs LRC)
syncMethodRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    const isAi = e.target.value === 'ai';
    methodAiPanel.classList.toggle('hidden', !isAi);
    methodLrcPanel.classList.toggle('hidden', isAi);
  });
});

// LRC / SRT Drop handling
function handleLrcFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    let parsedLyrics = [];

    if (file.name.endsWith('.srt')) {
      parsedLyrics = LrcParser.parseSRT(content);
    } else {
      parsedLyrics = LrcParser.parseLRC(content);
    }

    if (parsedLyrics.length > 0) {
      lyricsDataInput.value = JSON.stringify(parsedLyrics, null, 2);
      renderer.setLyrics(parsedLyrics);
      showAiStatus(`Imported ${parsedLyrics.length} lines from ${file.name}!`, 'success');
    } else {
      showAiStatus('Could not find timestamps in this file. Ensure it is valid LRC or SRT format.', 'error');
    }
  };
  reader.readAsText(file);
}

lrcInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) handleLrcFile(e.target.files[0]);
});

lrcDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  lrcDropZone.classList.add('dragover');
});
lrcDropZone.addEventListener('dragleave', () => lrcDropZone.classList.remove('dragover'));
lrcDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  lrcDropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) handleLrcFile(e.dataTransfer.files[0]);
});

// 3. Tab Navigation
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  });
});

// 4. Audio File Handling
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
    btnSyncAi.disabled = false;
    btnStartRecord.disabled = false;
  };
}

audioInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) handleAudioFile(e.target.files[0]);
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) handleAudioFile(e.dataTransfer.files[0]);
});

// 5. AI Audio Sync Dispatcher
btnSyncAi.addEventListener('click', async () => {
  const provider = aiProviderSelect.value;
  const apiKey = apiKeyInput.value.trim();
  const model = aiModelSelect.value;
  const customUrl = customEndpointUrl.value.trim();
  const refLyrics = optionalLyricsInput.value;

  if (!apiKey && provider !== 'custom') {
    showAiStatus(`Please enter your ${provider.toUpperCase()} API key first.`, 'error');
    return;
  }
  if (!currentAudioFile) {
    showAiStatus('Please upload an audio track first.', 'error');
    return;
  }

  try {
    btnSyncAi.disabled = true;
    showAiStatus(`Detecting audio and aligning lyrics using ${provider.toUpperCase()} (${model})...`, 'info');

    const syncedLyrics = await aiService.syncLyrics({
      provider,
      apiKey,
      model,
      customUrl,
      audioFile: currentAudioFile,
      referenceLyrics: refLyrics,
      onProgress: (status) => showAiStatus(status, 'info')
    });

    lyricsDataInput.value = JSON.stringify(syncedLyrics, null, 2);
    renderer.setLyrics(syncedLyrics);
    showAiStatus(`Successfully aligned ${syncedLyrics.length} lyric lines!`, 'success');
  } catch (err) {
    console.error(err);
    showAiStatus(err.message, 'error');
  } finally {
    btnSyncAi.disabled = false;
  }
});

// 6. Lyrics Input & Parser
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
    // Typing incomplete JSON
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

// 7. Visual Style Controls & Presets
const presets = {
  lofi: {
    font: "'Outfit', sans-serif",
    fontSize: 52,
    textColor: '#ffffff',
    accentColor: '#93c5fd',
    bgType: 'particles',
    animType: 'smooth-slide'
  },
  cyberpunk: {
    font: "'Space Grotesk', sans-serif",
    fontSize: 56,
    textColor: '#ffffff',
    accentColor: '#ff007f',
    bgType: 'waveform',
    animType: 'cyber-glitch'
  },
  synthwave: {
    font: "'Montserrat', sans-serif",
    fontSize: 54,
    textColor: '#ffffff',
    accentColor: '#ffbe0b',
    bgType: 'synthwave-grid',
    animType: 'pop-bounce'
  },
  rainy: {
    font: "'Playfair Display', serif",
    fontSize: 50,
    textColor: '#e2e8f0',
    accentColor: '#38bdf8',
    bgType: 'rain',
    animType: 'floating-wave'
  },
  minimal: {
    font: "'Cinzel', serif",
    fontSize: 48,
    textColor: '#f8fafc',
    accentColor: '#ffffff',
    bgType: 'gradient',
    animType: 'smooth-slide'
  },
  karaoke: {
    font: "'Outfit', sans-serif",
    fontSize: 58,
    textColor: '#ffffff',
    accentColor: '#22d3ee',
    bgType: 'gradient',
    animType: 'karaoke-fill'
  },
  phonk: {
    font: "'Space Grotesk', sans-serif",
    fontSize: 58,
    textColor: '#ffffff',
    accentColor: '#ef4444',
    bgType: 'waveform',
    animType: 'pop-bounce'
  },
  sakura: {
    font: "'Outfit', sans-serif",
    fontSize: 52,
    textColor: '#fff1f2',
    accentColor: '#f472b6',
    bgType: 'particles',
    animType: 'floating-wave'
  },
  academia: {
    font: "'Cinzel', serif",
    fontSize: 48,
    textColor: '#fef3c7',
    accentColor: '#d97706',
    bgType: 'gradient',
    animType: 'typewriter'
  },
  cosmic: {
    font: "'Space Grotesk', sans-serif",
    fontSize: 52,
    textColor: '#f8fafc',
    accentColor: '#c084fc',
    bgType: 'starfield',
    animType: 'floating-wave'
  },
  retro: {
    font: "'Courier Prime', monospace",
    fontSize: 46,
    textColor: '#fef08a',
    accentColor: '#f97316',
    bgType: 'particles',
    animType: 'typewriter'
  },
  acid: {
    font: "'Montserrat', sans-serif",
    fontSize: 56,
    textColor: '#ffffff',
    accentColor: '#84cc16',
    bgType: 'waveform',
    animType: 'cyber-glitch'
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
      renderer.animType = p.animType;

      // Sync form inputs
      fontFamilySelect.value = p.font;
      fontSizeRange.value = p.fontSize;
      textColorInput.value = p.textColor;
      accentColorInput.value = p.accentColor;
      bgTypeSelect.value = p.bgType;
      animTypeSelect.value = p.animType;
      customImgGroup.classList.toggle('hidden', p.bgType !== 'custom-img');
    }
  });
});

animTypeSelect.addEventListener('change', (e) => renderer.animType = e.target.value);
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

// 8. Playback Controls
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

// 9. Recording / Video Export
btnStartRecord.addEventListener('click', () => {
  if (!currentAudioFile) return;

  const audioStream = audioManager.getAudioStream();
  recorder = new VideoRecorder({ canvas, audioStream });

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

// 10. Thumbnail Snapshot Export
function captureThumbnail() {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const trackBase = currentAudioFile ? currentAudioFile.name.replace(/\.[^/.]+$/, "") : "lyric_canvas";
    const filename = `${trackBase}_thumbnail_${Date.now()}.png`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }, 'image/png');
}

const btnExportThumbnail = document.getElementById('btn-export-thumbnail');
const btnSnapshotBar = document.getElementById('btn-snapshot-bar');
if (btnExportThumbnail) btnExportThumbnail.addEventListener('click', captureThumbnail);
if (btnSnapshotBar) btnSnapshotBar.addEventListener('click', captureThumbnail);

// 11. Main Animation Loop (60 FPS)
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

  if (recorder && recorder.isRecording && audioPlayer.duration) {
    const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressFill.style.width = `${pct}%`;
    recordStatusText.textContent = `Recording ${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
  }

  requestAnimationFrame(animate);
}

// Initialize sample lyrics
btnSampleLyrics.click();
requestAnimationFrame(animate);
