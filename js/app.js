/**
 * app.js (v4.1 Aura Studio)
 * Main Controller coordinating Audio, Three.js 3D Background, Fluid Kinetic Lyrics, and Video Recording.
 */

import { AudioManager } from './audio-player.js?v=4.1';
import { AiService } from './ai-service.js?v=4.1';
import { LrcParser } from './lrc-parser.js?v=4.1';
import { CanvasRenderer } from './canvas-renderer.js?v=4.1';
import { VideoRecorder } from './recorder.js?v=4.1';

// Canvas & Audio
const canvas = document.getElementById('lyric-canvas');
const audioPlayer = document.getElementById('audio-player');
const dropZone = document.getElementById('drop-zone');
const audioInput = document.getElementById('audio-input');
const audioInfo = document.getElementById('audio-info');
const trackNameEl = document.getElementById('track-name');
const trackDurationEl = document.getElementById('track-duration');

// Sync Method
const syncMethodRadios = document.querySelectorAll('input[name="sync-method"]');
const methodAiPanel = document.getElementById('method-ai-panel');
const methodLrcPanel = document.getElementById('method-lrc-panel');
const lrcInput = document.getElementById('lrc-input');
const lrcDropZone = document.getElementById('lrc-drop-zone');

// AI Settings
const aiProviderSelect = document.getElementById('ai-provider');
const aiModelSelect = document.getElementById('ai-model');
const groupCustomUrl = document.getElementById('group-custom-url');
const customEndpointUrl = document.getElementById('custom-endpoint-url');
const labelApiKey = document.getElementById('label-api-key');
const apiKeyLink = document.getElementById('api-key-link');
const apiKeyInput = document.getElementById('api-key');
const btnTestKey = document.getElementById('btn-test-key');
const keyTestResult = document.getElementById('key-test-result');
const toggleKeyBtn = document.getElementById('toggle-key-visibility');
const optionalLyricsInput = document.getElementById('optional-lyrics');
const btnSyncAi = document.getElementById('btn-sync-ai');
const aiStatus = document.getElementById('ai-status');

// Lyrics Data
const lyricsDataInput = document.getElementById('lyrics-data');
const btnSampleLyrics = document.getElementById('btn-sample-lyrics');

// 3D Background Controls
const threeStyleSelect = document.getElementById('three-style');
const threeColorInput = document.getElementById('three-color');
const threeBgColorInput = document.getElementById('three-bg-color');
const threeSpeedInput = document.getElementById('three-speed');
const threeSpeedVal = document.getElementById('three-speed-val');
const threeHeightInput = document.getElementById('three-height');
const threeHeightVal = document.getElementById('three-height-val');
const toggleAudioReactive = document.getElementById('toggle-audio-reactive');
const btnResetBg3D = document.getElementById('btn-reset-bg-3d');

// Fluid Kinetic Typography Controls
const lyricMotionStyleSelect = document.getElementById('lyric-motion-style');
const fontFamilySelect = document.getElementById('font-family');
const fontSizeRange = document.getElementById('font-size');
const fontSizeVal = document.getElementById('font-size-val');
const maxWordsRange = document.getElementById('max-words');
const maxWordsVal = document.getElementById('max-words-val');
const textColorInput = document.getElementById('text-color');
const accentColorInput = document.getElementById('accent-color');
const glowSizeInput = document.getElementById('glow-size');
const glowSizeVal = document.getElementById('glow-size-val');
const glowDensityInput = document.getElementById('glow-density');
const glowDensityVal = document.getElementById('glow-density-val');
const containerStyleSelect = document.getElementById('container-style');
const toggleUppercase = document.getElementById('toggle-uppercase');
const btnResetLyrics = document.getElementById('btn-reset-lyrics');

// Depth & Safe Guides
const toggleSafeGuides = document.getElementById('toggle-safe-guides');
const fgDropZone = document.getElementById('fg-drop-zone');
const fgInput = document.getElementById('fg-input');
const fgImgInfo = document.getElementById('fg-img-info');
const fgImgName = document.getElementById('fg-img-name');
const btnRemoveFgImg = document.getElementById('btn-remove-fg-img');

