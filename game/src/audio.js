// Starlight Salvage — every sound is synthesized with WebAudio, no audio
// files. A tiny synth: short envelopes over oscillators and filtered noise,
// so the game is silent until the player interacts (browsers require a
// gesture before audio) and stays offline-friendly.
export class SoundBank {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.enabled = true;
  }

  // Call from the first user gesture; browsers block audio before one.
  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      this.enabled = false;
      return;
    }
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.32;
    this.master.connect(this.context.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.32;
    return this.muted;
  }

  tone({ frequency, frequencyEnd, duration, type = 'sine', volume = 0.5, delay = 0 }) {
    if (!this.enabled || !this.context || this.muted) return;
    const t0 = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t0);
    if (frequencyEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, frequencyEnd), t0 + duration);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  noise({ duration, volume = 0.4, frequency = 1200, delay = 0 }) {
    if (!this.enabled || !this.context || this.muted) return;
    const t0 = this.context.currentTime + delay;
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequency;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(t0);
  }

  // A pickup blip that climbs in pitch as the combo grows.
  pickup(combo) {
    const step = Math.min(combo, 12);
    const base = 520 * Math.pow(1.059463, step);
    this.tone({ frequency: base, frequencyEnd: base * 1.5, duration: 0.12, type: 'sine', volume: 0.5 });
    this.tone({ frequency: base * 2, duration: 0.07, type: 'triangle', volume: 0.18, delay: 0.02 });
  }

  explosion() {
    this.noise({ duration: 0.35, volume: 0.55, frequency: 900 });
    this.tone({ frequency: 160, frequencyEnd: 42, duration: 0.4, type: 'sawtooth', volume: 0.4 });
  }

  pulse() {
    this.tone({ frequency: 180, frequencyEnd: 920, duration: 0.28, type: 'sine', volume: 0.45 });
    this.noise({ duration: 0.2, volume: 0.2, frequency: 2400 });
  }

  click() {
    this.tone({ frequency: 880, duration: 0.06, type: 'square', volume: 0.2 });
  }

  wave() {
    this.tone({ frequency: 392, duration: 0.12, type: 'triangle', volume: 0.35 });
    this.tone({ frequency: 523, duration: 0.14, type: 'triangle', volume: 0.35, delay: 0.1 });
  }

  win() {
    [523, 659, 784, 1047].forEach((frequency, i) => {
      this.tone({ frequency, duration: 0.22, type: 'triangle', volume: 0.4, delay: i * 0.13 });
    });
  }

  lose() {
    [392, 330, 262, 196].forEach((frequency, i) => {
      this.tone({ frequency, duration: 0.3, type: 'sawtooth', volume: 0.25, delay: i * 0.16 });
    });
  }
}
