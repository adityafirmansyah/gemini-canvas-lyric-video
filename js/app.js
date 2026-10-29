/**
 * app.js
 * Main Controller coordinating Audio, Multi-AI Service, LRC Parser, Canvas Rendering, and Video Export.
 */

import { AudioManager } from './audio-player.js?v=3.4';
import { AiService } from './ai-service.js?v=3.4';
import { LrcParser } from './lrc-parser.js?v=3.4';
import { CanvasRenderer } from './canvas-renderer.js?v=3.4';
import { VideoRecorder } from './recorder.js?v=3.4';

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
const glowSizeInput = document.getElementById('glow-size');
const glowSizeVal = document.getElementById('glow-size-val');
const glowDensityInput = document.getElementById('glow-density');
const glowDensityVal = document.getElementById('glow-density-val');

// Subtitle & Box Badge Controls
const subStyleSelect = document.getElementById('sub-style');
const subSettingsPanel = document.getElementById('sub-settings-panel');
const subBoxColorInput = document.getElementById('sub-box-color');
const subTextColorInput = document.getElementById('sub-text-color');
const subCornerRadiusInput = document.getElementById('sub-corner-radius');
const subCornerRadiusVal = document.getElementById('sub-corner-radius-val');
const subPaddingInput = document.getElementById('sub-padding');
const subPaddingVal = document.getElementById('sub-padding-val');
const subUppercaseInput = document.getElementById('sub-uppercase');
const btnResetSubtitle = document.getElementById('btn-reset-subtitle');
const paletteBtns = document.querySelectorAll('.palette-btn');

const overlayTypeSelect = document.getElementById('overlay-type');
const overlaySettingsPanel = document.getElementById('overlay-settings-panel');
const overlayDensityInput = document.getElementById('overlay-density');
const overlayDensityVal = document.getElementById('overlay-density-val');
const overlaySpeedInput = document.getElementById('overlay-speed');
const overlaySpeedVal = document.getElementById('overlay-speed-val');
const overlayDirectionSelect = document.getElementById('overlay-direction');
const overlaySizeInput = document.getElementById('overlay-size');
const overlaySizeVal = document.getElementById('overlay-size-val');
const overlayOpacityInput = document.getElementById('overlay-opacity');
const overlayOpacityVal = document.getElementById('overlay-opacity-val');
const overlayColorInput = document.getElementById('overlay-color');
const btnResetOverlay = document.getElementById('btn-reset-overlay');
const customParticleInput = document.getElementById('custom-particle-input');
const particleImgInfo = document.getElementById('particle-img-info');
const particleImgName = document.getElementById('particle-img-name');
const btnRemoveParticleImg = document.getElementById('btn-remove-particle-img');

const bgDropZone = document.getElementById('bg-drop-zone');
const customBgInput = document.getElementById('custom-bg-input');
const bgImgInfo = document.getElementById('bg-img-info');
const bgImgName = document.getElementById('bg-img-name');
const btnRemoveBgImg = document.getElementById('btn-remove-bg-img');
const bgDimSlider = document.getElementById('bg-dim');
const bgDimVal = document.getElementById('bg-dim-val');
const btnResetBgMotion = document.getElementById('btn-reset-bg-motion');
const bgAnimTypeSelect = document.getElementById('bg-anim-type');
const bgAnimSpeedInput = document.getElementById('bg-anim-speed');
const bgAnimSpeedVal = document.getElementById('bg-anim-speed-val');
const bgAnimIntensityInput = document.getElementById('bg-anim-intensity');
const bgAnimIntensityVal = document.getElementById('bg-anim-intensity-val');
const bgBeatBounceInput = document.getElementById('bg-beat-bounce');
const bgBeatBounceVal = document.getElementById('bg-beat-bounce-val');
const toggleAudioReactive = document.getElementById('toggle-audio-reactive');

