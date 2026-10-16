import { Rarity } from './types';

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundEnabled: boolean = true;
  private volume: number = 0.7;
  private lastPlayTimes: Record<string, number> = {};
  private musicEnabled: boolean = false;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;

  constructor(soundEnabled: boolean = true, volume: number = 0.7) {
    this.soundEnabled = soundEnabled;
    this.volume = volume;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (enabled) {
      // This setter is called by the settings control, which is a user gesture.
      if (this.initContext()) this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  public setMusicPreference(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) this.stopMusic();
  }

  /** Call from a user gesture so the browser can start audio playback. */
  public unlockAudio() {
    if (!this.initContext()) return;
    if (this.musicEnabled) this.startMusic();
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

  private startMusic() {
    if (!this.musicEnabled || !this.initContext() || !this.ctx || !this.masterGain || this.musicGain) return;

    const musicGain = this.ctx.createGain();
    musicGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 1.2);
    musicGain.connect(this.masterGain);
    this.musicGain = musicGain;
    this.musicStep = 0;

    // A small pentatonic pond melody, synthesized locally so it works offline.
    const notes = [196, 246.94, 293.66, 246.94, 220, 261.63, 329.63, 261.63];
    const playNextNote = () => {
      if (!this.musicEnabled || !this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const noteGain = this.ctx.createGain();
      const oscillator = this.ctx.createOscillator();
      const frequency = notes[this.musicStep % notes.length];
      this.musicStep += 1;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, t);
      noteGain.gain.setValueAtTime(0.0001, t);
      noteGain.gain.linearRampToValueAtTime(0.16, t + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
      oscillator.connect(noteGain);
      noteGain.connect(this.musicGain);
      oscillator.start(t);
      oscillator.stop(t + 0.8);

      this.musicTimer = window.setTimeout(playNextNote, 900);
    };

    playNextNote();
  }

  private stopMusic() {
    if (this.musicTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }

    if (this.musicGain && this.ctx) {
      const oldGain = this.musicGain;
      oldGain.gain.cancelScheduledValues(this.ctx.currentTime);
      oldGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.04);
      window.setTimeout(() => oldGain.disconnect(), 250);
      this.musicGain = null;
    }
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
   * Âm thanh đạt mốc Combo (5, 10, 20, 50)
   */
  public playComboMilestone(milestone: 5 | 10 | 20 | 50) {
    if (!this.soundEnabled) return;
    if (!this.initContext() || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    let notes: number[];

    if (milestone === 50) {
      notes = [523.25, 659.25, 783.99, 1046.50]; // Đô5 - Mi5 - Sol5 - Đô6 (Grand fanfare)
    } else if (milestone === 20) {
      notes = [440, 554.37, 659.25]; // La4 - Đô#5 - Mi5 (Trio chime)
    } else if (milestone === 10) {
      notes = [392, 523.25]; // Sol4 - Đô5 (Duo pop)
    } else {
      notes = [329.63, 392]; // Mi4 - Sol4 (Minor pop)
    }

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const startTime = t + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  }

  /**
   * Biến thể tiếng ếch chào hỏi khi đổi ếch chính theo độ hiếm
   */
  public playFrogGreeting(rarity: Rarity = 'common') {
    if (rarity === 'mythic') {
      this.playRibbit(1.3);
      this.playComboMilestone(20);
    } else if (rarity === 'legendary') {
      this.playRibbit(1.15);
      this.playComboMilestone(10);
    } else if (rarity === 'epic') {
      this.playRibbit(0.85); // Giọng trầm uy lực
    } else {
      this.playRibbit(1.0);
    }
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
