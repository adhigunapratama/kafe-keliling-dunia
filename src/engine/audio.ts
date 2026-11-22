import type { MusicStyle } from '../data/countries';
import { Rng } from '../game/rng';

/**
 * Suara prosedural dengan Web Audio API: tanpa file audio sama sekali.
 * Konteks audio baru dibuat setelah sentuhan pertama (syarat iOS/Android).
 */
export type Sfx =
  | 'bell' | 'ding' | 'sizzle' | 'chop' | 'step' | 'happy' | 'sad' | 'coin' | 'pop' | 'whoosh'
  | 'boing' | 'scrub' | 'click' | 'star' | 'fanfare' | 'order' | 'plate' | 'flip' | 'tick' | 'msg';

class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  volume = 0.8;
  muted = false;
  musicOn = true;
  private music: MusicPlayer | null = null;
  private pendingStyle: MusicStyle | null = null;

  /** Panggil dari event sentuhan pertama. */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.sfxBus = ctx.createGain(); this.sfxBus.connect(this.master);
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = 0.32; this.musicBus.connect(this.master);
    this.applyVolume();
    const len = ctx.sampleRate;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (this.pendingStyle) { const s = this.pendingStyle; this.pendingStyle = null; this.playMusic(s); }
  }

  setVolume(v: number) { this.volume = v; this.applyVolume(); }
  setMuted(m: boolean) { this.muted = m; this.applyVolume(); }
  setMusicOn(on: boolean) { this.musicOn = on; if (this.musicBus) this.musicBus.gain.value = on ? 0.32 : 0; }
  private applyVolume() { if (this.master) this.master.gain.value = this.muted ? 0 : this.volume; }

  playMusic(style: MusicStyle) {
    if (!this.ctx) { this.pendingStyle = style; return; }
    this.stopMusic();
    this.music = new MusicPlayer(this.ctx, this.musicBus, style, this.noiseBuf!);
    this.setMusicOn(this.musicOn);
  }
  stopMusic() { this.music?.stop(); this.music = null; this.pendingStyle = null; }
  pauseMusic(p: boolean) { this.music?.setPaused(p); }

  private tone(freq: number, t0: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, attack = 0.005) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  private noise(t0: number, dur: number, vol: number, filter: BiquadFilterType, freq: number, q = 1) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = filter; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.05);
  }

  play(name: Sfx) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'bell':
        for (const [f, v, d] of [[1318, 0.3, 1.4], [2637, 0.12, 0.9], [3951, 0.06, 0.6], [1975, 0.08, 1.1]] as const) this.tone(f, t, d, 'sine', v);
        for (const [f, v, d] of [[1318, 0.22, 1.2], [2637, 0.1, 0.8]] as const) this.tone(f, t + 0.22, d, 'sine', v);
        break;
      case 'ding': this.tone(1760, t, 0.8, 'sine', 0.25); this.tone(3520, t, 0.4, 'sine', 0.08); break;
      case 'sizzle': this.noise(t, 0.9, 0.18, 'highpass', 4000, 0.5); break;
      case 'chop': this.noise(t, 0.08, 0.5, 'bandpass', 1800, 2); this.tone(220, t, 0.08, 'triangle', 0.25, 110); break;
      case 'step': this.noise(t, 0.05, 0.12, 'lowpass', 500); break;
      case 'happy': [0, 4, 7, 12].forEach((s, i) => this.tone(523 * 2 ** (s / 12), t + i * 0.08, 0.25, 'triangle', 0.2)); break;
      case 'sad': this.tone(392, t, 0.35, 'triangle', 0.18, 330); this.tone(330, t + 0.3, 0.45, 'triangle', 0.16, 262); break;
      case 'coin': this.tone(988, t, 0.1, 'square', 0.12); this.tone(1319, t + 0.08, 0.35, 'square', 0.12); break;
      case 'pop': this.tone(600, t, 0.12, 'sine', 0.3, 1200); break;
      case 'whoosh': this.noise(t, 0.35, 0.25, 'bandpass', 900, 0.8); break;
      case 'boing': this.tone(300, t, 0.35, 'sine', 0.3, 180); this.tone(180, t + 0.12, 0.3, 'sine', 0.2, 260); break;
      case 'scrub': this.noise(t, 0.12, 0.2, 'bandpass', 2500 + Math.random() * 1500, 3); break;
      case 'click': this.tone(880, t, 0.05, 'triangle', 0.15); break;
      case 'star': [0, 7, 12].forEach((s, i) => this.tone(784 * 2 ** (s / 12), t + i * 0.06, 0.4, 'sine', 0.2)); break;
      case 'fanfare': [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => this.tone(392 * 2 ** (s / 12), t + i * 0.12, i === 6 ? 0.8 : 0.22, 'square', 0.1)); break;
      case 'order': this.tone(660, t, 0.1, 'triangle', 0.2); this.tone(880, t + 0.09, 0.18, 'triangle', 0.2); break;
      case 'plate': this.tone(2400, t, 0.15, 'sine', 0.12); this.noise(t, 0.05, 0.1, 'highpass', 3000); break;
      case 'flip': this.noise(t, 0.12, 0.25, 'bandpass', 1200, 1); this.tone(440, t, 0.15, 'sine', 0.15, 880); break;
      case 'tick': this.tone(1200, t, 0.03, 'square', 0.06); break;
      case 'msg': this.tone(1046, t, 0.12, 'sine', 0.2); this.tone(1568, t + 0.1, 0.2, 'sine', 0.18); break;
    }
  }
}