// HyperFrames Layout Engine Controls
const toggleAutoFit = document.getElementById('toggle-auto-fit');
const toggleSafeGuides = document.getElementById('toggle-safe-guides');
const fgDropZone = document.getElementById('fg-drop-zone');
const fgInput = document.getElementById('fg-input');
const fgImgInfo = document.getElementById('fg-img-info');
const fgImgName = document.getElementById('fg-img-name');
const btnRemoveFgImg = document.getElementById('btn-remove-fg-img');

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
    glowSize: 22,
    glowDensity: 1.0,
    overlayType: 'particles',
    animType: 'smooth-slide'
  },
  cyberpunk: {
    font: "'Space Grotesk', sans-serif",
    fontSize: 56,
    textColor: '#ffffff',
    accentColor: '#ff007f',
    glowSize: 38,
    glowDensity: 1.5,
    overlayType: 'waveform',
    animType: 'cyber-glitch'
  },
  synthwave: {
    font: "'Montserrat', sans-serif",
    fontSize: 54,
    textColor: '#ffffff',
    accentColor: '#ffbe0b',
    glowSize: 32,
    glowDensity: 1.3,
    overlayType: 'synthwave-grid',
    animType: 'pop-bounce'
  },
  rainy: {
    font: "'Playfair Display', serif",
    fontSize: 50,
    textColor: '#e2e8f0',
    accentColor: '#38bdf8',
    glowSize: 20,
    glowDensity: 0.9,
    overlayType: 'rain',
    animType: 'floating-wave'
  },
  minimal: {
    font: "'Cinzel', serif",
    fontSize: 48,
    textColor: '#f8fafc',
    accentColor: '#ffffff',
    glowSize: 0,
    glowDensity: 0,
    overlayType: 'none',
    animType: 'smooth-slide'
  },
  karaoke: {
    font: "'Outfit', sans-serif",
    fontSize: 58,
    textColor: '#ffffff',
    accentColor: '#22d3ee',
    glowSize: 25,
    glowDensity: 1.0,
    overlayType: 'none',
    animType: 'karaoke-fill'
  },
  phonk: {
    font: "'Space Grotesk', sans-serif",
    fontSize: 58,
    textColor: '#ffffff',
    accentColor: '#ef4444',
    glowSize: 42,
    glowDensity: 1.6,
    overlayType: 'waveform',
    animType: 'pop-bounce'
  },
  sakura: {
    font: "'Outfit', sans-serif",
    fontSize: 52,
    textColor: '#fff1f2',
    accentColor: '#f472b6',
    glowSize: 24,
    glowDensity: 1.0,
    overlayType: 'particles',
    animType: 'floating-wave'
  },
  academia: {
    font: "'Cinzel', serif",
    fontSize: 48,
    textColor: '#fef3c7',
    accentColor: '#d97706',
    glowSize: 12,
    glowDensity: 0.6,
    overlayType: 'none',
    animType: 'typewriter'
  },
  cosmic: {
    font: "'Space Grotesk', sans-serif",
    fontSize: 52,
    textColor: '#f8fafc',
    accentColor: '#c084fc',
    glowSize: 35,
    glowDensity: 1.3,
    overlayType: 'starfield',
    animType: 'floating-wave'
  },
  retro: {
    font: "'Courier Prime', monospace",
    fontSize: 46,
    textColor: '#fef08a',
    accentColor: '#f97316',
    glowSize: 10,
    glowDensity: 0.5,
    overlayType: 'particles',
    animType: 'typewriter'
  },
  acid: {
    font: "'Montserrat', sans-serif",
    fontSize: 56,
    textColor: '#ffffff',
    accentColor: '#84cc16',
    glowSize: 40,
    glowDensity: 1.5,
    overlayType: 'waveform',
    animType: 'cyber-glitch'
  },
  highway: {
    font: "'Bebas Neue', sans-serif",
    fontSize: 68,
    textColor: '#ffffff',
    accentColor: '#facc15',
    glowSize: 10,
    glowDensity: 0.4,
    overlayType: 'none',
    animType: 'word-stack',
    subtitleStyle: 'highway-3d',
    bgAnimType: 'zoom-in',
    bgSpeed: 1.2,
    bgIntensity: 1.2,
    bgBounce: 0.8
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
      renderer.overlayType = p.overlayType;
      renderer.animType = p.animType;
      renderer.glowSize = p.glowSize !== undefined ? p.glowSize : 25;
      renderer.glowDensity = p.glowDensity !== undefined ? p.glowDensity : 1.0;

      // Sync form inputs
      fontFamilySelect.value = p.font;
      fontSizeRange.value = p.fontSize;
      textColorInput.value = p.textColor;
      accentColorInput.value = p.accentColor;
      if (glowSizeInput) glowSizeInput.value = renderer.glowSize;
      if (glowSizeVal) glowSizeVal.textContent = `${renderer.glowSize}px`;
      if (glowDensityInput) glowDensityInput.value = Math.round(renderer.glowDensity * 100);
      if (glowDensityVal) glowDensityVal.textContent = `${Math.round(renderer.glowDensity * 100)}%`;

      const partColor = p.particleColor || p.accentColor || '#64ffda';
      renderer.setOverlayConfig({ color: partColor });
      if (overlayColorInput) overlayColorInput.value = partColor;

      if (overlayTypeSelect) {
        overlayTypeSelect.value = p.overlayType;
        if (overlaySettingsPanel) {
          overlaySettingsPanel.classList.toggle('hidden', p.overlayType === 'none');
        }
      }
      animTypeSelect.value = p.animType;

      if (p.subtitleStyle !== undefined) {
        renderer.setSubtitleConfig({ style: p.subtitleStyle });
        if (subStyleSelect) subStyleSelect.value = p.subtitleStyle;
        if (subSettingsPanel) {
          subSettingsPanel.classList.toggle('hidden', p.subtitleStyle === 'none' || p.subtitleStyle === 'highway-3d');
        }
      }

      if (p.bgAnimType !== undefined) {
        renderer.setBgConfig({
          animType: p.bgAnimType,
          speed: p.bgSpeed || 1.0,
          intensity: p.bgIntensity || 1.0,
          beatBounce: p.bgBounce || 1.0
        });
        if (bgAnimTypeSelect) bgAnimTypeSelect.value = p.bgAnimType;
      }
    }
  });
});

