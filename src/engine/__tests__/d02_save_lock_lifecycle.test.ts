import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  CORRUPTED_BACKUP_KEY,
  DEFAULT_INITIAL_SAVE,
  loadGameStateFromStorage,
  saveGameStateToStorage,
  isSaveStorageBlocked,
  resetSaveStorageBlock,
  clearSavedGame,
  clearQuarantineBackups,
  createDefaultSaveSessionContext,
  exportSaveToString,
  importSaveFromString,
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

describe('Task D02: Save Lock Lifecycle, Reset vs Quarantine, and Context Isolation', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
    resetSaveStorageBlock();
    vi.restoreAllMocks();
  });

  it('Scenario 1: Reset gameplay preserves primary and timestamped quarantine backups, initializes fresh save, and unblocks autosave', () => {
    const corruptedV2 = '{"version":2,"points":999999,"broken":true';
    const oldBackup = '{"version":2,"points":111111,"old_broken":true';
    const timestampKey = `${CORRUPTED_BACKUP_KEY}_1700000000000`;

    // Storage has an existing backup and a new corrupted V2
    storage.setItem(CORRUPTED_BACKUP_KEY, oldBackup);
    storage.setItem(timestampKey, oldBackup);
    storage.setItem(STORAGE_KEY, corruptedV2);

    // Initial load triggers recovery-pending
    loadGameStateFromStorage(storage);
    expect(isSaveStorageBlocked()).toBe(true);

    // Player decides to reset gameplay
    clearSavedGame(storage, { preserveQuarantineBackup: true });

    // VERIFY: STORAGE_KEY is cleared, but ALL quarantine backups are preserved!
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem(CORRUPTED_BACKUP_KEY)).toBe(oldBackup);
    expect(storage.getItem(timestampKey)).toBe(oldBackup);

    // Write fresh initial save with manual resolution
    const saved = saveGameStateToStorage(
      DEFAULT_INITIAL_SAVE,
      storage,
      undefined,
      { isManualUserResolution: true }
    );
    expect(saved).toBe(true);

    // VERIFY: Save lock is now safely released!
    expect(isSaveStorageBlocked()).toBe(false);

    // VERIFY: Subsequent background autosaves work normally
    const autosaved = saveGameStateToStorage(
      { ...DEFAULT_INITIAL_SAVE, points: 100, lastSavedTimestamp: Date.now() },
      storage
    );
    expect(autosaved).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toContain('"points":100');

    // VERIFY: Reloading browser loads the fresh game cleanly without triggering recovery lock
    const reloaded = loadGameStateFromStorage(storage);
    expect(reloaded.points).toBe(100);
    expect(isSaveStorageBlocked()).toBe(false);
  });

  it('Scenario 2: Explicit clearQuarantineBackups purges quarantine backups only when specifically requested', () => {
    storage.setItem(CORRUPTED_BACKUP_KEY, 'corrupted_1');
    storage.setItem(`${CORRUPTED_BACKUP_KEY}_123`, 'corrupted_2');
    storage.setItem(STORAGE_KEY, 'valid_game');

    // Normal gameplay reset keeps backups
    clearSavedGame(storage, { preserveQuarantineBackup: true });
    expect(storage.getItem(CORRUPTED_BACKUP_KEY)).toBe('corrupted_1');
    expect(storage.getItem(`${CORRUPTED_BACKUP_KEY}_123`)).toBe('corrupted_2');

    // Explicit purge removes all quarantine keys
    clearQuarantineBackups(storage);
    expect(storage.getItem(CORRUPTED_BACKUP_KEY)).toBeNull();
    expect(storage.getItem(`${CORRUPTED_BACKUP_KEY}_123`)).toBeNull();
  });

  it('Scenario 3: Valid import during recovery-pending successfully unlocks storage, preserves backup, and reloads correctly', () => {
    const corruptedV2 = '{"version":2,"points":555555,"syntax_error":';
    storage.setItem(STORAGE_KEY, corruptedV2);

    loadGameStateFromStorage(storage);
    expect(isSaveStorageBlocked()).toBe(true);
    expect(storage.getItem(CORRUPTED_BACKUP_KEY)).toBe(corruptedV2);

    // Player imports a valid exported save
    const validSave = {
      ...DEFAULT_INITIAL_SAVE,
      points: 12345,
      totalClicks: 99,
      lastSavedTimestamp: Date.now(),
    };
    const exportString = exportSaveToString(validSave);
    const parseResult = importSaveFromString(exportString);
    expect(parseResult.success).toBe(true);
    expect(parseResult.data).toBeDefined();

    // Save with isManualUserResolution: true
    const importSaved = saveGameStateToStorage(
      parseResult.data!,
      storage,
      undefined,
      { isManualUserResolution: true }
    );
    expect(importSaved).toBe(true);

    // VERIFY: Storage lock is released
    expect(isSaveStorageBlocked()).toBe(false);

    // VERIFY: Corrupted backup is still safely preserved in quarantine
    expect(storage.getItem(CORRUPTED_BACKUP_KEY)).toBe(corruptedV2);

    // VERIFY: Reloading browser loads the imported save
    const reloaded = loadGameStateFromStorage(storage);
    expect(reloaded.points).toBe(12345);
    expect(isSaveStorageBlocked()).toBe(false);
  });

  it('Scenario 4: Invalid import string or quota error fails closed and does not unlock storage', () => {
    const corruptedV2 = '{"version":2,"points":555555,"syntax_error":';
    storage.setItem(STORAGE_KEY, corruptedV2);

    loadGameStateFromStorage(storage);
    expect(isSaveStorageBlocked()).toBe(true);

    // Invalid import string
    const invalidResult = importSaveFromString('SECH_SAVE_V2_invalidchecksum_badbase64');
    expect(invalidResult.success).toBe(false);

    // Lock remains active
    expect(isSaveStorageBlocked()).toBe(true);

    // Quota error during save
    storage.quotaFailKeys.add(STORAGE_KEY);
    const saveAttempt = saveGameStateToStorage(
      DEFAULT_INITIAL_SAVE,
      storage,
      undefined,
      { isManualUserResolution: true }
    );
    expect(saveAttempt).toBe(false);

    // Lock must STILL remain active because write failed!
    expect(isSaveStorageBlocked()).toBe(true);
  });

  it('Scenario 5: Context isolation prevents state leakage between independent SaveSessionContext instances', () => {
    const contextA = createDefaultSaveSessionContext();
    const contextB = createDefaultSaveSessionContext();

    // Lock context A
    contextA.isAutoSaveBlocked = true;
    contextA.recoveryInfo = { status: 'recovery-pending', timestamp: Date.now() };

    // Context B must remain completely unaffected
    expect(isSaveStorageBlocked(contextA)).toBe(true);
    expect(isSaveStorageBlocked(contextB)).toBe(false);

    // Saving with context A fails
    const saveA = saveGameStateToStorage(DEFAULT_INITIAL_SAVE, storage, contextA);
    expect(saveA).toBe(false);

    // Saving with context B succeeds
    const saveB = saveGameStateToStorage(DEFAULT_INITIAL_SAVE, storage, contextB);
    expect(saveB).toBe(true);
  });

  it('Scenario 6: Multi-tab conflict prevention rejects outdated autosaves when another tab has saved newer data', () => {
    // Tab B saved at timestamp 50000 with 1000 points
    const tabBData = {
      ...DEFAULT_INITIAL_SAVE,
      points: 1000,
      lastSavedTimestamp: 50000,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(tabBData));

    // Tab A (running in background or with stale clock) tries to autosave with timestamp 40000
    const tabAStaleSnapshot = {
      ...DEFAULT_INITIAL_SAVE,
      points: 200,
      lastSavedTimestamp: 40000,
    };

    const autosaved = saveGameStateToStorage(tabAStaleSnapshot, storage);
    // MUST BE REJECTED!
    expect(autosaved).toBe(false);

    // Storage still contains Tab B's newer save!
    const persisted = JSON.parse(storage.getItem(STORAGE_KEY)!);
    expect(persisted.points).toBe(1000);
    expect(persisted.lastSavedTimestamp).toBe(50000);
  });

  it('Scenario 7: Generates unique quarantine keys without collision and properly handles empty string backups', () => {
    // Primary backup already contains an empty string ""
    storage.setItem(CORRUPTED_BACKUP_KEY, '');

    const corruptedV2 = '{"version":2,"broken":123';
    storage.setItem(STORAGE_KEY, corruptedV2);

    loadGameStateFromStorage(storage);

    // Primary empty backup is preserved
    expect(storage.getItem(CORRUPTED_BACKUP_KEY)).toBe('');

    // A unique timestamped backup key is created for the new corrupted V2
    const keys = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i)!;
      if (k.startsWith(CORRUPTED_BACKUP_KEY) && k !== CORRUPTED_BACKUP_KEY) {
        keys.push(k);
      }
    }
    expect(keys.length).toBeGreaterThan(0);
    expect(storage.getItem(keys[0])).toBe(corruptedV2);
  });

  it('Scenario 8: Migration re-verifies STORAGE_KEY before writing V1 to avoid race condition with another tab', () => {
    const corruptedV2 = '{"version":2,"corrupted_string":true';
    const validV1 = JSON.stringify({
      version: 1,
      points: 500,
      totalPointsEarned: 500,
      totalClicks: 50,
      upgrades: {},
      ownedFrogs: { green_frog: { count: 1, level: 1 } },
      mainFrogId: 'green_frog',
      settings: DEFAULT_INITIAL_SAVE.settings,
      lastSavedTimestamp: 10000,
    });

    storage.setItem(STORAGE_KEY, corruptedV2);
    storage.setItem(LEGACY_STORAGE_KEY, validV1);

    // Simulate that right during read/quarantine, another tab updated STORAGE_KEY
    const originalGetItem = storage.getItem.bind(storage);
    let getItemCount = 0;
    vi.spyOn(storage, 'getItem').mockImplementation((key: string) => {
      getItemCount++;
      // After initial read, change STORAGE_KEY to simulate external tab write
      if (key === STORAGE_KEY && getItemCount > 3) {
        return '{"version":2,"saved_by_tab_b":true}';
      }
      return originalGetItem(key);
    });

    const loaded = loadGameStateFromStorage(storage);
    expect(loaded.points).toBe(500);
    // Since recheck failed, autosave was blocked to prevent race condition
    expect(isSaveStorageBlocked()).toBe(true);
  });
});
