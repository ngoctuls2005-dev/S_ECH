import { describe, it, expect, beforeEach } from 'vitest';
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
  LEGACY_FAVORITES_KEY,
  LEGACY_GACHA_HISTORY_KEY,
  shouldSaveAutoSnapshot,
  CURRENT_SAVE_VERSION,
  calculateSaveChecksumV1,
  calculateSaveChecksumV2,
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

describe('Save System v3.0 Audit & Strict Data Recovery', () => {
  it('provides complete default initial save state for version 2', () => {
    expect(DEFAULT_INITIAL_SAVE.version).toBe(2);
    expect(DEFAULT_INITIAL_SAVE.points).toBe(0);
    expect(DEFAULT_INITIAL_SAVE.highestCombo).toBe(0);
    expect(DEFAULT_INITIAL_SAVE.totalCrits).toBe(0);
    expect(DEFAULT_INITIAL_SAVE.totalGachaPulls).toBe(0);
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
        highestCombo: 25,
        totalCrits: 14,
        totalGachaPulls: 10,
        favoriteFrogIds: ['green_frog'],
        gachaHistory: [
          {
            id: 'test_hist_1',
            timestamp: 123456789,
            poolId: 'ao_sen',
            frogId: 'green_frog',
            frogNameVi: 'Ếch Xanh Bản Địa',
            rarity: 'common',
            isNew: false,
            fragmentsAdded: 1,
          },
        ],
      };

      const saveOk = saveGameStateToStorage(testState, mockStorage);
      expect(saveOk).toBe(true);
      expect(mockStorage.getItem(STORAGE_KEY)).not.toBeNull();

      const loaded = loadGameStateFromStorage(mockStorage);
      expect(loaded.version).toBe(2);
      expect(loaded.points).toBe(15420);
      expect(loaded.totalClicks).toBe(350);
      expect(loaded.highestCombo).toBe(25);
      expect(loaded.totalCrits).toBe(14);
      expect(loaded.totalGachaPulls).toBe(10);
      expect(loaded.favoriteFrogIds).toEqual(['green_frog']);
      expect(loaded.gachaHistory.length).toBe(1);
    });

    it('seamlessly loads and migrates old v1 saves from LEGACY_STORAGE_KEY', () => {
      const mockStorage = new MockStorage();
      const legacySaveV1 = {
        version: 1,
        points: 8888,
        totalPointsEarned: 12000,
        totalClicks: 400,
        upgrades: { divine_finger: 5 },
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
      expect(loaded.highestCombo).toBe(0);
      expect(loaded.totalCrits).toBe(0);
      expect(loaded.totalGachaPulls).toBe(0);
      expect(loaded.upgrades['divine_finger']).toBe(5);
      expect(loaded.ownedFrogs['green_frog'].level).toBe(2);
      expect(loaded.unlockedAchievements).toContain('first_touch');
      expect(loaded.favoriteFrogIds).toEqual([]);
      expect(loaded.gachaHistory).toEqual([]);
    });

    it('clears saved game on reset across v2, legacy v1, favorites and gacha history keys', () => {
      const mockStorage = new MockStorage();
      saveGameStateToStorage(DEFAULT_INITIAL_SAVE, mockStorage);
      mockStorage.setItem(LEGACY_STORAGE_KEY, 'old_save');
      mockStorage.setItem(LEGACY_FAVORITES_KEY, '["green_frog"]');
      mockStorage.setItem(LEGACY_GACHA_HISTORY_KEY, '[{"frogId":"green_frog"}]');

      clearSavedGame(mockStorage);
      expect(mockStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(mockStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
      expect(mockStorage.getItem(LEGACY_FAVORITES_KEY)).toBeNull();
      expect(mockStorage.getItem(LEGACY_GACHA_HISTORY_KEY)).toBeNull();
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

    it('sanitizes unknown frog ID safely and retains valid frogs', () => {
      const saveWithUnknownFrog = {
        ...DEFAULT_INITIAL_SAVE,
        ownedFrogs: {
          green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 0 },
          alien_frog_xyz_999: { id: 'alien_frog_xyz_999', level: 5, fragments: 10, unlockedAt: 0 },
        },
      };

      const validation = validateSaveData(saveWithUnknownFrog);
      expect(validation.valid).toBe(true);
      expect(validation.cleanData?.ownedFrogs['green_frog']).toBeDefined();
      expect(validation.cleanData?.ownedFrogs['alien_frog_xyz_999']).toBeUndefined();
    });

    it('handles abnormal timestamps gracefully', () => {
      const saveAbnormalTimestamp = {
        ...DEFAULT_INITIAL_SAVE,
        lastSavedTimestamp: -99999,
      };

      const validation = validateSaveData(saveAbnormalTimestamp);
      expect(validation.valid).toBe(true);
      expect(validation.cleanData?.lastSavedTimestamp).toBeGreaterThan(0);
    });

    it('safely handles extremely large safe integer numbers without overflow or NaN', () => {
      const bigSave = {
        ...DEFAULT_INITIAL_SAVE,
        points: Number.MAX_SAFE_INTEGER,
        totalPointsEarned: Number.MAX_SAFE_INTEGER,
      };

      const validation = validateSaveData(bigSave);
      expect(validation.valid).toBe(true);
      expect(validation.cleanData?.points).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('Export, Import & Version-Specific Checksums', () => {
    it('exports save to encoded string with V2 format and imports it back identically', () => {
      const stateToExport: GameSaveData = {
        ...DEFAULT_INITIAL_SAVE,
        points: 99999,
        totalClicks: 1234,
        highestCombo: 35,
        totalCrits: 12,
        totalGachaPulls: 20,
        upgrades: { divine_finger: 5 },
        favoriteFrogIds: ['green_frog'],
      };

      const exportedString = exportSaveToString(stateToExport);
      expect(exportedString.startsWith('SECH_SAVE_V2_')).toBe(true);

      const importResult = importSaveFromString(exportedString);
      expect(importResult.success).toBe(true);
      expect(importResult.data?.points).toBe(99999);
      expect(importResult.data?.totalClicks).toBe(1234);
      expect(importResult.data?.highestCombo).toBe(35);
      expect(importResult.data?.totalCrits).toBe(12);
      expect(importResult.data?.totalGachaPulls).toBe(20);
      expect(importResult.data?.upgrades['divine_finger']).toBe(5);
      expect(importResult.data?.favoriteFrogIds).toEqual(['green_frog']);
    });

    it('authenticates and imports authentic legacy SECH_SAVE_V1_ string using genuine DJB2 checksum', () => {
      const legacyState = {
        version: 1,
        points: 77777,
        totalPointsEarned: 77777,
        totalClicks: 500,
        upgrades: { divine_finger: 3 },
        ownedFrogs: { green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 0 } },
        mainFrogId: 'green_frog',
        pity: { sinceLastRare: 0, sinceLastEpic: 0, sinceLastLegendary: 0 },
        unlockedAchievements: [],
        settings: DEFAULT_INITIAL_SAVE.settings,
        lastSavedTimestamp: Date.now(),
      };

      const jsonStr = JSON.stringify(legacyState);
      const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
      
      // Calculate GENUINE V1 DJB2 CHECKSUM (seed 5381)
      const checksumV1 = calculateSaveChecksumV1(base64);
      const authenticV1String = `SECH_SAVE_V1_${checksumV1}_${base64}`;

      const res = importSaveFromString(authenticV1String);
      expect(res.success).toBe(true);
      expect(res.data?.points).toBe(77777);
      expect(res.data?.version).toBe(2); // Auto migrated to V2
      expect(res.data?.highestCombo).toBe(0);
      expect(res.data?.totalCrits).toBe(0);
      expect(res.data?.totalGachaPulls).toBe(0);
    });

    it('rejects corrupt save string with manipulated checksum or payload', () => {
      const validState = { ...DEFAULT_INITIAL_SAVE, points: 500 };
      const jsonStr = JSON.stringify(validState);
      const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
      const validChecksum = calculateSaveChecksumV2(base64);

      // Manipulate checksum
      const badChecksumString = `SECH_SAVE_V2_ffffffff_${base64}`;
      const res1 = importSaveFromString(badChecksumString);
      expect(res1.success).toBe(false);
      expect(res1.error).toContain('Checksum');

      // Truncate base64 payload
      const truncatedPayloadString = `SECH_SAVE_V2_${validChecksum}_${base64.slice(0, -5)}`;
      const res2 = importSaveFromString(truncatedPayloadString);
      expect(res2.success).toBe(false);
      expect(res2.error).toContain('Checksum');
    });

    it('imports backward-compatible SECH_SAVE_ legacy format without checksum', () => {
      const legacyState = { ...DEFAULT_INITIAL_SAVE, points: 12345 };
      const jsonStr = JSON.stringify(legacyState);
      const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
      const legacyNoChecksumString = `SECH_SAVE_${base64}`;

      const res = importSaveFromString(legacyNoChecksumString);
      expect(res.success).toBe(true);
      expect(res.data?.points).toBe(12345);
    });
  });

  describe('Visibility-aware auto-save policy', () => {
    it('skips periodic snapshots while hidden', () => {
      expect(shouldSaveAutoSnapshot('hidden')).toBe(false);
      expect(shouldSaveAutoSnapshot('visible')).toBe(true);
    });
  });
});
