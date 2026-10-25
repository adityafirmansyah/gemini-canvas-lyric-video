/**
 * audio-player.js
 * Manages HTMLAudioElement, Web Audio API AudioContext, AnalyserNode,
 * and MediaStreamDestination for canvas video recording.
 */

export class AudioManager {
  constructor(audioElement) {
    this.audio = audioElement;
    this.audioContext = null;
    this.sourceNode = null;
    this.analyserNode = null;
    this.streamDestNode = null;
    this.isInitialized = false;

    this.frequencyData = new Uint8Array(64);
    this.timeDomainData = new Uint8Array(64);
  }

  initAudioContext() {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextClass();

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 128;
    this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.analyserNode.frequencyBinCount);

    // Media stream destination for capturing clean audio in recorder
    this.streamDestNode = this.audioContext.createMediaStreamDestination();

    // Connect source -> analyser -> destination (speaker) + streamDest (recorder)
    this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
    this.sourceNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);
    this.analyserNode.connect(this.streamDestNode);

    this.isInitialized = true;
  }

  async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  loadAudioFile(file) {
    this.initAudioContext();
    const objectUrl = URL.createObjectURL(file);
    this.audio.src = objectUrl;
    this.audio.load();
    return objectUrl;
  }

  play() {
    this.resumeContext();
    return this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  seek(timeInSeconds) {
    this.audio.currentTime = timeInSeconds;
  }

  get currentTime() {
    return this.audio.currentTime;
  }

  get duration() {
    return this.audio.duration || 0;
  }

  get isPlaying() {
    return !this.audio.paused && !this.audio.ended;
  }

  getAudioMetrics() {
    if (!this.analyserNode) {
      return { bass: 0, mid: 0, treble: 0, overall: 0, rawFreq: [] };
    }

    this.analyserNode.getByteFrequencyData(this.frequencyData);

    // Extract frequency bands (0-1 range)
    let bassSum = 0;
    for (let i = 0; i < 6; i++) bassSum += this.frequencyData[i];
    const bass = bassSum / (6 * 255);

    let midSum = 0;
    for (let i = 6; i < 24; i++) midSum += this.frequencyData[i];
    const mid = midSum / (18 * 255);

    let trebleSum = 0;
    for (let i = 24; i < 64; i++) trebleSum += this.frequencyData[i];
    const treble = trebleSum / (40 * 255);

    let totalSum = 0;
    for (let i = 0; i < 64; i++) totalSum += this.frequencyData[i];
    const overall = totalSum / (64 * 255);

    return { bass, mid, treble, overall, rawFreq: this.frequencyData };
  }

  getAudioStream() {
    if (!this.streamDestNode) return null;
    return this.streamDestNode.stream;
  }
}