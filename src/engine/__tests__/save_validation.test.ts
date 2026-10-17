import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateSaveData,
  migrateSaveData,
  loadGameStateFromStorage,
  saveGameStateToStorage,
  importSaveFromString,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  DEFAULT_INITIAL_SAVE,
  GameSaveData,
} from '../save';

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

describe('Task R08: Save Validation, Sanitization and Recovery Test Suite', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  // 1. Upgrade ID không tồn tại & level không hợp lệ
  it('sanitizes upgrade list: strips invalid IDs and clamps invalid levels', () => {
    const raw = {
      ...DEFAULT_INITIAL_SAVE,
      points: 100,
      totalPointsEarned: 100,
      totalClicks: 10,
      upgrades: {
        non_existent_machine: 50, // ID rác không tồn tại
        divine_finger: 3,         // Hợp lệ
        frog_touch_machine: -10,  // Level âm -> bị lọc hoặc ép về 0
      },
    };

    const result = validateSaveData(raw);
    expect(result.valid).toBe(true);
    expect(result.cleanData?.upgrades['non_existent_machine']).toBeUndefined();
    expect(result.cleanData?.upgrades['divine_finger']).toBe(3);
    expect(result.cleanData?.upgrades['frog_touch_machine']).toBeUndefined();
  });

  // 2. Cấp ếch và số mảnh quá lớn hoặc bất thường
  it('clamps excessive frog levels and fragments within safe boundaries', () => {
    const raw = {
      ...DEFAULT_INITIAL_SAVE,
      points: 500,
      totalPointsEarned: 500,
      totalClicks: 50,
      ownedFrogs: {
        green_frog: {
          id: 'green_frog',
          level: 999999,          // Quá lớn
          fragments: 9999999999,   // Quá lớn
          unlockedAt: 1700000000000,
        },
      },
    };

    const result = validateSaveData(raw);
    expect(result.valid).toBe(true);
    expect(result.cleanData?.ownedFrogs['green_frog'].level).toBe(50);
    expect(result.cleanData?.ownedFrogs['green_frog'].fragments).toBe(10_000_000);
  });

  // 3. Gacha Pity bất thường
  it('clamps abnormal pity values to their natural maximum threshold', () => {
    const raw = {
      ...DEFAULT_INITIAL_SAVE,
      points: 100,
      totalPointsEarned: 100,
      totalClicks: 10,
      pity: {
        sinceLastRare: 99,       // Max 10
        sinceLastEpic: -5,       // Âm -> 0
        sinceLastLegendary: 250, // Max 100
      },
    };

    const result = validateSaveData(raw);
    expect(result.valid).toBe(true);
    expect(result.cleanData?.pity.sinceLastRare).toBe(10);
    expect(result.cleanData?.pity.sinceLastEpic).toBe(0);
    expect(result.cleanData?.pity.sinceLastLegendary).toBe(100);
  });

  // 4. Gacha history thiếu trường hoặc sai loại dữ liệu
  it('repairs broken gacha history entries and discards corrupted ones', () => {
    const raw = {
      ...DEFAULT_INITIAL_SAVE,
      points: 100,
      totalPointsEarned: 100,
      totalClicks: 10,
      gachaHistory: [
        {
          // Thiếu id, frogNameVi, rarity, poolId
          frogId: 'green_frog',
          timestamp: 1700000000000,
        },
        {
          // frogId không tồn tại
          frogId: 'corrupted_alien_frog',
          timestamp: 1700000000000,
        },
        'not even an object',
      ],
    };

    const result = validateSaveData(raw);
    expect(result.valid).toBe(true);
    expect(result.cleanData?.gachaHistory.length).toBe(1);
    const entry = result.cleanData?.gachaHistory[0];
    expect(entry?.frogId).toBe('green_frog');
    expect(entry?.frogNameVi).toBe('Ếch Xanh Cơ Bản');
    expect(entry?.rarity).toBe('common');
    expect(entry?.poolId).toBe('ao_sen');
    expect(entry?.id).toBeDefined();
  });

  // 5. Favorite IDs bị lặp
  it('deduplicates favorite frog IDs and filters out non-existent frogs', () => {
    const raw = {
      ...DEFAULT_INITIAL_SAVE,
      points: 100,
      totalPointsEarned: 100,
      totalClicks: 10,
      favoriteFrogIds: ['green_frog', 'green_frog', 'non_existent_frog', 'tomato_frog', 'green_frog'],
    };

    const result = validateSaveData(raw);
    expect(result.valid).toBe(true);
    expect(result.cleanData?.favoriteFrogIds).toEqual(['green_frog', 'tomato_frog']);
  });

  // 6. Achievement IDs không tồn tại
  it('filters out non-existent achievement IDs and removes duplicates', () => {
    const raw = {
      ...DEFAULT_INITIAL_SAVE,
      points: 100,
      totalPointsEarned: 100,
      totalClicks: 10,
      unlockedAchievements: ['first_touch', 'hacked_achievement_999', 'first_touch', 'click_100'],
    };

    const result = validateSaveData(raw);
    expect(result.valid).toBe(true);
    expect(result.cleanData?.unlockedAchievements).toEqual(['first_touch', 'click_100']);
  });

  // 7. Timestamp nằm trong tương lai
  it('clamps future timestamps exceeding safe threshold back to current time', () => {
    const farFuture = Date.now() + 100_000_000_000;
    const raw = {
      ...DEFAULT_INITIAL_SAVE,
      points: 100,
      totalPointsEarned: 100,
      totalClicks: 10,
      lastSavedTimestamp: farFuture,
    };

    const result = validateSaveData(raw);
    expect(result.valid).toBe(true);
    expect(result.cleanData?.lastSavedTimestamp).toBeLessThanOrEqual(Date.now() + 1000);
  });

  // 8. Điểm vượt Number.MAX_SAFE_INTEGER
  it('rejects saves with points or clicks exceeding Number.MAX_SAFE_INTEGER', () => {
    const rawOverPoints = {
      ...DEFAULT_INITIAL_SAVE,
      points: Number.MAX_SAFE_INTEGER + 1000,
      totalPointsEarned: 100,
      totalClicks: 10,
    };
    expect(validateSaveData(rawOverPoints).valid).toBe(false);
    expect(validateSaveData(rawOverPoints).error).toMatch(/MAX_SAFE_INTEGER|an toàn/i);

    const rawOverEarned = {
      ...DEFAULT_INITIAL_SAVE,
      points: 100,
      totalPointsEarned: Number.MAX_SAFE_INTEGER + 1000,
      totalClicks: 10,
    };
    expect(validateSaveData(rawOverEarned).valid).toBe(false);

    const rawOverClicks = {
      ...DEFAULT_INITIAL_SAVE,
      points: 100,
      totalPointsEarned: 100,
      totalClicks: Number.MAX_SAFE_INTEGER + 1000,
    };
    expect(validateSaveData(rawOverClicks).valid).toBe(false);
  });

  // 9. Dữ liệu JSON hợp lệ về cú pháp nhưng sai cấu trúc
  it('returns clean error message for syntactically valid JSON with invalid structures', () => {
    // Array thay vì Record
    const res1 = importSaveFromString('[1, 2, 3]');
    expect(res1.success).toBe(false);
    expect(res1.error).toMatch(/đối tượng hợp lệ/i);

    // Chuỗi thuần
    const res2 = importSaveFromString('"just a string"');
    expect(res2.success).toBe(false);

    // Object thiếu trường bắt buộc
    const res3 = importSaveFromString('{"someKey": 123}');
    expect(res3.success).toBe(false);
    expect(res3.error).toMatch(/Điểm số không hợp lệ/i);
  });

  // 10. Save v2 hỏng nhưng vẫn có bản v1 hợp lệ -> Tự động phục hồi
  it('recovers player state from legacy v1 save when v2 storage is corrupted', () => {
    // v2 bị hỏng (JSON rác)
    mockStorage.setItem(STORAGE_KEY, '{"version": 2, "broken": [invalid json');

    // v1 hợp lệ với 8,500 điểm
    const validV1Save = {
      version: 1,
      points: 8500,
      totalPointsEarned: 12000,
      totalClicks: 340,
      mainFrogId: 'green_frog',
      ownedFrogs: {
        green_frog: { id: 'green_frog', level: 2, fragments: 1, unlockedAt: 1700000000000 },
      },
      upgrades: { divine_finger: 5 },
      unlockedAchievements: ['first_touch'],
      lastSavedTimestamp: 1700000000000,
    };
    mockStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(validV1Save));

    const loaded = loadGameStateFromStorage(mockStorage);
    expect(loaded.points).toBe(8500);
    expect(loaded.totalPointsEarned).toBe(12000);
    expect(loaded.totalClicks).toBe(340);
    expect(loaded.ownedFrogs['green_frog'].level).toBe(2);
    expect(loaded.upgrades['divine_finger']).toBe(5);

    // Xác nhận v2 đã được tự động lưu lại bằng bản phục hồi
    const repairedV2 = JSON.parse(mockStorage.getItem(STORAGE_KEY)!);
    expect(repairedV2.points).toBe(8500);
    expect(repairedV2.version).toBe(2);
  });

  // 11. Bảo toàn dữ liệu hợp lệ (Data Preservation)
  it('preserves 100% of valid player progress through migration', () => {
    const pristineData: GameSaveData = {
      version: 2,
      points: 25000,
      totalPointsEarned: 40000,
      totalClicks: 1500,
      highestCombo: 45,
      totalCrits: 85,
      totalGachaPulls: 30,
      upgrades: { divine_finger: 10, soft_glove: 5, frog_touch_machine: 3 },
      ownedFrogs: {
        green_frog: { id: 'green_frog', level: 3, fragments: 2, unlockedAt: 1700000000000 },
        tomato_frog: { id: 'tomato_frog', level: 2, fragments: 0, unlockedAt: 1700000010000 },
      },
      mainFrogId: 'tomato_frog',
      pity: { sinceLastRare: 4, sinceLastEpic: 12, sinceLastLegendary: 28 },
      unlockedAchievements: ['first_touch', 'click_100', 'gacha_multi_pull'],
      settings: { soundEnabled: false, musicEnabled: true, volume: 0.5, reducedMotion: true },
      favoriteFrogIds: ['tomato_frog'],
      gachaHistory: [
        {
          id: 'hist_1',
          timestamp: 1700000020000,
          poolId: 'rung_mua',
          frogId: 'tomato_frog',
          frogNameVi: 'Ếch Cà Chua',
          rarity: 'rare',
          isNew: false,
          fragmentsAdded: 1,
        },
      ],
      lastSavedTimestamp: 1700000030000,
    };

    const validation = validateSaveData(pristineData);
    expect(validation.valid).toBe(true);
    expect(validation.cleanData).toEqual(pristineData);
  });
});
