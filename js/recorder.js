/**
 * recorder.js
 * High quality in-browser video exporter using MediaStream & MediaRecorder API.
 */

export class VideoRecorder {
  constructor({ canvas, audioStream }) {
    this.canvas = canvas;
    this.audioStream = audioStream;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
  }

  isSupported() {
    return typeof MediaRecorder !== 'undefined' && typeof this.canvas.captureStream === 'function';
  }

  start({ fps = 60, onDataAvailable, onStop }) {
    if (!this.isSupported()) {
      throw new Error('MediaRecorder API is not supported in this browser.');
    }

    const canvasStream = this.canvas.captureStream(fps);
    const tracks = [...canvasStream.getVideoTracks()];

    if (this.audioStream) {
      tracks.push(...this.audioStream.getAudioTracks());
    }

    const combinedStream = new MediaStream(tracks);

    // Pick best supported MIME type
    const possibleTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];

    let selectedMimeType = '';
    for (const type of possibleTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        break;
      }
    }

    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 12000000 // 12 Mbps for crisp 1080p
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
        if (onDataAvailable) onDataAvailable(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.isRecording = false;
      const blob = new Blob(this.recordedChunks, { type: selectedMimeType || 'video/webm' });
      if (onStop) onStop(blob);
    };

    this.mediaRecorder.start(1000); // 1-second chunks
    this.isRecording = true;
  }

  stop() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  downloadBlob(blob, filename = 'lyric-video.webm') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}