animTypeSelect.addEventListener('change', (e) => renderer.animType = e.target.value);
fontFamilySelect.addEventListener('change', (e) => renderer.fontFamily = e.target.value);
fontSizeRange.addEventListener('input', (e) => renderer.baseFontSize = parseInt(e.target.value));
textColorInput.addEventListener('input', (e) => renderer.textColor = e.target.value);
accentColorInput.addEventListener('input', (e) => renderer.accentColor = e.target.value);

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

// Subtitle & Box Badge Design Listeners
if (subStyleSelect) {
  subStyleSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    renderer.setSubtitleConfig({ style: val });
    if (subSettingsPanel) {
      subSettingsPanel.classList.toggle('hidden', val === 'none');
    }
  });
}

if (subBoxColorInput) {
  subBoxColorInput.addEventListener('input', (e) => {
    renderer.setSubtitleConfig({ boxColor: e.target.value });
  });
}

if (subTextColorInput) {
  subTextColorInput.addEventListener('input', (e) => {
    renderer.setSubtitleConfig({ boxTextColor: e.target.value });
  });
}

if (subCornerRadiusInput) {
  subCornerRadiusInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.setSubtitleConfig({ boxRadius: val });
    if (subCornerRadiusVal) subCornerRadiusVal.textContent = `${val}px`;
  });
}

if (subPaddingInput) {
  subPaddingInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.setSubtitleConfig({ boxPadding: val });
    if (subPaddingVal) subPaddingVal.textContent = `${val}px`;
  });
}

if (subUppercaseInput) {
  subUppercaseInput.addEventListener('change', (e) => {
    renderer.setSubtitleConfig({ uppercase: e.target.checked });
  });
}

paletteBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const boxColor = btn.getAttribute('data-box');
    const textColor = btn.getAttribute('data-text');
    if (boxColor) {
      if (subBoxColorInput) subBoxColorInput.value = boxColor;
      renderer.setSubtitleConfig({ boxColor });
    }
    if (textColor) {
      if (subTextColorInput) subTextColorInput.value = textColor;
      renderer.setSubtitleConfig({ boxTextColor: textColor });
    }
  });
});

if (btnResetSubtitle) {
  btnResetSubtitle.addEventListener('click', () => {
    if (subStyleSelect) subStyleSelect.value = 'none';
    if (subSettingsPanel) subSettingsPanel.classList.add('hidden');
    if (subBoxColorInput) subBoxColorInput.value = '#c9fa53';
    if (subTextColorInput) subTextColorInput.value = '#000000';
    if (subCornerRadiusInput) subCornerRadiusInput.value = 4;
    if (subCornerRadiusVal) subCornerRadiusVal.textContent = '4px';
    if (subPaddingInput) subPaddingInput.value = 14;
    if (subPaddingVal) subPaddingVal.textContent = '14px';
    if (subUppercaseInput) subUppercaseInput.checked = true;

    renderer.setSubtitleConfig({
      style: 'none',
      boxColor: '#c9fa53',
      boxTextColor: '#000000',
      boxRadius: 4,
      boxPadding: 14,
      uppercase: true
    });
  });
}

