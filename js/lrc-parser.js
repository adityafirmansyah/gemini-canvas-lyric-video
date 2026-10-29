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
   * Distributes line duration proportionally based on character weight.
   */
  static chunkLyricsToMaxWords(lyrics, maxWords = 4) {
    if (!Array.isArray(lyrics) || lyrics.length === 0) return [];
    const limit = Math.max(1, Math.min(5, maxWords)); // strictly 1 to 5 words!

    const chunked = [];
    for (const item of lyrics) {
      if (!item || !item.text) continue;
      const words = item.text.trim().split(/\s+/).filter(Boolean);
      const totalWords = words.length;

      if (totalWords <= limit) {
        chunked.push(item);
        continue;
      }

      const numChunks = Math.ceil(totalWords / limit);
      const baseSize = Math.floor(totalWords / numChunks);
      const remainder = totalWords % numChunks;

      const totalChars = words.reduce((sum, w) => sum + w.length, 0) || 1;
      const duration = Math.max(0.2, (item.end || item.start + 3.0) - item.start);

      let wIdx = 0;
      let curTime = item.start;

      for (let c = 0; c < numChunks; c++) {
        const size = baseSize + (c < remainder ? 1 : 0);
        const chunkWords = words.slice(wIdx, wIdx + size);
        wIdx += size;

        const chunkChars = chunkWords.reduce((sum, w) => sum + w.length, 0);
        const chunkDur = duration * (chunkChars / totalChars);
        const chunkEnd = c === numChunks - 1 ? item.end : curTime + chunkDur;

        chunked.push({
          start: parseFloat(curTime.toFixed(2)),
          end: parseFloat(chunkEnd.toFixed(2)),
          text: chunkWords.join(' ')
        });

        curTime += chunkDur;
      }
    }

    return chunked.sort((a, b) => a.start - b.start);
  }
}
