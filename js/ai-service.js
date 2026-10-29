/**
 * ai-service.js
 * Multi-provider AI audio transcription & timestamp alignment:
 * 1. Google Gemini (2.5-flash, 1.5-flash, 1.5-pro)
 * 2. Groq Whisper (whisper-large-v3, whisper-large-v3-turbo)
 * 3. OpenAI Whisper (whisper-1)
 * 4. Custom OpenAI-compatible audio endpoint
 */

export class AiService {
  constructor() {
    this.storagePrefix = 'lyric_canvas_';
  }

  getSavedApiKey(provider) {
    return localStorage.getItem(`${this.storagePrefix}${provider}_key`) || '';
  }

  saveApiKey(provider, key) {
    if (key) {
      localStorage.setItem(`${this.storagePrefix}${provider}_key`, key.trim());
    } else {
      localStorage.removeItem(`${this.storagePrefix}${provider}_key`);
    }
  }

  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Downsamples large audio to 16kHz mono WAV in browser to prevent 503 / gateway timeouts
   */
  async compressAudioForGemini(file, onProgress) {
    // If small MP3 under 6MB, send directly
    if (file.size < 6 * 1024 * 1024 && file.type === 'audio/mpeg') {
      return { base64: await this.fileToBase64(file), mimeType: 'audio/mp3' };
    }

    try {
      if (onProgress) onProgress('Optimizing audio payload for Gemini (16kHz mono)...');
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const targetSampleRate = 16000;
      const targetLength = Math.round(decodedBuffer.duration * targetSampleRate);
      const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(offlineCtx.destination);
      source.start();

      const renderedBuffer = await offlineCtx.startRendering();
      const channelData = renderedBuffer.getChannelData(0);

      // Encode into 16-bit PCM WAV
      const numSamples = channelData.length;
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, targetSampleRate, true);
      view.setUint32(28, targetSampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, numSamples * 2, true);

      let offset = 44;
      for (let i = 0; i < numSamples; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }

      // Convert Uint8Array to base64
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const len = bytes.byteLength;
      const chunkSize = 0x8000;
      for (let i = 0; i < len; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      return { base64: btoa(binary), mimeType: 'audio/wav' };
    } catch (err) {
      console.warn('Audio compression fallback to raw base64:', err);
      return { base64: await this.fileToBase64(file), mimeType: file.type || 'audio/mp3' };
    }
  }

  /**
   * Main sync entrypoint dispatching to provider
   */
  async syncLyrics({ provider, apiKey, model, customUrl, audioFile, referenceLyrics, onProgress }) {
    if (!audioFile) throw new Error('Please select an audio file first.');
    if (!apiKey && provider !== 'custom') throw new Error(`API Key for ${provider} is required.`);

    switch (provider) {
      case 'gemini':
        return await this.syncWithGemini({ apiKey, model, audioFile, referenceLyrics, onProgress });
      case 'groq':
        return await this.syncWithWhisperApi({
          apiKey,
          endpointUrl: 'https://api.groq.com/openai/v1/audio/transcriptions',
          model: model || 'whisper-large-v3-turbo',
          audioFile,
          referenceLyrics,
          onProgress
        });
      case 'openai':
        return await this.syncWithWhisperApi({
          apiKey,
          endpointUrl: 'https://api.openai.com/v1/audio/transcriptions',
          model: 'whisper-1',
          audioFile,
          referenceLyrics,
          onProgress
        });
      case 'custom':
        return await this.syncWithWhisperApi({
          apiKey: apiKey || '',
          endpointUrl: customUrl || 'http://localhost:8000/v1/audio/transcriptions',
          model: model || 'whisper-1',
          audioFile,
          referenceLyrics,
          onProgress
        });
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Fast lightweight connection test to verify API key validity without full audio processing
   */
  async testApiKey({ provider, apiKey, customUrl }) {
    if (!apiKey && provider !== 'custom') {
      throw new Error('Please enter an API key first.');
    }

    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}: Invalid key`);
      }
      return 'Google Gemini API key is valid & connected! ✓';
    }

    if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}: Invalid key`);
      }
      return 'Groq API key is valid & connected! ✓';
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}: Invalid key`);
      }
      return 'OpenAI API key is valid & connected! ✓';
    }

    if (provider === 'custom') {
      const base = customUrl ? customUrl.replace(/\/audio\/transcriptions\/?$/, '') : 'http://localhost:8000/v1';
      const testEndpoint = `${base}/models`;
      const headers = {};
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      const res = await fetch(testEndpoint, { headers });
      if (!res.ok) {
        throw new Error(`Custom endpoint responded with HTTP ${res.status}`);
      }
      return 'Custom endpoint responded successfully! ✓';
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * 1. Google Gemini Audio Sync with Word-to-Word Timestamps
   */
  async syncWithGemini({ apiKey, model, audioFile, referenceLyrics, onProgress }) {
    const { base64: base64Audio, mimeType } = await this.compressAudioForGemini(audioFile, onProgress);

    let prompt = `You are an expert audio engineer and vocal alignment specialist.
Listen to this audio track carefully and generate synchronized lyrics with precise word-level and line-level timestamps in seconds.

Return STRICT JSON adhering to this exact schema:
{
  "lyrics": [
    {
      "start": 0.2,
      "end": 3.8,
      "text": "Neon reflections in the rainy night",
      "words": [
        { "word": "Neon", "start": 0.2, "end": 0.7 },
        { "word": "reflections", "start": 0.75, "end": 1.9 },
        { "word": "in", "start": 2.0, "end": 2.2 },
        { "word": "the", "start": 2.25, "end": 2.45 },
        { "word": "rainy", "start": 2.5, "end": 3.1 },
        { "word": "night", "start": 3.15, "end": 3.75 }
      ]
    }
  ]
}