if (overlayTypeSelect) {
  overlayTypeSelect.addEventListener('change', (e) => {
    renderer.setOverlayType(e.target.value);
    if (overlaySettingsPanel) {
      overlaySettingsPanel.classList.toggle('hidden', e.target.value === 'none');
    }
  });
}

// Overlay Fine-tuning Listeners
if (overlayDensityInput) {
  overlayDensityInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.setOverlayConfig({ density: val / 100 });
    if (overlayDensityVal) overlayDensityVal.textContent = `${val}%`;
  });
}

if (overlaySpeedInput) {
  overlaySpeedInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.setOverlayConfig({ speed: val / 100 });
    if (overlaySpeedVal) overlaySpeedVal.textContent = `${(val / 100).toFixed(1)}x`;
  });
}

if (overlayDirectionSelect) {
  overlayDirectionSelect.addEventListener('change', (e) => {
    renderer.setOverlayConfig({ direction: e.target.value });
  });
}

if (overlaySizeInput) {
  overlaySizeInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.setOverlayConfig({ size: val / 100 });
    if (overlaySizeVal) overlaySizeVal.textContent = `${(val / 100).toFixed(1)}x`;
  });
}

if (overlayOpacityInput) {
  overlayOpacityInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.setOverlayConfig({ opacity: val / 100 });
    if (overlayOpacityVal) overlayOpacityVal.textContent = `${val}%`;
  });
}

if (overlayColorInput) {
  overlayColorInput.addEventListener('input', (e) => {
    renderer.setOverlayConfig({ color: e.target.value });
  });
}

if (btnResetOverlay) {
  btnResetOverlay.addEventListener('click', () => {
    if (overlayDensityInput) overlayDensityInput.value = 100;
    if (overlayDensityVal) overlayDensityVal.textContent = '100%';
    if (overlaySpeedInput) overlaySpeedInput.value = 100;
    if (overlaySpeedVal) overlaySpeedVal.textContent = '1.0x';
    if (overlayDirectionSelect) overlayDirectionSelect.value = 'default';
    if (overlaySizeInput) overlaySizeInput.value = 100;
    if (overlaySizeVal) overlaySizeVal.textContent = '1.0x';
    if (overlayOpacityInput) overlayOpacityInput.value = 100;
    if (overlayOpacityVal) overlayOpacityVal.textContent = '100%';
    if (overlayColorInput) overlayColorInput.value = '#64ffda';

    renderer.setCustomParticleImage(null);
    if (customParticleInput) customParticleInput.value = '';
    if (particleImgInfo) particleImgInfo.classList.add('hidden');

    renderer.setOverlayConfig({
      density: 1.0,
      speed: 1.0,
      direction: 'default',
      size: 1.0,
      opacity: 1.0,
      color: '#64ffda'
    });
  });
}

// Custom Particle Image Handling
function loadParticleImageFile(file) {
  if (!file) return;
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    renderer.setCustomParticleImage(img);
    if (particleImgName) particleImgName.textContent = file.name;
    if (particleImgInfo) particleImgInfo.classList.remove('hidden');
  };
}

if (customParticleInput) {
  customParticleInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      loadParticleImageFile(e.target.files[0]);
    }
  });
}

if (btnRemoveParticleImg) {
  btnRemoveParticleImg.addEventListener('click', () => {
    renderer.setCustomParticleImage(null);
    if (customParticleInput) customParticleInput.value = '';
    if (particleImgInfo) particleImgInfo.classList.add('hidden');
  });
}

// Custom Background Media Handling (Images & Video)
function loadBgImageFile(file) {
  if (!file) return;
  const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');
  if (isVideo) {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.onloadeddata = () => {
      renderer.setCustomImage(null);
      renderer.setCustomVideo(video);
      if (audioManager.isPlaying) video.play().catch(() => {});
      if (bgImgName) bgImgName.textContent = `🎬 ${file.name}`;
      if (bgImgInfo) bgImgInfo.classList.remove('hidden');
    };
  } else {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      renderer.setCustomVideo(null);
      renderer.setCustomImage(img);
      if (bgImgName) bgImgName.textContent = `🖼️ ${file.name}`;
      if (bgImgInfo) bgImgInfo.classList.remove('hidden');
    };
  }
}

if (customBgInput) {
  customBgInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      loadBgImageFile(e.target.files[0]);
    }
  });
}

