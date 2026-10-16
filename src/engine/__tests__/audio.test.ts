import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoundManager } from '../audio';

describe('Web Audio SFX Engine', () => {
  let manager: SoundManager;

  beforeEach(() => {
    manager = new SoundManager(true, 0.7);
  });

  it('initializes with default enabled state and volume', () => {
    expect(manager.isSoundEnabled()).toBe(true);
    expect(manager.getVolume()).toBe(0.7);
  });

  it('clamps volume within [0, 1]', () => {
    manager.setVolume(1.5);
    expect(manager.getVolume()).toBe(1.0);

    manager.setVolume(-0.2);
    expect(manager.getVolume()).toBe(0.0);

    manager.setVolume(0.45);
    expect(manager.getVolume()).toBe(0.45);
  });

  it('updates soundEnabled state via setSoundEnabled', () => {
    manager.setSoundEnabled(false);
    expect(manager.isSoundEnabled()).toBe(false);

    manager.setSoundEnabled(true);
    expect(manager.isSoundEnabled()).toBe(true);
  });

  it('does not throw when triggering sounds in headless environment', () => {
    expect(() => manager.playClick(false)).not.toThrow();
    expect(() => manager.playClick(true)).not.toThrow();
    expect(() => manager.playRibbit(1.2)).not.toThrow();
    expect(() => manager.playUpgrade()).not.toThrow();
    expect(() => manager.playEggCrack()).not.toThrow();
    expect(() => manager.playGachaReveal('mythic')).not.toThrow();
    expect(() => manager.playAchievement()).not.toThrow();
    expect(() => manager.playComboMilestone(5)).not.toThrow();
    expect(() => manager.playComboMilestone(10)).not.toThrow();
    expect(() => manager.playComboMilestone(20)).not.toThrow();
    expect(() => manager.playComboMilestone(50)).not.toThrow();
    expect(() => manager.playFrogGreeting('legendary')).not.toThrow();
    expect(() => manager.playFrogGreeting('mythic')).not.toThrow();
  });


  it('skips audio generation cleanly when sound is disabled', () => {
    manager.setSoundEnabled(false);
    expect(() => manager.playClick(false)).not.toThrow();
  });
});
