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
   * 1. Google Gemini Audio Sync
   */
  async syncWithGemini({ apiKey, model, audioFile, referenceLyrics, onProgress }) {
    if (onProgress) onProgress('Encoding audio for Gemini...');
    const base64Audio = await this.fileToBase64(audioFile);

    let mimeType = audioFile.type || 'audio/mp3';
    if (!mimeType.startsWith('audio/')) mimeType = 'audio/mp3';

    let prompt = `You are an expert audio engineer and lyric synchronizer.
Listen to this audio track carefully and generate synchronized lyrics with precise start and end timestamps in seconds.

Return STRICT JSON adhering to this exact schema:
{
  "lyrics": [
    {
      "start": 0.0,
      "end": 3.5,
      "text": "Lyric line text"
    }
  ]
}

Rules:
1. "start" and "end" must be float numbers representing seconds from the beginning of the audio track.
2. Ensure lines are sequential, non-overlapping, and timed to the vocal delivery.
3. If an instrumental intro exists, the first lyric should start when vocals actually begin.
4. Do not include markdown codeblocks (\`\`\`json), just the pure JSON string.`;

    if (referenceLyrics && referenceLyrics.trim().length > 0) {
      prompt += `\n\nReference lyrics provided by the user (align these exact words to the audio):\n"""\n${referenceLyrics.trim()}\n"""`;
    }

    if (onProgress) onProgress(`Sending audio to Gemini (${model})...`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
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
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
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
      .map(item => ({
        start: parseFloat(item.start) || 0,
        end: parseFloat(item.end) || 0,
        text: item.text.trim()
      }))
      .sort((a, b) => a.start - b.start);
  }

  /**
   * 2. Whisper-compatible API (Groq, OpenAI, or Custom)
   * Uses verbose_json with segment-level timestamps
   */
  async syncWithWhisperApi({ apiKey, endpointUrl, model, audioFile, referenceLyrics, onProgress }) {
    if (onProgress) onProgress(`Uploading audio to Whisper endpoint (${model})...`);

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', model);
    formData.append('response_format', 'verbose_json');
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

    if (!data.segments || !Array.isArray(data.segments)) {
      if (data.text) {
        return [{ start: 0.0, end: 5.0, text: data.text.trim() }];
      }
      throw new Error('No segment timestamps returned from Whisper API.');
    }

    return data.segments
      .filter(seg => seg && seg.text && seg.text.trim().length > 0)
      .map(seg => ({
        start: parseFloat(seg.start) || 0,
        end: parseFloat(seg.end) || 0,
        text: seg.text.trim()
      }))
      .sort((a, b) => a.start - b.start);
  }
}