// Aspect Ratio
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
const btnExportThumbnail = document.getElementById('btn-export-thumbnail');
const btnSnapshotBar = document.getElementById('btn-snapshot-bar');

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Instances
const audioManager = new AudioManager(audioPlayer);
const aiService = new AiService();
const renderer = new CanvasRenderer(canvas);
let recorder = null;
let currentAudioFile = null;

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

// 1. AI Provider Setup
const providerModels = {
  gemini: [
    { value: 'gemini-3.8-flash', label: 'gemini-3.8-flash (Recommended)' },
    { value: 'gemini-3.8-pro', label: 'gemini-3.8-pro (Highest Reasoning)' },
    { value: 'gemini-1.5-flash', label: 'gemini-1.5-flash (Legacy)' }
  ],
  groq: [
    { value: 'whisper-large-v3-turbo', label: 'whisper-large-v3-turbo (Ultra Fast)' },
    { value: 'whisper-large-v3', label: 'whisper-large-v3 (Accurate)' }
  ],
  openai: [
    { value: 'whisper-1', label: 'whisper-1' }
  ],
  custom: [
    { value: 'whisper-1', label: 'Default / Custom Model' }
  ]
};

function updateProviderUI() {
  const provider = aiProviderSelect.value;
  aiModelSelect.innerHTML = '';
  (providerModels[provider] || []).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.value;
    opt.textContent = m.label;
    aiModelSelect.appendChild(opt);
  });

  groupCustomUrl.classList.toggle('hidden', provider !== 'custom');

  if (provider === 'gemini') {
    labelApiKey.textContent = 'Google Gemini API Key';
    apiKeyInput.placeholder = 'AIzaSy...';
    apiKeyLink.href = 'https://aistudio.google.com/app/apikey';
    apiKeyLink.textContent = 'Get Free Key ↗';
    apiKeyLink.classList.remove('hidden');
  } else if (provider === 'groq') {
    labelApiKey.textContent = 'Groq API Key';
    apiKeyInput.placeholder = 'gsk_...';
    apiKeyLink.href = 'https://console.groq.com/keys';
    apiKeyLink.textContent = 'Get Groq Key ↗';
    apiKeyLink.classList.remove('hidden');
  } else if (provider === 'openai') {
    labelApiKey.textContent = 'OpenAI API Key';
    apiKeyInput.placeholder = 'sk-...';
    apiKeyLink.href = 'https://platform.openai.com/api-keys';
    apiKeyLink.textContent = 'Get OpenAI Key ↗';
    apiKeyLink.classList.remove('hidden');
  } else {
    labelApiKey.textContent = 'Auth Token (Optional)';
    apiKeyInput.placeholder = 'Bearer token or empty';
    apiKeyLink.classList.add('hidden');
  }

  apiKeyInput.value = aiService.getSavedApiKey(provider);
  keyTestResult.classList.add('hidden');
}

aiProviderSelect.addEventListener('change', updateProviderUI);
apiKeyInput.addEventListener('input', (e) => {
  aiService.saveApiKey(aiProviderSelect.value, e.target.value);
  keyTestResult.classList.add('hidden');
});
toggleKeyBtn.addEventListener('click', () => {
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});

if (btnTestKey) {
  btnTestKey.addEventListener('click', async () => {
    const provider = aiProviderSelect.value;
    const apiKey = apiKeyInput.value.trim();
    const customUrl = customEndpointUrl.value.trim();

    btnTestKey.textContent = '⏳';
    btnTestKey.disabled = true;
    keyTestResult.className = 'key-status-badge loading';
    keyTestResult.textContent = `Testing ${provider.toUpperCase()}...`;
    keyTestResult.classList.remove('hidden');

    try {
      const msg = await aiService.testApiKey({ provider, apiKey, customUrl });
      keyTestResult.className = 'key-status-badge success';
      keyTestResult.textContent = msg;
      btnTestKey.textContent = '✓ OK';
    } catch (err) {
      keyTestResult.className = 'key-status-badge error';
      keyTestResult.textContent = `Error: ${err.message}`;
      btnTestKey.textContent = '✗';
    } finally {
      setTimeout(() => {
        btnTestKey.textContent = '⚡ Test';
        btnTestKey.disabled = false;
      }, 3500);
    }
  });
}
updateProviderUI();

// 2. Sync Method Switcher
syncMethodRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    const isAi = e.target.value === 'ai';
    methodAiPanel.classList.toggle('hidden', !isAi);
    methodLrcPanel.classList.toggle('hidden', isAi);
  });
});

function handleLrcFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    let parsed = file.name.endsWith('.srt') ? LrcParser.parseSRT(content) : LrcParser.parseLRC(content);
    if (parsed.length > 0) {
      lyricsDataInput.value = JSON.stringify(parsed, null, 2);
      renderer.setLyrics(parsed);
      showAiStatus(`Imported ${parsed.length} lines from ${file.name}! Automatically chunked to ≤ ${renderer.maxWordsPerChunk} words.`, 'success');
    } else {
      showAiStatus('Could not find timestamps. Ensure file is valid LRC or SRT.', 'error');
    }
  };
  reader.readAsText(file);
}

lrcInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) handleLrcFile(e.target.files[0]);
});
lrcDropZone.addEventListener('dragover', (e) => { e.preventDefault(); lrcDropZone.classList.add('dragover'); });
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
    document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
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
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) handleAudioFile(e.dataTransfer.files[0]);
});

// 5. AI Sync Dispatcher
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
    showAiStatus(`Aligning audio via ${provider.toUpperCase()} (${model})...`, 'info');

    const synced = await aiService.syncLyrics({
      provider,
      apiKey,
      model,
      customUrl,
      audioFile: currentAudioFile,
      referenceLyrics: refLyrics,
      onProgress: (status) => showAiStatus(status, 'info')
    });

    lyricsDataInput.value = JSON.stringify(synced, null, 2);
    renderer.setLyrics(synced);
    showAiStatus(`Successfully aligned and fluidly chunked into ${renderer.chunkedLyrics.length} phrases!`, 'success');
  } catch (err) {
    console.error(err);
    showAiStatus(err.message, 'error');
  } finally {
    btnSyncAi.disabled = false;
  }
});

// 6. Lyrics Editor & Sample Loader
function applyRawLyrics() {
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
  } catch (err) {}
}

lyricsDataInput.addEventListener('input', applyRawLyrics);

btnSampleLyrics.addEventListener('click', () => {
  const sample = [
    {
      start: 0.2,
      end: 4.8,
      text: "Neon reflections in the rainy night",
      words: [
        { word: "Neon", start: 0.2, end: 0.8 },
        { word: "reflections", start: 0.85, end: 2.1 },
        { word: "in", start: 2.15, end: 2.4 },
        { word: "the", start: 2.45, end: 2.7 },
        { word: "rainy", start: 2.75, end: 3.6 },
        { word: "night", start: 3.65, end: 4.6 }
      ]
    },
    {
      start: 5.0,
      end: 9.6,
      text: "Lost in the rhythm of the city lights",
      words: [
        { word: "Lost", start: 5.0, end: 5.7 },
        { word: "in", start: 5.75, end: 6.0 },
        { word: "the", start: 6.05, end: 6.3 },
        { word: "rhythm", start: 6.35, end: 7.4 },
        { word: "of", start: 7.45, end: 7.7 },
        { word: "the", start: 7.75, end: 8.0 },
        { word: "city", start: 8.05, end: 8.8 },
        { word: "lights", start: 8.85, end: 9.5 }
      ]
    },
    {
      start: 9.8,
      end: 15.5,
      text: "Drifting through echoes of an old memory that lingers deep inside me tonight",
      words: [
        { word: "Drifting", start: 9.8, end: 10.6 },
        { word: "through", start: 10.65, end: 11.1 },
        { word: "echoes", start: 11.15, end: 11.9 },
        { word: "of", start: 11.95, end: 12.2 },
        { word: "an", start: 12.25, end: 12.5 },
        { word: "old", start: 12.55, end: 13.0 },
        { word: "memory", start: 13.05, end: 13.8 },
        { word: "that", start: 13.85, end: 14.1 },
        { word: "lingers", start: 14.15, end: 14.8 },
        { word: "deep", start: 14.85, end: 15.1 },
        { word: "inside", start: 15.15, end: 15.35 },
        { word: "me", start: 15.36, end: 15.42 },
        { word: "tonight", start: 15.43, end: 15.5 }
      ]
    },
    {
      start: 16.0,
      end: 21.0,
      text: "Finding eternal peace right where we belong",
      words: [
        { word: "Finding", start: 16.0, end: 16.8 },
        { word: "eternal", start: 16.85, end: 17.8 },
        { word: "peace", start: 17.85, end: 18.6 },
        { word: "right", start: 18.65, end: 19.2 },
        { word: "where", start: 19.25, end: 19.7 },
        { word: "we", start: 19.75, end: 20.1 },
        { word: "belong", start: 20.15, end: 20.9 }
      ]
    }
  ];
  lyricsDataInput.value = JSON.stringify(sample, null, 2);
  renderer.setLyrics(sample);
});

