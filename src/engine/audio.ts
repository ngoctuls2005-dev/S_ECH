import { Rarity } from './types';

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundEnabled: boolean = true;
  private volume: number = 0.7;
  private lastPlayTimes: Record<string, number> = {};

  constructor(soundEnabled: boolean = true, volume: number = 0.7) {
    this.soundEnabled = soundEnabled;
    this.volume = volume;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  private initContext(): boolean {
    if (typeof window === 'undefined') return false;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  private shouldThrottle(soundId: string, minIntervalMs: number): boolean {
    const now = Date.now();
    const last = this.lastPlayTimes[soundId] || 0;
    if (now - last < minIntervalMs) {
      return true;
    }
    this.lastPlayTimes[soundId] = now;
    return false;
  }

  /**
   * Tiếng click sờ ếch (squishy bubble pop)
   */
  public playClick(isCritical: boolean = false) {
    if (!this.soundEnabled) return;
    if (this.shouldThrottle('click', 40)) return; // Max 25 sounds/sec
    if (!this.initContext() || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isCritical) {
      // Âm thanh chí mạng cao vút lấp lánh
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.12);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
    } else {
      // Âm thanh bubble pop vui nhộn
      osc.type = 'sine';
      const baseFreq = 220 + Math.random() * 80;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, t + 0.06);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }

  /**
   * Tiếng ếch kêu "Ộp ộp / Ribbit"
   */
  public playRibbit(pitchMultiplier: number = 1.0) {
    if (!this.soundEnabled) return;
    if (this.shouldThrottle('ribbit', 180)) return;
    if (!this.initContext() || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Sử dụng 2 xung dao động răng cưa mô phỏng tiếng ộp ộp
    [0, 0.07].forEach((delay, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const startTime = t + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      const baseF = (idx === 0 ? 110 : 95) * pitchMultiplier;
      osc.frequency.setValueAtTime(baseF, startTime);
      osc.frequency.linearRampToValueAtTime(baseF * 1.4, startTime + 0.05);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450 * pitchMultiplier, startTime);
      filter.Q.setValueAtTime(4, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.08);
    });
  }

  /**
   * Tiếng nâng cấp thành công (Chime/Bell)
   */
  public playUpgrade() {
    if (!this.soundEnabled) return;
    if (this.shouldThrottle('upgrade', 80)) return;
    if (!this.initContext() || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // Đô - Mi - Sol (C5 - E5 - G5)

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const startTime = t + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  }

  /**
   * Tiếng trứng Gacha rung & nứt vỡ
   */
  public playEggCrack() {
    if (!this.soundEnabled) return;
    if (!this.initContext() || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  /**
   * Âm thanh nhận thưởng Gacha theo độ hiếm (Fanfare)
   */
  public playGachaReveal(rarity: Rarity) {
    if (!this.soundEnabled) return;
    if (!this.initContext() || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    let chord: number[];

    if (rarity === 'mythic') {
      // Hợp âm thắng lớn vĩ đại (C5 - E5 - G5 - C6 - E6)
      chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    } else if (rarity === 'legendary') {
      chord = [440, 554.37, 659.25, 880]; // A major
    } else if (rarity === 'epic') {
      chord = [392, 493.88, 587.33]; // G major
    } else if (rarity === 'rare') {
      chord = [349.23, 440, 523.25]; // F major
    } else {
      chord = [261.63, 329.63]; // C - E
    }

    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const startTime = t + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = rarity === 'mythic' || rarity === 'legendary' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const duration = rarity === 'mythic' ? 0.6 : 0.35;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    });
  }

  /**
   * Âm thanh mở khóa thành tựu
   */
  public playAchievement() {
    if (!this.soundEnabled) return;
    if (!this.initContext() || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    [587.33, 880, 1174.66].forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const startTime = t + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, startTime);
      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.32);
    });
  }
}

export const soundManager = new SoundManager();
