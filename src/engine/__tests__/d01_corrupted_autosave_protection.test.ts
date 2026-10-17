import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  CORRUPTED_BACKUP_KEY,
  DEFAULT_INITIAL_SAVE,
  loadGameStateFromStorage,
  saveGameStateToStorage,
  isSaveStorageBlocked,
  getSaveRecoveryInfo,
  getCorruptedSaveRaw,
  resetSaveStorageBlock,
} from '../save';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  public quotaFailKeys: Set<string> = new Set();
  public securityError = false;

  get length() {
    return Object.keys(this.store).length;
  }
  clear(): void {
    this.store = {};
  }
  getItem(key: string): string | null {
    if (this.securityError) {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    }
    return this.store[key] ?? null;
  }
  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  setItem(key: string, value: string): void {
    if (this.securityError) {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    }
    if (this.quotaFailKeys.has(key)) {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      (err as any).code = 22;
      throw err;
    }
    this.store[key] = String(value);
  }
}

describe('Task D01: Corrupted Save Protection Against Autosave Overwrites', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
    resetSaveStorageBlock();
    vi.restoreAllMocks();
  });

  it('Scenario 1: V2 is corrupted JSON, V1 does not exist -> must quarantine V2 and block autosave from overwriting storage', () => {
    const corruptedV2 = '{"version":2,"points":999999,"broken": [unterminated';
    storage.setItem(STORAGE_KEY, corruptedV2);

    const loaded = loadGameStateFromStorage(storage);
    expect(loaded).toBeDefined();
    // Default initial save is returned to avoid crash in RAM
    expect(loaded.points).toBe(DEFAULT_INITIAL_SAVE.points);

    // D01 REQUIREMENT: Must block autosave
    expect(isSaveStorageBlocked()).toBe(true);

    const recoveryInfo = getSaveRecoveryInfo();
    expect(recoveryInfo.status).toBe('recovery-pending');
    expect(recoveryInfo.corruptedRaw).toBe(corruptedV2);

    // D01 REQUIREMENT: Corrupted string must be safely quarantined
    expect(storage.getItem(CORRUPTED_BACKUP_KEY)).toBe(corruptedV2);

    // Simulate autosave at 5s, 10s, 30s
    for (const seconds of [5, 10, 30]) {
      const saved = saveGameStateToStorage(
        { ...DEFAULT_INITIAL_SAVE, points: 50, lastSavedTimestamp: Date.now() },
        storage
      );
      expect(saved).toBe(false);
    }

    // Crucial check: STORAGE_KEY must NOT be overwritten with DEFAULT_INITIAL_SAVE!
    expect(storage.getItem(CORRUPTED_BACKUP_KEY)).toBe(corruptedV2);
    expect(storage.getItem(STORAGE_KEY)).not.toContain('"points":0');
  });

  it('Scenario 2: V2 is corrupted JSON, V1 is also corrupted -> must quarantine V2 and block autosave', () => {
    const corruptedV2 = '{"version":2,"points":888888,"corrupted":';
    const corruptedV1 = '{"version":1,"points":777777,"broken_legacy":';
    storage.setItem(STORAGE_KEY, corruptedV2);
    storage.setItem(LEGACY_STORAGE_KEY, corruptedV1);

    const loaded = loadGameStateFromStorage(storage);
    expect(loaded.points).toBe(DEFAULT_INITIAL_SAVE.points);

    // Autosave must be blocked
    expect(isSaveStorageBlocked()).toBe(true);
    expect(storage.getItem(CORRUPTED_BACKUP_KEY)).toBe(corruptedV2);
    expect(getSaveRecoveryInfo().status).toBe('recovery-pending');

    // Autosave attempts should fail
    const saveResult = saveGameStateToStorage(loaded, storage);
    expect(saveResult).toBe(false);
  });

  it('Scenario 3: V2 is corrupted, V1 does not exist, AND quarantine backup fails due to QuotaExceededError', () => {
    const corruptedV2 = '{"version":2,"points":123456,"unparsable":';
    storage.setItem(STORAGE_KEY, corruptedV2);
    // Quarantine key fails on setItem
    storage.quotaFailKeys.add(CORRUPTED_BACKUP_KEY);

    const loaded = loadGameStateFromStorage(storage);
    expect(loaded.points).toBe(DEFAULT_INITIAL_SAVE.points);

    // Autosave must be blocked because quarantine failed
    expect(isSaveStorageBlocked()).toBe(true);
    expect(getSaveRecoveryInfo().status).toBe('quarantine-failed');

    // Fail closed: original corrupted V2 in STORAGE_KEY must NOT be deleted or overwritten!
    expect(storage.getItem(STORAGE_KEY)).toBe(corruptedV2);

    const saveResult = saveGameStateToStorage(loaded, storage);
    expect(saveResult).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe(corruptedV2);
  });

  it('Scenario 4: Storage throws SecurityError (e.g. strictly blocked cookies / private iframe)', () => {
    storage.securityError = true;

    // Must not crash, should return default initial save and fail-closed
    const loaded = loadGameStateFromStorage(storage);
    expect(loaded.points).toBe(DEFAULT_INITIAL_SAVE.points);
    expect(isSaveStorageBlocked()).toBe(true);
    expect(getSaveRecoveryInfo().status).toBe('quarantine-failed');

    const saveResult = saveGameStateToStorage(loaded, storage);
    expect(saveResult).toBe(false);
  });

  it('Scenario 5: V2 is corrupted, V1 is VALID, but quarantine fails -> loads V1 in RAM but does NOT overwrite STORAGE_KEY and blocks autosave', () => {
    const corruptedV2 = '{"version":2,"points":555555,"syntax_error":';
    const validV1 = JSON.stringify({
      version: 1,
      points: 1000,
      totalPointsEarned: 1000,
      totalClicks: 100,
      upgrades: { auto_clicker: 5 },
      ownedFrogs: { green_frog: { count: 1, level: 1 } },
      mainFrogId: 'green_frog',
      settings: DEFAULT_INITIAL_SAVE.settings,
      lastSavedTimestamp: Date.now() - 10000,
    });

    storage.setItem(STORAGE_KEY, corruptedV2);
    storage.setItem(LEGACY_STORAGE_KEY, validV1);

    // Quarantine fails
    storage.quotaFailKeys.add(CORRUPTED_BACKUP_KEY);

    const loaded = loadGameStateFromStorage(storage);
    // V1 was valid so RAM has V1 points
    expect(loaded.points).toBe(1000);

    // But autosave must be blocked because quarantine failed!
    expect(isSaveStorageBlocked()).toBe(true);
    expect(getSaveRecoveryInfo().status).toBe('quarantine-failed');

    // STORAGE_KEY must still have the corrupted V2, not overwritten with V1
    expect(storage.getItem(STORAGE_KEY)).toBe(corruptedV2);

    // Autosave attempts should fail
    const saveResult = saveGameStateToStorage(loaded, storage);
    expect(saveResult).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe(corruptedV2);
  });

  it('Scenario 6: Reload after recovery failure preserves raw corrupted data and export functionality', () => {
    const corruptedV2 = '{"version":2,"points":777,"broken":true';
    storage.setItem(STORAGE_KEY, corruptedV2);

    // Initial load
    loadGameStateFromStorage(storage);
    expect(isSaveStorageBlocked()).toBe(true);
    expect(getCorruptedSaveRaw(storage)).toBe(corruptedV2);

    // Subsequent reload (simulating browser reload)
    const reloaded = loadGameStateFromStorage(storage);
    expect(reloaded).toBeDefined();
    expect(isSaveStorageBlocked()).toBe(true);
    expect(getCorruptedSaveRaw(storage)).toBe(corruptedV2);
  });
});