Rules:
1. "start" and "end" for both the line and each individual word MUST be exact float timestamps in seconds corresponding to the real vocal performance.
2. If an instrumental intro exists, the first lyric should start when vocals actually begin.
3. Every word in "text" must have its corresponding object in "words" with its actual sung start/end time.
4. If reference lyrics are provided, align those exact words to the vocal audio.
5. Do not include markdown codeblocks, return only valid JSON.`;

    if (referenceLyrics && referenceLyrics.trim().length > 0) {
      prompt += `\n\nReference lyrics provided by user (align these exact words):\n"""\n${referenceLyrics.trim()}\n"""`;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    let response;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (onProgress) {
        onProgress(attempt === 1 
          ? `Detecting word-to-word timestamps via Gemini (${model})...` 
          : `Retrying Gemini connection (${attempt}/${maxRetries})...`
        );
      }

      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: mimeType, data: base64Audio } },
                  { text: prompt }
                ]
              }
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.1
            }
          })
        });

        if (response.status === 503 || response.status === 429) {
          if (attempt < maxRetries) {
            const waitSec = attempt * 2.5;
            if (onProgress) onProgress(`Gemini servers temporarily busy (503). Retrying in ${waitSec}s (attempt ${attempt + 1}/${maxRetries})...`);
            await new Promise(r => setTimeout(r, waitSec * 1000));
            continue;
          }
        }

        break;
      } catch (netErr) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw netErr;
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      let msg = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 503) {
        msg += `\n\n💡 Google Gemini is currently overloaded with high traffic (503 Service Unavailable). Recommended: Switch AI Provider to "Groq Whisper" in the dropdown for instant 2-second alignment with zero 503 errors!`;
      }
      throw new Error(`Gemini Error: ${msg}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error('Gemini returned an empty response.');

    const cleanJson = candidateText.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    const lyricsArray = Array.isArray(parsed) ? parsed : (parsed.lyrics || []);

    return lyricsArray
      .filter(item => item && typeof item.text === 'string' && item.text.trim().length > 0)
      .map(item => {
        const lineStart = parseFloat(item.start) || 0;
        const lineEnd = parseFloat(item.end) || (lineStart + 3.5);
        let words = [];
        if (Array.isArray(item.words) && item.words.length > 0) {
          words = item.words
            .filter(w => w && w.word)
            .map(w => ({
              word: String(w.word).trim(),
              start: parseFloat(w.start) || lineStart,
              end: parseFloat(w.end) || lineEnd
            }))
            .sort((a, b) => a.start - b.start);
        }
        return {
          start: lineStart,
          end: lineEnd,
          text: item.text.trim(),
          words: words.length > 0 ? words : undefined
        };
      })
      .sort((a, b) => a.start - b.start);
  }

  /**
   * 2. Whisper-compatible API (Groq, OpenAI, or Custom)
   * Uses word-level timestamps (timestamp_granularities[] = word) for exact karaoke sync!
   */
  async syncWithWhisperApi({ apiKey, endpointUrl, model, audioFile, referenceLyrics, onProgress }) {
    if (onProgress) onProgress(`Uploading audio for word-level sync (${model})...`);

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', model);
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    formData.append('timestamp_granularities[]', 'segment');

    if (referenceLyrics && referenceLyrics.trim().length > 0) {
      formData.append('prompt', referenceLyrics.trim().slice(0, 500));
    }

    const headers = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Whisper Error: ${msg}`);
    }

    const data = await response.json();
    const globalWords = (Array.isArray(data.words) ? data.words : [])
      .filter(w => w && w.word)
      .map(w => ({
        word: String(w.word).trim(),
        start: parseFloat(w.start) || 0,
        end: parseFloat(w.end) || 0
      }));

    if (!data.segments || !Array.isArray(data.segments)) {
      if (globalWords.length > 0) {
        return [{
          start: globalWords[0].start,
          end: globalWords[globalWords.length - 1].end,
          text: globalWords.map(w => w.word).join(' '),
          words: globalWords
        }];
      }
      if (data.text) {
        return [{ start: 0.0, end: 5.0, text: data.text.trim() }];
      }
      throw new Error('No timestamps returned from Whisper API.');
    }

    let wIdx = 0;
    return data.segments
      .filter(seg => seg && seg.text && seg.text.trim().length > 0)
      .map(seg => {
        const segStart = parseFloat(seg.start) || 0;
        const segEnd = parseFloat(seg.end) || 0;
        const segWords = [];

        // Check if segment has words attached directly
        if (Array.isArray(seg.words) && seg.words.length > 0) {
          seg.words.forEach(w => {
            if (w && w.word) {
              segWords.push({
                word: String(w.word).trim(),
                start: parseFloat(w.start) || segStart,
                end: parseFloat(w.end) || segEnd
              });
            }
          });
        } else if (globalWords.length > 0) {
          // Associate words from globalWords by time interval
          for (const gw of globalWords) {
            if (gw.start >= segStart - 0.25 && gw.end <= segEnd + 0.35) {
              segWords.push(gw);
            }
          }
        }

        return {
          start: segStart,
          end: segEnd,
          text: seg.text.trim(),
          words: segWords.length > 0 ? segWords : undefined
        };
      })
      .sort((a, b) => a.start - b.start);
  }
}