/** Musik prosedural sederhana: bass + melodi + perkusi, dari tangga nada negara. */
class MusicPlayer {
  private timer: number;
  private step = 0;
  private nextT: number;
  private melody: (number | null)[];
  private paused = false;
  constructor(private ctx: AudioContext, private out: GainNode, private st: MusicStyle, private noiseBuf: AudioBuffer) {
    const rng = new Rng(st.root * 131 + st.bpm);
    // 4 birama x 8 ketukan setengah; jalan acak di tangga nada
    this.melody = [];
    let deg = 2;
    for (let i = 0; i < 32; i++) {
      if (rng.next() < 0.28) { this.melody.push(null); continue; }
      deg = Math.max(0, Math.min(st.scale.length * 2 - 1, deg + rng.pick([-2, -1, -1, 0, 1, 1, 2])));
      this.melody.push(deg);
    }
    // birama ke-2 dan ke-4 mengulang birama 1 sedikit berbeda (lebih mudah diingat)
    for (let i = 0; i < 8; i++) { this.melody[16 + i] = this.melody[i]; }
    this.melody[31] = 0;
    this.nextT = ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }
  setPaused(p: boolean) { this.paused = p; if (!p) this.nextT = this.ctx.currentTime + 0.05; }
  stop() { clearInterval(this.timer); }
  private freq(deg: number, oct = 0) {
    const n = this.st.scale.length;
    const semi = this.st.scale[deg % n] + 12 * (Math.floor(deg / n) + oct);
    return 440 * 2 ** ((this.st.root + semi - 69) / 12);
  }
  private schedule() {
    if (this.paused) return;
    const spb = 60 / this.st.bpm / 2; // ketukan setengah
    while (this.nextT < this.ctx.currentTime + 0.12) {
      const i = this.step % 32;
      const swing = i % 2 ? (this.st.swing ?? 0) * spb : 0;
      const t = this.nextT + swing;
      const m = this.melody[i];
      if (m !== null) this.note(this.freq(m, 1), t, spb * 0.9, this.st.lead, 0.09);
      if (this.st.bass[i % 8]) {
        const bar = Math.floor(i / 8);
        const root = [0, 3, 4, 0][bar] ?? 0;
        this.note(this.freq(root, -1), t, spb * 0.8, 'triangle', 0.22);
      }
      if (i % 2 === 0) this.hat(t, i % 4 === 0 ? 0.05 : 0.025);
      this.step++;
      this.nextT += spb;
    }
  }
  private note(f: number, t: number, d: number, type: OscillatorType, v: number) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + d + 0.02);
  }
  private hat(t: number, v: number) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    s.connect(f); f.connect(g); g.connect(this.out); s.start(t, Math.random() * 0.5); s.stop(t + 0.06);
  }
}

export const audio = new AudioEngine();

/** Getar singkat (Android; iOS Safari tidak mendukung dan diabaikan). */
export function vibrate(pattern: number | number[]) {
  try { navigator.vibrate?.(pattern); } catch { /* tidak didukung */ }
}
