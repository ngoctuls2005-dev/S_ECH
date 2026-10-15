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

describe('Save System & Import/Export', () => {
  it('provides complete default initial save state', () => {
    expect(DEFAULT_INITIAL_SAVE.version).toBe(1);
    expect(DEFAULT_INITIAL_SAVE.points).toBe(0);
    expect(DEFAULT_INITIAL_SAVE.ownedFrogs['green_frog']).toBeDefined();
    expect(DEFAULT_INITIAL_SAVE.mainFrogId).toBe('green_frog');
  });

  describe('Storage persistence', () => {
    it('saves and loads game state accurately', () => {
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
      expect(loaded.points).toBe(15420);
      expect(loaded.totalClicks).toBe(350);
    });

    it('clears saved game on reset', () => {
      const mockStorage = new MockStorage();
      saveGameStateToStorage(DEFAULT_INITIAL_SAVE, mockStorage);
      expect(mockStorage.getItem(STORAGE_KEY)).not.toBeNull();

      clearSavedGame(mockStorage);
      expect(mockStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('Validation & Malicious Data Protection', () => {
    it('rejects negative points and NaN', () => {
      expect(validateSaveData({ points: -50 }).valid).toBe(false);
      expect(validateSaveData({ points: NaN }).valid).toBe(false);
    });

    it('rejects corrupt non-object or null payload', () => {
      expect(validateSaveData(null).valid).toBe(false);
      expect(validateSaveData("string").valid).toBe(false);
    });

    it('validates and migrates sound structure', () => {
      const valid = validateSaveData({
        ...DEFAULT_INITIAL_SAVE,
        points: 500,
      });
      expect(valid.valid).toBe(true);
      expect(valid.cleanData?.points).toBe(500);
    });
  });

  describe('Export and Import & Checksum Integrity', () => {
    it('exports save to encoded string with V1 checksum format and imports it back identically', () => {
      const stateToExport: GameSaveData = {
        ...DEFAULT_INITIAL_SAVE,
        points: 99999,
        totalClicks: 1234,
        upgrades: { divine_finger: 5 },
      };

      const exportedString = exportSaveToString(stateToExport);
      expect(exportedString.startsWith('SECH_SAVE_V1_')).toBe(true);

      const importResult = importSaveFromString(exportedString);
      expect(importResult.success).toBe(true);
      expect(importResult.data?.points).toBe(99999);
      expect(importResult.data?.totalClicks).toBe(1234);
      expect(importResult.data?.upgrades['divine_finger']).toBe(5);
    });

    it('detects and rejects data corruption when checksum does not match', () => {
      const stateToExport: GameSaveData = {
        ...DEFAULT_INITIAL_SAVE,
        points: 12345,
      };
      const exportedString = exportSaveToString(stateToExport);
      
      // Cố tình sửa payload hoặc đổi 1 ký tự
      const corrupted = exportedString.slice(0, -3) + 'XYZ';
      const res = importSaveFromString(corrupted);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('maintains 100% backwards compatibility with legacy SECH_SAVE_<base64> format', () => {
      const stateToExport: GameSaveData = {
        ...DEFAULT_INITIAL_SAVE,
        points: 54321,
      };
      const jsonStr = JSON.stringify(stateToExport);
      const legacyBase64 = btoa(unescape(encodeURIComponent(jsonStr)));
      const legacyString = `SECH_SAVE_${legacyBase64}`;

      const res = importSaveFromString(legacyString);
      expect(res.success).toBe(true);
      expect(res.data?.points).toBe(54321);
    });

    it('gracefully handles damaged or invalid import strings without crashing', () => {
      const damaged = 'SECH_SAVE_invalid_base64_garbage!@#';
      const res = importSaveFromString(damaged);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('Storage Quota handling', () => {
    it('safely handles QuotaExceededError without crashing', () => {
      const quotaStorage = {
        setItem: () => {
          const err = new Error('Quota exceeded');
          err.name = 'QuotaExceededError';
          throw err;
        },
        getItem: () => null,
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null,
      } as unknown as Storage;

      const res = saveGameStateToStorage(DEFAULT_INITIAL_SAVE, quotaStorage);
      expect(res).toBe(false);
    });
  });
});

