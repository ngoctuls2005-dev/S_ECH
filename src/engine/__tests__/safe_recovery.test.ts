import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadGameStateFromStorage,
  saveGameStateToStorage,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  CORRUPTED_BACKUP_KEY,
  DEFAULT_INITIAL_SAVE,
  GameSaveData,
} from '../save';

class MockStorage implements Storage {
  public store: Record<string, string> = {};
  public blockKey: string | null = null;

  get length() {
    return Object.keys(this.store).length;
  }
  clear() {
    this.store = {};
    this.blockKey = null;
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
    if (this.blockKey && key === this.blockKey) {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      (err as any).code = 22;
      throw err;
    }
    this.store[key] = value;
  }
}

describe('Task C02: Safe Legacy Recovery & Quarantine Protection', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  // 1. V2 hỏng cú pháp JSON -> Quarantine chuỗi V2 trước khi ghi đè bằng V1
  it('quarantines corrupted V2 string into backup key before overwriting with valid V1', () => {
    const corruptedV2 = '{"version":2,"points":50000,"partial": [broken_json';
    const validV1 = {
      version: 1,
      points: 20000,
      totalPointsEarned: 25000,
      totalClicks: 1000,
      lastSavedTimestamp: 1700000000000,
    };

    mockStorage.setItem(STORAGE_KEY, corruptedV2);
    mockStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(validV1));

    const loaded = loadGameStateFromStorage(mockStorage);
    expect(loaded.points).toBe(20000);

    // Xác nhận chuỗi corruptedV2 đã được cách ly an toàn vào CORRUPTED_BACKUP_KEY
    expect(mockStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(corruptedV2);

    // Xác nhận STORAGE_KEY đã được thay thế bằng V2 mới nâng cấp từ V1
    const newV2 = JSON.parse(mockStorage.getItem(STORAGE_KEY)!);
    expect(newV2.points).toBe(20000);
    expect(newV2.version).toBe(2);
  });

  // 2. V2 parse được nhưng vi phạm validation (ví dụ điểm âm) -> Cũng được quarantine
  it('quarantines invalid V2 payload before fallback recovery', () => {
    const invalidV2 = JSON.stringify({
      version: 2,
      points: -999, // Không hợp lệ
      totalPointsEarned: 100,
      totalClicks: 10,
    });
    const validV1 = {
      version: 1,
      points: 15000,
      totalPointsEarned: 15000,
      totalClicks: 500,
    };

    mockStorage.setItem(STORAGE_KEY, invalidV2);
    mockStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(validV1));

    const loaded = loadGameStateFromStorage(mockStorage);
    expect(loaded.points).toBe(15000);
    expect(mockStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(invalidV2);
  });

  // 3. Reload sau recovery: Lần load tiếp theo nạp bình thường và giữ nguyên backup
  it('retains quarantine backup on subsequent reloads after recovery', () => {
    const corruptedV2 = '{"version":2, broken...';
    const validV1 = { version: 1, points: 10000, totalPointsEarned: 10000, totalClicks: 100 };

    mockStorage.setItem(STORAGE_KEY, corruptedV2);
    mockStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(validV1));

    // Lần 1: Khôi phục
    loadGameStateFromStorage(mockStorage);
    expect(mockStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(corruptedV2);

    // Lần 2: Reload
    const reloaded = loadGameStateFromStorage(mockStorage);
    expect(reloaded.points).toBe(10000);
    expect(mockStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(corruptedV2);
  });

  // 4. Nếu backup key đã tồn tại dữ liệu từ trước, lưu sang key mới có timestamp để bảo toàn cả 2
  it('creates a new timestamped backup when CORRUPTED_BACKUP_KEY already holds a different string', () => {
    const initialBackup = '{"original_backup": true}';
    const newCorruptedV2 = '{"version":2, second_corrupted_json...';
    const validV1 = { version: 1, points: 3000, totalPointsEarned: 3000, totalClicks: 50 };

    mockStorage.setItem(CORRUPTED_BACKUP_KEY, initialBackup);
    mockStorage.setItem(STORAGE_KEY, newCorruptedV2);
    mockStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(validV1));

    loadGameStateFromStorage(mockStorage);
    // Bản backup cũ vẫn giữ nguyên
    expect(mockStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(initialBackup);
    // Bản corruptedV2 mới được lưu vào một key riêng có tiền tố CORRUPTED_BACKUP_KEY_
    const keys = Object.keys(mockStorage.store).filter((k) => k.startsWith(CORRUPTED_BACKUP_KEY));
    expect(keys.length).toBeGreaterThanOrEqual(2);
    const newBackupKey = keys.find((k) => k !== CORRUPTED_BACKUP_KEY);
    expect(mockStorage.getItem(newBackupKey!)).toBe(newCorruptedV2);
  });

  // 5. Nếu lưu backup thất bại do Storage Quota: Không ghi đè STORAGE_KEY VÀ KHÓA AUTOSAVE tiếp theo
  it('does not overwrite STORAGE_KEY and blocks subsequent autosaves if quarantine backup fails due to quota error', () => {
    const corruptedV2 = '{"version":2, cannot_backup_this_string...';
    const validV1 = { version: 1, points: 8000, totalPointsEarned: 8000, totalClicks: 80 };

    mockStorage.setItem(STORAGE_KEY, corruptedV2);
    mockStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(validV1));

    // Chặn ghi vào CORRUPTED_BACKUP_KEY
    mockStorage.blockKey = CORRUPTED_BACKUP_KEY;

    const loaded = loadGameStateFromStorage(mockStorage);
    // Vẫn trả về V1 trong RAM để người chơi chơi được
    expect(loaded.points).toBe(8000);

    // NHƯNG STORAGE_KEY trên đĩa KHÔNG bị ghi đè (giữ nguyên corruptedV2 để cứu dữ liệu)
    expect(mockStorage.getItem(STORAGE_KEY)).toBe(corruptedV2);

    // Xóa blockKey để kiểm tra xem autosave sau đó có bị chặn hay không
    mockStorage.blockKey = null;
    const autosaveAttempt = saveGameStateToStorage(loaded, mockStorage);
    expect(autosaveAttempt).toBe(false);
    expect(mockStorage.getItem(STORAGE_KEY)).toBe(corruptedV2);
  });

  // 6. Cả V2 và V1 đều lỗi: Không ghi đè save trắng lên storage, giữ nguyên chuỗi
  it('does not write default save to storage when both V2 and V1 are corrupted', () => {
    mockStorage.setItem(STORAGE_KEY, 'corrupted_v2_string');
    mockStorage.setItem(LEGACY_STORAGE_KEY, 'corrupted_v1_string');

    const loaded = loadGameStateFromStorage(mockStorage);
    expect(loaded).toEqual(DEFAULT_INITIAL_SAVE);
    expect(mockStorage.getItem(STORAGE_KEY)).toBe('corrupted_v2_string');
  });

  // 7. V2 hợp lệ: Nạp bình thường, không chạm vào quarantine backup
  it('loads valid V2 directly without touching quarantine backup', () => {
    const validV2: GameSaveData = {
      ...DEFAULT_INITIAL_SAVE,
      points: 55555,
      totalPointsEarned: 55555,
      totalClicks: 999,
    };
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(validV2));

    const loaded = loadGameStateFromStorage(mockStorage);
    expect(loaded.points).toBe(55555);
    expect(mockStorage.getItem(CORRUPTED_BACKUP_KEY)).toBeNull();
  });
});