// 7. 3D Background Settings Listeners (Three.js)
if (threeStyleSelect) {
  threeStyleSelect.addEventListener('change', (e) => {
    renderer.threeBg.updateSettings({ style: e.target.value });
  });
}
if (threeColorInput) {
  threeColorInput.addEventListener('input', (e) => {
    renderer.threeBg.updateSettings({ color: e.target.value });
  });
}
if (threeBgColorInput) {
  threeBgColorInput.addEventListener('input', (e) => {
    renderer.threeBg.updateSettings({ bgColor: e.target.value });
  });
}
if (threeSpeedInput) {
  threeSpeedInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.threeBg.updateSettings({ speed: val / 100 });
    if (threeSpeedVal) threeSpeedVal.textContent = `${(val / 100).toFixed(1)}x`;
  });
}
if (threeHeightInput) {
  threeHeightInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.threeBg.updateSettings({ waveHeight: val });
    if (threeHeightVal) threeHeightVal.textContent = `${val}px`;
  });
}
if (toggleAudioReactive) {
  toggleAudioReactive.addEventListener('change', (e) => {
    renderer.enableAudioReactive = e.target.checked;
    renderer.threeBg.updateSettings({ audioReactive: e.target.checked });
  });
}
if (btnResetBg3D) {
  btnResetBg3D.addEventListener('click', () => {
    if (threeStyleSelect) threeStyleSelect.value = 'particle-waves';
    if (threeColorInput) threeColorInput.value = '#64ffda';
    if (threeBgColorInput) threeBgColorInput.value = '#080b14';
    if (threeSpeedInput) threeSpeedInput.value = 100;
    if (threeSpeedVal) threeSpeedVal.textContent = '1.0x';
    if (threeHeightInput) threeHeightInput.value = 45;
    if (threeHeightVal) threeHeightVal.textContent = '45px';
    if (toggleAudioReactive) toggleAudioReactive.checked = true;

    renderer.threeBg.updateSettings({
      style: 'particle-waves',
      color: '#64ffda',
      bgColor: '#080b14',
      speed: 1.0,
      waveHeight: 45,
      audioReactive: true
    });
  });
}

