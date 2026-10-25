/**
 * gemini.js
 * Handles multimodal audio lyric transcription & timestamp alignment via Gemini API.
 */

export class GeminiService {
  constructor() {
    this.storageKey = 'gemini_api_key';
  }

  getSavedApiKey() {
    return localStorage.getItem(this.storageKey) || '';
  }

  saveApiKey(key) {
    if (key) {
      localStorage.setItem(this.storageKey, key.trim());
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Converts a File or Blob into pure base64 string.
   */
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
   * Call Gemini 2.5/1.5 Flash multimodal endpoint to align/transcribe lyrics with exact timestamps.
   */
  async syncLyrics({ apiKey, model, audioFile, referenceLyrics, onProgress }) {
    if (!apiKey) throw new Error('Gemini API key is required.');
    if (!audioFile) throw new Error('Please select an audio file first.');

    if (onProgress) onProgress('Encoding audio to base64...');
    const base64Audio = await this.fileToBase64(audioFile);

    // Audio mime type
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

    if (onProgress) onProgress(`Sending audio to ${model} for lyric analysis...`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Audio
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.2
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Gemini API Error: ${msg}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Gemini returned an empty response. Try again or check the audio.');
    }

    // Parse JSON
    try {
      // Strip potential markdown ticks if returned despite response_mime_type
      const cleanJson = candidateText.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      let lyricsArray = [];
      if (Array.isArray(parsed)) {
        lyricsArray = parsed;
      } else if (Array.isArray(parsed.lyrics)) {
        lyricsArray = parsed.lyrics;
      } else {
        throw new Error('Unexpected JSON structure from Gemini.');
      }

      // Validate & clean timestamps
      const formattedLyrics = lyricsArray
        .filter(item => item && typeof item.text === 'string' && item.text.trim().length > 0)
        .map(item => ({
          start: parseFloat(item.start) || 0,
          end: parseFloat(item.end) || 0,
          text: item.text.trim()
        }))
        .sort((a, b) => a.start - b.start);

      return formattedLyrics;
    } catch (parseErr) {
      console.error('Failed to parse Gemini output:', candidateText);
      throw new Error(`Failed to parse AI output: ${parseErr.message}`);
    }
  }
}