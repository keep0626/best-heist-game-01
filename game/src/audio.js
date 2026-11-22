// Tiny WebAudio synth: no sound files, everything is an oscillator.
// Created lazily on the first user gesture so the browser allows it.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() { this.muted = !this.muted; return this.muted; }

  tone(freq, dur, type = 'sine', vol = 0.12, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  pickup() { this.tone(880, 0.09, 'sine', 0.10); setTimeout(() => this.tone(1318, 0.12, 'sine', 0.10), 70); }
  hackDone() { this.tone(520, 0.08, 'square', 0.06); setTimeout(() => this.tone(780, 0.08, 'square', 0.06), 80); setTimeout(() => this.tone(1040, 0.14, 'square', 0.06), 160); }
  spotted() { this.tone(220, 0.25, 'sawtooth', 0.10, 440); }
  alarmTick() { this.tone(980, 0.07, 'square', 0.05); }
  smoke() { this.tone(300, 0.3, 'sine', 0.08, 90); }
  caught() { this.tone(196, 0.5, 'sawtooth', 0.14, 49); setTimeout(() => this.tone(147, 0.6, 'sawtooth', 0.12, 37), 200); }
  win() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.12), i * 110));
  }
}