if (bgDropZone) {
  bgDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    bgDropZone.classList.add('dragover');
  });
  bgDropZone.addEventListener('dragleave', () => {
    bgDropZone.classList.remove('dragover');
  });
  bgDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    bgDropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      loadBgImageFile(e.dataTransfer.files[0]);
    }
  });
}

if (btnRemoveBgImg) {
  btnRemoveBgImg.addEventListener('click', () => {
    renderer.setCustomImage(null);
    renderer.setCustomVideo(null);
    if (customBgInput) customBgInput.value = '';
    if (bgImgInfo) bgImgInfo.classList.add('hidden');
  });
}

if (bgDimSlider) {
  bgDimSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.bgDim = val / 100;
    if (bgDimVal) bgDimVal.textContent = `${val}%`;
  });
}

// HyperFrames Layout Engine listeners
if (toggleAutoFit) {
  toggleAutoFit.addEventListener('change', (e) => {
    renderer.autoFitFont = e.target.checked;
    renderer._fitCache.clear();
  });
}

if (toggleSafeGuides) {
  toggleSafeGuides.addEventListener('change', (e) => {
    renderer.showSafeGuides = e.target.checked;
  });
}

function loadFgImageFile(file) {
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
    if (e.target.files.length > 0) loadFgImageFile(e.target.files[0]);
  });
}

if (fgDropZone) {
  fgDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fgDropZone.classList.add('dragover');
  });
  fgDropZone.addEventListener('dragleave', () => fgDropZone.classList.remove('dragover'));
  fgDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fgDropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) loadFgImageFile(e.dataTransfer.files[0]);
  });
}

if (btnRemoveFgImg) {
  btnRemoveFgImg.addEventListener('click', () => {
    renderer.setFgCutoutImage(null);
    if (fgInput) fgInput.value = '';
    if (fgImgInfo) fgImgInfo.classList.add('hidden');
  });
}

// Background Motion Listeners
if (bgAnimTypeSelect) {
  bgAnimTypeSelect.addEventListener('change', (e) => {
    renderer.setBgConfig({ animType: e.target.value });
  });
}

if (bgAnimSpeedInput) {
  bgAnimSpeedInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.setBgConfig({ speed: val / 100 });
    if (bgAnimSpeedVal) bgAnimSpeedVal.textContent = `${(val / 100).toFixed(1)}x`;
  });
}

if (bgAnimIntensityInput) {
  bgAnimIntensityInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.setBgConfig({ intensity: val / 100 });
    if (bgAnimIntensityVal) bgAnimIntensityVal.textContent = `${val}%`;
  });
}

if (bgBeatBounceInput) {
  bgBeatBounceInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    renderer.setBgConfig({ beatBounce: val / 100 });
    if (bgBeatBounceVal) bgBeatBounceVal.textContent = `${val}%`;
  });
}

if (btnResetBgMotion) {
  btnResetBgMotion.addEventListener('click', () => {
    if (bgAnimTypeSelect) bgAnimTypeSelect.value = 'ken-burns';
    if (bgAnimSpeedInput) bgAnimSpeedInput.value = 100;
    if (bgAnimSpeedVal) bgAnimSpeedVal.textContent = '1.0x';
    if (bgAnimIntensityInput) bgAnimIntensityInput.value = 100;
    if (bgAnimIntensityVal) bgAnimIntensityVal.textContent = '100%';
    if (bgBeatBounceInput) bgBeatBounceInput.value = 100;
    if (bgBeatBounceVal) bgBeatBounceVal.textContent = '100%';

    renderer.setBgConfig({
      animType: 'ken-burns',
      speed: 1.0,
      intensity: 1.0,
      beatBounce: 1.0
    });
  });
}

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
    if (renderer.customBgVideo) renderer.customBgVideo.pause();
    btnPlayPause.textContent = '▶';
  } else {
    audioManager.play();
    if (renderer.customBgVideo) renderer.customBgVideo.play().catch(() => {});
    btnPlayPause.textContent = '⏸';
  }
});

seekSlider.addEventListener('input', (e) => {
  const time = parseFloat(e.target.value);
  audioManager.seek(time);
  if (renderer.customBgVideo && renderer.customBgVideo.duration) {
    renderer.customBgVideo.currentTime = time % renderer.customBgVideo.duration;
  }
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
  if (renderer.customBgVideo) {
    renderer.customBgVideo.pause();
    renderer.customBgVideo.currentTime = 0;
  }
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
