/**
 * lrc-parser.js
 * Parses LRC ([mm:ss.xx]) and SRT subtitle formats into lyric JSON timestamps.
 */

export class LrcParser {
  /**
   * Parse LRC format:
   * [00:12.50]Line 1 lyrics
   * [00:15.20]Line 2 lyrics
   */
  static parseLRC(lrcText) {
    const lines = lrcText.split('\n');
    const result = [];
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let match;
      const timestamps = [];
      while ((match = timeRegex.exec(line)) !== null) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const msRaw = match[3] || '0';
        const ms = msRaw.length === 2 ? parseInt(msRaw, 10) / 100 : parseInt(msRaw, 10) / 1000;
        timestamps.push(min * 60 + sec + ms);
      }

      const text = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
      if (text && timestamps.length > 0) {
        for (const t of timestamps) {
          result.push({ start: t, end: t + 3.5, text });
        }
      }
    }

    result.sort((a, b) => a.start - b.start);

    // Calculate smart end times based on next line start
    for (let i = 0; i < result.length; i++) {
      if (i < result.length - 1) {
        result[i].end = Math.min(result[i].start + 5.0, result[i + 1].start);
      } else {
        result[i].end = result[i].start + 4.0;
      }
    }

    return result;
  }

  /**
   * Parse SRT Subtitle format
   */
  static parseSRT(srtText) {
    const blocks = srtText.replace(/\r\n/g, '\n').split('\n\n');
    const result = [];

    const timeRegex = /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/;

    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) continue;

      let timeLineIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (timeRegex.test(lines[i])) {
          timeLineIdx = i;
          break;
        }
      }

      if (timeLineIdx !== -1) {
        const match = lines[timeLineIdx].match(timeRegex);
        if (match) {
          const start = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000;
          const end = parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7]) + parseInt(match[8]) / 1000;
          const text = lines.slice(timeLineIdx + 1).join(' ').trim();
          if (text) {
            result.push({ start, end, text });
          }
        }
      }
    }

    return result.sort((a, b) => a.start - b.start);
  }

  /**
   * Fluid Lyric Chunker:
   * Enforces that NO lyric chunk on screen ever exceeds maxWords (strict ceiling: 5 words).
   * Preserves word-level AI timestamps (words: [{word, start, end}]) across chunks.
   */
  static chunkLyricsToMaxWords(lyrics, maxWords = 4) {
    if (!Array.isArray(lyrics) || lyrics.length === 0) return [];
    const limit = Math.max(1, Math.min(5, maxWords)); // strictly 1 to 5 words!

    const chunked = [];
    for (const item of lyrics) {
      if (!item || !item.text) continue;

      const hasWordTimestamps = Array.isArray(item.words) && item.words.length > 0;
      const words = hasWordTimestamps
        ? item.words
        : item.text.trim().split(/\s+/).filter(Boolean).map(w => ({ word: w }));

      const totalWords = words.length;

      if (totalWords <= limit) {
        chunked.push({
          start: item.start,
          end: item.end,
          text: item.text.trim(),
          words: hasWordTimestamps ? words : undefined
        });
        continue;
      }

      const numChunks = Math.ceil(totalWords / limit);
      const baseSize = Math.floor(totalWords / numChunks);
      const remainder = totalWords % numChunks;

      const totalChars = words.reduce((sum, w) => sum + (w.word ? w.word.length : 1), 0) || 1;
      const duration = Math.max(0.2, (item.end || item.start + 3.0) - item.start);

      let wIdx = 0;
      let curTime = item.start;

      for (let c = 0; c < numChunks; c++) {
        const size = baseSize + (c < remainder ? 1 : 0);
        const chunkWords = words.slice(wIdx, wIdx + size);
        wIdx += size;

        let chunkStart = curTime;
        let chunkEnd = curTime;

        if (hasWordTimestamps) {
          chunkStart = chunkWords[0].start;
          chunkEnd = chunkWords[chunkWords.length - 1].end;
        } else {
          const chunkChars = chunkWords.reduce((sum, w) => sum + (w.word ? w.word.length : 1), 0);
          const chunkDur = duration * (chunkChars / totalChars);
          chunkEnd = c === numChunks - 1 ? item.end : curTime + chunkDur;
          curTime += chunkDur;
        }

        chunked.push({
          start: parseFloat(chunkStart.toFixed(2)),
          end: parseFloat(chunkEnd.toFixed(2)),
          text: chunkWords.map(w => w.word).join(' '),
          words: hasWordTimestamps ? chunkWords : undefined
        });
      }
    }

    return chunked.sort((a, b) => a.start - b.start);
  }
}