// 8. Fluid Kinetic Lyric Settings Listeners
if (lyricMotionStyleSelect) {
  lyricMotionStyleSelect.addEventListener('change', (e) => {
    renderer.motionStyle = e.target.value;
  });
}
if (fontFamilySelect) {
  fontFamilySelect.addEventListener('change', (e) => {
    renderer.fontFamily = e.target.value;
  });
}
if (fontSizeRange) {
  fontSizeRange.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.baseFontSize = val;
    if (fontSizeVal) fontSizeVal.textContent = `${val}px`;
  });
}
if (maxWordsRange) {
  maxWordsRange.addEventListener('input', (e) => {
    const val = Math.max(1, Math.min(5, parseInt(e.target.value)));
    renderer.setMaxWords(val);
    if (maxWordsVal) maxWordsVal.textContent = `${val} words`;
  });
}
if (textColorInput) {
  textColorInput.addEventListener('input', (e) => {
    renderer.textColor = e.target.value;
  });
}
if (accentColorInput) {
  accentColorInput.addEventListener('input', (e) => {
    renderer.accentColor = e.target.value;
    if (renderer.badgeConfig) renderer.badgeConfig.boxColor = e.target.value;
  });
}
if (glowSizeInput) {
  glowSizeInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.glowSize = val;
    if (glowSizeVal) glowSizeVal.textContent = `${val}px`;
  });
}
if (glowDensityInput) {
  glowDensityInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.glowDensity = val / 100;
    if (glowDensityVal) glowDensityVal.textContent = `${val}%`;
  });
}
if (containerStyleSelect) {
  containerStyleSelect.addEventListener('change', (e) => {
    renderer.containerStyle = e.target.value;
  });
}
if (toggleUppercase) {
  toggleUppercase.addEventListener('change', (e) => {
    if (renderer.badgeConfig) renderer.badgeConfig.uppercase = e.target.checked;
  });
}
if (btnResetLyrics) {
  btnResetLyrics.addEventListener('click', () => {
    if (lyricMotionStyleSelect) lyricMotionStyleSelect.value = 'liquid-spring';
    if (fontFamilySelect) fontFamilySelect.value = "'Outfit', sans-serif";
    if (fontSizeRange) fontSizeRange.value = 56;
    if (fontSizeVal) fontSizeVal.textContent = '56px';
    if (maxWordsRange) maxWordsRange.value = 4;
    if (maxWordsVal) maxWordsVal.textContent = '4 words';
    if (textColorInput) textColorInput.value = '#ffffff';
    if (accentColorInput) accentColorInput.value = '#64ffda';
    if (glowSizeInput) glowSizeInput.value = 25;
    if (glowSizeVal) glowSizeVal.textContent = '25px';
    if (glowDensityInput) glowDensityInput.value = 100;
    if (glowDensityVal) glowDensityVal.textContent = '100%';
    if (containerStyleSelect) containerStyleSelect.value = 'clean-glow';
    if (toggleUppercase) toggleUppercase.checked = false;

    renderer.motionStyle = 'liquid-spring';
    renderer.fontFamily = "'Outfit', sans-serif";
    renderer.baseFontSize = 56;
    renderer.setMaxWords(4);
    renderer.textColor = '#ffffff';
    renderer.accentColor = '#64ffda';
    renderer.glowSize = 25;
    renderer.glowDensity = 1.0;
    renderer.containerStyle = 'clean-glow';
    renderer.badgeConfig.uppercase = false;
  });
}

// 9. Depth & Safe Guides Listeners
if (toggleSafeGuides) {
  toggleSafeGuides.addEventListener('change', (e) => {
    renderer.showSafeGuides = e.target.checked;
  });
}

function loadFgFile(file) {
  if (!file) return;
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    renderer.setFgCutoutImage(img);
    if (fgImgName) fgImgName.textContent = file.name;
    if (fgImgInfo) fgImgInfo.classList.remove('hidden');
  };
}

if (fgInput) {
  fgInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) loadFgFile(e.target.files[0]);
  });
}
if (fgDropZone) {
  fgDropZone.addEventListener('dragover', (e) => { e.preventDefault(); fgDropZone.classList.add('dragover'); });
  fgDropZone.addEventListener('dragleave', () => fgDropZone.classList.remove('dragover'));
  fgDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fgDropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) loadFgFile(e.dataTransfer.files[0]);
  });
}
if (btnRemoveFgImg) {
  btnRemoveFgImg.addEventListener('click', () => {
    renderer.setFgCutoutImage(null);
    if (fgInput) fgInput.value = '';
    if (fgImgInfo) fgImgInfo.classList.add('hidden');
  });
}

// 10. Aspect Ratio
ratioButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    ratioButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderer.setAspectRatio(btn.getAttribute('data-ratio'), exportResSelect.value);
  });
});
exportResSelect.addEventListener('change', () => {
  const activeBtn = document.querySelector('.ratio-btn.active');
  const ratio = activeBtn ? activeBtn.getAttribute('data-ratio') : '16:9';
  renderer.setAspectRatio(ratio, exportResSelect.value);
});

// 11. Playback Controls
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
  if (recorder && recorder.isRecording) recorder.stop();
});

// 12. Video & Thumbnail Export
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
      const filename = `${currentAudioFile.name.replace(/\.[^/.]+$/, "")}_aura_lyric_video.webm`;
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

function captureThumbnail() {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const trackBase = currentAudioFile ? currentAudioFile.name.replace(/\.[^/.]+$/, "") : "aura_canvas";
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

if (btnExportThumbnail) btnExportThumbnail.addEventListener('click', captureThumbnail);
if (btnSnapshotBar) btnSnapshotBar.addEventListener('click', captureThumbnail);

// 13. Main 60 FPS Render Loop
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

// Load initial demo lyrics and start 60fps loop
btnSampleLyrics.click();
requestAnimationFrame(animate);
