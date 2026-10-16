import { describe, it, expect } from 'vitest';
import {
  DEFAULT_INITIAL_SAVE,
  GameSaveData,
  saveGameStateToStorage,
  loadGameStateFromStorage,
  exportSaveToString,
  importSaveFromString,
  validateSaveData,
  clearSavedGame,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  shouldSaveAutoSnapshot,
  CURRENT_SAVE_VERSION,
} from '../save';

// Mock in-memory Web Storage
class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() {
    return Object.keys(this.store).length;
  }
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return this.store[key] || null;
  }
  key(index: number) {
    return Object.keys(this.store)[index] || null;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
  }
}

describe('Save System v2.0 & Backward Migration', () => {
  it('provides complete default initial save state for version 2', () => {
    expect(DEFAULT_INITIAL_SAVE.version).toBe(2);
    expect(DEFAULT_INITIAL_SAVE.points).toBe(0);
    expect(DEFAULT_INITIAL_SAVE.ownedFrogs['green_frog']).toBeDefined();
    expect(DEFAULT_INITIAL_SAVE.mainFrogId).toBe('green_frog');
    expect(Array.isArray(DEFAULT_INITIAL_SAVE.favoriteFrogIds)).toBe(true);
    expect(Array.isArray(DEFAULT_INITIAL_SAVE.gachaHistory)).toBe(true);
  });

  describe('Storage persistence & Legacy Fallback', () => {
    it('saves and loads game state accurately in v2 storage key', () => {
      const mockStorage = new MockStorage();
      const testState: GameSaveData = {
        ...DEFAULT_INITIAL_SAVE,
        points: 15420,
        totalClicks: 350,
      };

      const saveOk = saveGameStateToStorage(testState, mockStorage);
      expect(saveOk).toBe(true);
      expect(mockStorage.getItem(STORAGE_KEY)).not.toBeNull();

      const loaded = loadGameStateFromStorage(mockStorage);
      expect(loaded.version).toBe(2);
      expect(loaded.points).toBe(15420);
      expect(loaded.totalClicks).toBe(350);
    });

    it('seamlessly loads and migrates old v1 saves from LEGACY_STORAGE_KEY', () => {
      const mockStorage = new MockStorage();
      const legacySaveV1 = {
        version: 1,
        points: 8888,
        totalPointsEarned: 12000,
        totalClicks: 400,
        upgrades: { magic_finger: 5 },
        ownedFrogs: {
          green_frog: { id: 'green_frog', level: 2, fragments: 4, unlockedAt: 100 },
        },
        mainFrogId: 'green_frog',
        pity: { sinceLastRare: 5, sinceLastEpic: 15, sinceLastLegendary: 45 },
        unlockedAchievements: ['first_touch', 'click_100'],
        settings: { soundEnabled: true, musicEnabled: false, volume: 0.8, reducedMotion: false },
        lastSavedTimestamp: 1600000000000,
      };

      // Giả lập người chơi cũ có save v1 trong máy
      mockStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacySaveV1));

      const loaded = loadGameStateFromStorage(mockStorage);
      expect(loaded.version).toBe(2); // Đã nâng cấp lên version 2
      expect(loaded.points).toBe(8888);
      expect(loaded.totalPointsEarned).toBe(12000);
      expect(loaded.totalClicks).toBe(400);
      expect(loaded.upgrades['magic_finger']).toBe(5);
      expect(loaded.ownedFrogs['green_frog'].level).toBe(2);
      expect(loaded.unlockedAchievements).toContain('first_touch');
      expect(loaded.favoriteFrogIds).toEqual([]);
      expect(loaded.gachaHistory).toEqual([]);
    });

    it('clears saved game on reset across both v2 and legacy keys', () => {
      const mockStorage = new MockStorage();
      saveGameStateToStorage(DEFAULT_INITIAL_SAVE, mockStorage);
      mockStorage.setItem(LEGACY_STORAGE_KEY, 'old_save');

      clearSavedGame(mockStorage);
      expect(mockStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(mockStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    });
  });

  describe('Validation & Malicious Data Protection', () => {
    it('rejects negative points and NaN', () => {
      expect(validateSaveData({ points: -50 }).valid).toBe(false);
      expect(validateSaveData({ points: NaN }).valid).toBe(false);
    });

    it('rejects corrupt non-object or null payload', () => {
      expect(validateSaveData(null).valid).toBe(false);
      expect(validateSaveData('string').valid).toBe(false);
    });

    it('rejects a save created by an unsupported future game version', () => {
      const futureSave = { ...DEFAULT_INITIAL_SAVE, version: 99 };
      expect(validateSaveData(futureSave).valid).toBe(false);
    });
  });

  describe('Visibility-aware auto-save policy', () => {
    it('skips periodic snapshots while hidden', () => {
      expect(shouldSaveAutoSnapshot('hidden')).toBe(false);
      expect(shouldSaveAutoSnapshot('visible')).toBe(true);
    });
  });

  describe('Export and Import & Cross-Version Checksums', () => {
    it('exports save to encoded string with V2 format and imports it back identically', () => {
      const stateToExport: GameSaveData = {
        ...DEFAULT_INITIAL_SAVE,
        points: 99999,
        totalClicks: 1234,
        upgrades: { divine_finger: 5 },
      };

      const exportedString = exportSaveToString(stateToExport);
      expect(exportedString.startsWith('SECH_SAVE_V2_')).toBe(true);

      const importResult = importSaveFromString(exportedString);
      expect(importResult.success).toBe(true);
      expect(importResult.data?.points).toBe(99999);
      expect(importResult.data?.totalClicks).toBe(1234);
      expect(importResult.data?.upgrades['divine_finger']).toBe(5);
    });

    it('accepts and imports legacy SECH_SAVE_V1_ strings without error', () => {
      const legacyState = {
        version: 1,
        points: 77777,
        totalPointsEarned: 77777,
        totalClicks: 500,
        upgrades: { click_strength: 3 },
        ownedFrogs: { green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 0 } },
        mainFrogId: 'green_frog',
        pity: { sinceLastRare: 0, sinceLastEpic: 0, sinceLastLegendary: 0 },
        unlockedAchievements: [],
        settings: DEFAULT_INITIAL_SAVE.settings,
        lastSavedTimestamp: Date.now(),
      };

      const jsonStr = JSON.stringify(legacyState);
      const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
      // Calculate simple checksum
      let hash = 0;
      for (let i = 0; i < base64.length; i++) {
        hash = (hash << 5) - hash + base64.charCodeAt(i);
        hash |= 0;
      }
      const checksum = Math.abs(hash).toString(16).padStart(8, '0');
      const legacyString = `SECH_SAVE_V1_${checksum}_${base64}`;

      const res = importSaveFromString(legacyString);
      expect(res.success).toBe(true);
      expect(res.data?.points).toBe(77777);
      expect(res.data?.version).toBe(2); // Migrated to V2
    });
  });
});
