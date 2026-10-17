import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportSaveToString,
  importSaveFromString,
  saveGameStateToStorage,
  loadGameStateFromStorage,
  clearSavedGame,
  CURRENT_SAVE_VERSION,
  DEFAULT_INITIAL_SAVE,
  calculateSaveChecksumV1,
  GameSaveData,
} from '../save';
import { evaluateAchievements } from '../achievements';
import { calculateOfflineReward } from '../idle';
import { getSpeciesDropRates, getNextPullGuaranteedStatus } from '../gacha';

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

describe('S Ếch v3.0 Deep Regression Test Suite (8 Real-World Scenarios)', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    (globalThis as any).localStorage = mockStorage;
  });

  // =========================================================================
  // SCENARIO 1: Import mã save v1 tạo bằng thuật toán checksum cũ (DJB2 seed 5381)
  // =========================================================================
  describe('Scenario 1: Legacy Save v1 Import with DJB2 Checksum', () => {
    function createLegacyV1SaveString(payloadObj: any): string {
      const jsonStr = JSON.stringify(payloadObj);
      const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
      // Thuật toán DJB2 cũ của Save v1 với seed 5381 được lưu chuẩn trong calculateSaveChecksumV1
      const checksum = calculateSaveChecksumV1(b64);
      return `SECH_SAVE_V1_${checksum}_${b64}`;
    }

    it('successfully imports legacy v1 save string and migrates to v2 schema with default fields', () => {
      const legacyPayload = {
        points: 8888,
        totalPointsEarned: 15000,
        totalClicks: 250,
        mainFrogId: 'green_frog',
        ownedFrogs: {
          green_frog: { id: 'green_frog', level: 2, fragments: 3, unlockedAt: 1700000000000 },
        },
        upgrades: {
          divine_finger: 5,
          frog_touch_machine: 3,
        },
        unlockedAchievements: ['first_touch', 'click_100'],
        lastSavedTimestamp: 1700000000000,
      };

      const v1SaveString = createLegacyV1SaveString(legacyPayload);
      expect(v1SaveString.startsWith('SECH_SAVE_V1_')).toBe(true);

      const importResult = importSaveFromString(v1SaveString);
      expect(importResult.success).toBe(true);
      expect(importResult.data).toBeDefined();

      const state = importResult.data!;
      // Dữ liệu cũ được bảo toàn 100%
      expect(state.points).toBe(8888);
      expect(state.totalPointsEarned).toBe(15000);
      expect(state.totalClicks).toBe(250);
      expect(state.upgrades['divine_finger']).toBe(5);
      expect(state.ownedFrogs['green_frog'].level).toBe(2);
      expect(state.unlockedAchievements).toContain('first_touch');
      expect(state.unlockedAchievements).toContain('click_100');

      // Tự động migrate lên version 2 với các trường mới mặc định an toàn
      expect(state.version).toBe(2);
      expect(Array.isArray(state.favoriteFrogIds)).toBe(true);
      expect(state.favoriteFrogIds).toEqual([]);
      expect(Array.isArray(state.gachaHistory)).toBe(true);
      expect(state.gachaHistory).toEqual([]);
      expect(state.highestCombo).toBe(0);
      expect(state.totalCrits).toBe(0);
      expect(state.totalGachaPulls).toBe(0);
    });

    it('rejects tampered legacy v1 save string with mismatched checksum', () => {
      const legacyPayload = { points: 1000, totalPointsEarned: 1000, totalClicks: 10, upgrades: {} };
      const validV1 = createLegacyV1SaveString(legacyPayload);
      // Giả mạo dữ liệu phần base64 khiến checksum không khớp
      const tamperedV1 = validV1 + 'corrupted_payload';

      const res = importSaveFromString(tamperedV1);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/checksum|toàn vẹn|giải mã/i);
    });
  });

  // =========================================================================
  // SCENARIO 2 & 3: Export -> Reset -> Import save v2 bảo toàn favorites và gacha history
  // =========================================================================
  describe('Scenario 2 & 3: Export -> Reset -> Import Save v2 Cycle with Favorites and History', () => {
    it('preserves favoriteFrogIds and gachaHistory through full Export -> Reset -> Import cycle', () => {
      const originalState: GameSaveData = {
        version: CURRENT_SAVE_VERSION,
        points: 125000,
        totalPointsEarned: 350000,
        totalClicks: 1200,
        highestCombo: 42,
        totalCrits: 75,
        totalGachaPulls: 25,
        mainFrogId: 'mossy_frog',
        ownedFrogs: {
          green_frog: { id: 'green_frog', level: 3, fragments: 5, unlockedAt: 100 },
          mossy_frog: { id: 'mossy_frog', level: 2, fragments: 1, unlockedAt: 200 },
          chronos_frog: { id: 'chronos_frog', level: 1, fragments: 0, unlockedAt: 300 },
        },
        upgrades: {
          divine_finger: 10,
          frog_touch_machine: 8,
          frog_magic: 3,
        },
        pity: {
          sinceLastRare: 3,
          sinceLastEpic: 12,
          sinceLastLegendary: 25,
        },
        settings: {
          soundEnabled: true,
          musicEnabled: true,
          volume: 0.7,
          reducedMotion: false,
        },
        unlockedAchievements: ['first_touch', 'click_100', 'click_1000'],
        lastSavedTimestamp: Date.now(),
        favoriteFrogIds: ['mossy_frog', 'chronos_frog'],
        gachaHistory: [
          {
            id: 'g1',
            timestamp: 1000,
            poolId: 'ao_sen',
            frogId: 'mossy_frog',
            frogNameVi: 'Ếch Rêu Việt Nam',
            rarity: 'epic',
            isNew: true,
            fragmentsAdded: 0,
          },
          {
            id: 'g2',
            timestamp: 2000,
            poolId: 'dem_trang',
            frogId: 'chronos_frog',
            frogNameVi: 'Ếch Thời Gian Vĩnh Cửu',
            rarity: 'mythic',
            isNew: true,
            fragmentsAdded: 0,
          },
        ],
      };

      // 1. Export ra chuỗi Base64 có mã kiểm tra v2
      const exportStr = exportSaveToString(originalState);
      expect(exportStr.startsWith('SECH_SAVE_V2_')).toBe(true);

      // Lưu vào storage thử nghiệm
      saveGameStateToStorage(originalState, mockStorage);
      expect(loadGameStateFromStorage(mockStorage)).not.toBeNull();

      // Giả lập key rác cũ trong storage
      mockStorage.setItem('s_ech_favorite_frogs', JSON.stringify(['ghost_frog']));
      mockStorage.setItem('s_ech_gacha_history', JSON.stringify([{ id: 'ghost' }]));

      // 2. Thực hiện Reset toàn diện
      clearSavedGame(mockStorage);

      // Xác nhận sạch bóng toàn bộ keys, không còn sót lại dữ liệu ma
      expect(mockStorage.getItem('s_ech_save_game_v2')).toBeNull();
      expect(mockStorage.getItem('s_ech_save_game')).toBeNull();
      expect(mockStorage.getItem('s_ech_favorite_frogs')).toBeNull();
      expect(mockStorage.getItem('s_ech_gacha_history')).toBeNull();
      // Load storage trả về default ban đầu an toàn
      expect(loadGameStateFromStorage(mockStorage)).toEqual(DEFAULT_INITIAL_SAVE);

      // 3. Import lại chuỗi đã xuất
      const importRes = importSaveFromString(exportStr);
      expect(importRes.success).toBe(true);
      expect(importRes.data).toBeDefined();

      const restored = importRes.data!;
      expect(restored.points).toBe(125000);
      expect(restored.highestCombo).toBe(42);
      expect(restored.totalCrits).toBe(75);
      expect(restored.totalGachaPulls).toBe(25);

      // Xác nhận danh sách yêu thích và lịch sử gacha được khôi phục 100%
      expect(restored.favoriteFrogIds).toEqual(['mossy_frog', 'chronos_frog']);
      expect(restored.gachaHistory.length).toBe(2);
      expect(restored.gachaHistory[0].frogId).toBe('mossy_frog');
      expect(restored.gachaHistory[1].frogId).toBe('chronos_frog');
    });
  });

  // =========================================================================
  // SCENARIO 4: Thành tựu Crit và Gacha chỉ dùng số liệu thật (không ước lượng)
  // =========================================================================
  describe('Scenario 4: Real Counters for Crit and Gacha Achievements', () => {
    it('does not unlock crit achievements if totalCrits is 0, even with 100+ clicks', () => {
      // Người chơi click 150 lần nhưng không nổ crit nào
      const ctx = {
        points: 500,
        totalPointsEarned: 500,
        totalClicks: 150,
        highestCombo: 10,
        totalCrits: 0, // Không có crit thật nào
        totalGachaPulls: 0,
        ownedFrogs: { green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 } },
        upgrades: {},
        mainFrogId: 'green_frog',
      };

      const result = evaluateAchievements(ctx, []);
      // Trước v3, ước lượng Math.floor(150 * 0.1) = 15 sẽ kích hoạt crit_10 gian lận
      // Ở v3, kiểm tra số thật nên crit_10 không được phép mở khóa
      expect(result.newlyUnlockedIds).not.toContain('crit_10');
      expect(result.achievements.find((a) => a.id === 'crit_10')?.isUnlocked).toBe(false);

      // Khi người chơi nổ đủ 10 crits thật
      const ctxWithRealCrits = { ...ctx, totalCrits: 10 };
      const result2 = evaluateAchievements(ctxWithRealCrits, []);
      expect(result2.newlyUnlockedIds).toContain('crit_10');
      expect(result2.achievements.find((a) => a.id === 'crit_10')?.isUnlocked).toBe(true);
    });

    it('requires actual totalGachaPulls counter to unlock gacha milestones', () => {
      // Người chơi có nhiều mảnh nhưng totalGachaPulls chỉ là 3
      const ctx = {
        points: 2000,
        totalPointsEarned: 2000,
        totalClicks: 50,
        highestCombo: 5,
        totalCrits: 1,
        totalGachaPulls: 3, // Chỉ quay 3 lần thật (< 10)
        ownedFrogs: {
          green_frog: { id: 'green_frog', level: 3, fragments: 20, unlockedAt: 1 },
          bullfrog: { id: 'bullfrog', level: 2, fragments: 10, unlockedAt: 2 },
        },
        upgrades: {},
        mainFrogId: 'green_frog',
      };

      const res = evaluateAchievements(ctx, []);
      // Thành tựu mở 10 lượt Gacha (gacha_multi_pull) chưa thể mở khóa
      expect(res.newlyUnlockedIds).not.toContain('gacha_multi_pull');
      expect(res.achievements.find((a) => a.id === 'gacha_multi_pull')?.isUnlocked).toBe(false);

      // Khi người chơi quay đủ 10 lần thực tế
      const res10 = evaluateAchievements({ ...ctx, totalGachaPulls: 10 }, []);
      expect(res10.newlyUnlockedIds).toContain('gacha_multi_pull');
      expect(res10.achievements.find((a) => a.id === 'gacha_multi_pull')?.isUnlocked).toBe(true);
    });
  });

  // =========================================================================
  // SCENARIO 5: Thưởng thành tựu không bị cộng lại sau reload
  // =========================================================================
  describe('Scenario 5: Idempotent Achievement Rewards (No Duplicate Rewards)', () => {
    it('awards points only on first unlock and strictly 0 points on reload or repeated checks', () => {
      const ctx = {
        points: 50,
        totalPointsEarned: 50,
        totalClicks: 1,
        highestCombo: 1,
        totalCrits: 0,
        totalGachaPulls: 0,
        ownedFrogs: { green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 } },
        upgrades: {},
        mainFrogId: 'green_frog',
      };

      // Đánh giá lần 1: Mở khóa first_touch (thưởng 20đ)
      const eval1 = evaluateAchievements(ctx, []);
      expect(eval1.newlyUnlockedIds).toEqual(['first_touch']);
      expect(eval1.totalRewardsEarned).toBe(20);

      // Điểm người chơi được cộng
      let playerPoints = ctx.points + eval1.totalRewardsEarned;
      expect(playerPoints).toBe(70);

      const unlockedList = eval1.achievements.filter((a) => a.isUnlocked).map((a) => a.id);

      // Giả lập reload trang / đánh giá lại tick:
      const eval2 = evaluateAchievements({ ...ctx, points: playerPoints }, unlockedList);
      expect(eval2.newlyUnlockedIds).toEqual([]);
      expect(eval2.totalRewardsEarned).toBe(0);

      // Không cộng thêm điểm nào
      playerPoints += eval2.totalRewardsEarned;
      expect(playerPoints).toBe(70);
    });
  });

  // =========================================================================
  // SCENARIO 6: Combo và điều kiện thành tựu bí mật chính xác
  // =========================================================================
  describe('Scenario 6: Secret Achievement Concurrent Condition Verification', () => {
    it('does NOT unlock secret_ribbit_master if player achieved combo 20 on normal frog then switched', () => {
      // Người chơi cày combo 20 bằng green_frog, sau đó đổi sang mossy_frog nhưng cú click hiện tại chỉ combo 1
      const ctxCheating = {
        points: 1000,
        totalPointsEarned: 1000,
        totalClicks: 200,
        highestCombo: 25, // Combo cao trong quá khứ
        lastClickCombo: 1, // Nhưng hiện tại với mossy_frog chỉ click 1 lần
        totalCrits: 5,
        totalGachaPulls: 0,
        ownedFrogs: {
          green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 },
          mossy_frog: { id: 'mossy_frog', level: 1, fragments: 0, unlockedAt: 2 },
        },
        upgrades: {},
        mainFrogId: 'mossy_frog',
      };

      const res = evaluateAchievements(ctxCheating, []);
      expect(res.newlyUnlockedIds).not.toContain('secret_ribbit_master');
      expect(res.achievements.find((a) => a.id === 'secret_ribbit_master')?.isUnlocked).toBe(false);
    });

    it('successfully unlocks secret_ribbit_master when achieving combo >= 20 concurrently with secret frog', () => {
      // Người chơi sờ mossy_frog và đạt combo 20 tại chỗ
      const ctxLegit = {
        points: 1000,
        totalPointsEarned: 1000,
        totalClicks: 200,
        highestCombo: 20,
        lastClickCombo: 20, // Đồng thời combo >= 20 cùng mossy_frog!
        totalCrits: 5,
        totalGachaPulls: 0,
        ownedFrogs: {
          mossy_frog: { id: 'mossy_frog', level: 1, fragments: 0, unlockedAt: 1 },
        },
        upgrades: {},
        mainFrogId: 'mossy_frog',
      };

      const res = evaluateAchievements(ctxLegit, []);
      expect(res.newlyUnlockedIds).toContain('secret_ribbit_master');
      expect(res.achievements.find((a) => a.id === 'secret_ribbit_master')?.isUnlocked).toBe(true);
      expect(res.totalRewardsEarned).toBeGreaterThanOrEqual(10000);
    });
  });

  // =========================================================================
  // SCENARIO 7: Thu nhập offline và autosave không bị tính hai lần
  // =========================================================================
  describe('Scenario 7: Offline Reward Checkpoint and Safe Capping', () => {
    it('does not award offline points on fast tab switches (< 30s threshold)', () => {
      const baseTime = 1_700_000_000_000;
      const pps = 100;

      // Người chơi chuyển tab 10 giây rồi quay lại
      const rewardFast = calculateOfflineReward(baseTime, baseTime + 10_000, pps);
      expect(rewardFast).toBeNull();
    });

    it('awards points once for elapsed offline time and prevents double-counting upon checkpoint update', () => {
      let lastCheckpoint = 1_700_000_000_000;
      const pps = 50;

      // Người chơi offline 120s (2 phút)
      const now1 = lastCheckpoint + 120_000;
      const reward1 = calculateOfflineReward(lastCheckpoint, now1, pps);
      expect(reward1).not.toBeNull();
      // 120s * 50 PPS * 0.50 (offline rate) = 3000 points
      expect(reward1!.earnedPoints).toBe(3000);
      expect(reward1!.wasCapped).toBe(false);

      // Checkpoint được cập nhật về now1
      lastCheckpoint = now1;

      // Người chơi click hoặc chuyển tab ngắn 15s sau đó
      const now2 = lastCheckpoint + 15_000;
      const reward2 = calculateOfflineReward(lastCheckpoint, now2, pps);
      // Không bị tính lặp lại khoảng thời gian cũ!
      expect(reward2).toBeNull();
    });

    it('enforces safe 8-hour cap (28,800s): 10-hour and 24-hour rewards are identical', () => {
      const baseTime = 1_700_000_000_000;
      const pps = 1000;

      const reward8h = calculateOfflineReward(baseTime, baseTime + 8 * 3600 * 1000, pps);
      const reward10h = calculateOfflineReward(baseTime, baseTime + 10 * 3600 * 1000, pps);
      const reward24h = calculateOfflineReward(baseTime, baseTime + 24 * 3600 * 1000, pps);

      expect(reward8h?.wasCapped).toBe(false);
      expect(reward10h?.wasCapped).toBe(true);
      expect(reward24h?.wasCapped).toBe(true);

      // Vì chạm trần 8h nên điểm của 8h, 10h và 24h là bằng nhau tuyệt đối
      expect(reward10h?.earnedPoints).toBe(reward8h?.earnedPoints);
      expect(reward24h?.earnedPoints).toBe(reward8h?.earnedPoints);
    });
  });

  // =========================================================================
  // SCENARIO 8: Xác suất Gacha khớp trạng thái Pity
  // =========================================================================
  describe('Scenario 8: Transparent Gacha Drop Rates Matching Pity Guarantee', () => {
    it('sets Common drop rate to strictly 0% when next pull guarantees Rare or higher', () => {
      const pityRareGuaranteed = {
        totalPulls: 9,
        sinceLastRare: 9, // Lượt 10 bảo đảm Rare+
        sinceLastEpic: 9,
        sinceLastLegendary: 9,
      };

      const status = getNextPullGuaranteedStatus(pityRareGuaranteed);
      expect(status.isGuaranteed).toBe(true);
      expect(status.minRarity).toBe('rare');

      // Tỉ lệ cơ bản (chưa xét pity) vẫn có Common
      const baseRates = getSpeciesDropRates('ao_sen', {}, pityRareGuaranteed, false);
      const baseCommonTotal = baseRates
        .filter((r) => r.frog.rarity === 'common')
        .reduce((sum, r) => sum + r.dropChancePercent, 0);
      expect(baseCommonTotal).toBeGreaterThanOrEqual(45); // Khoảng 50% cơ bản

      // Tỉ lệ khi có xét Pity bảo đảm cho lượt kế tiếp:
      const pityRates = getSpeciesDropRates('ao_sen', {}, pityRareGuaranteed, true);
      const pityCommonTotal = pityRates
        .filter((r) => r.frog.rarity === 'common')
        .reduce((sum, r) => sum + r.dropChancePercent, 0);
      expect(pityCommonTotal).toBe(0); // 0% Common

      const pityTotal = pityRates.reduce((sum, r) => sum + r.dropChancePercent, 0);
      expect(pityTotal).toBeGreaterThan(99.0);
      expect(pityTotal).toBeLessThan(101.0);
    });

    it('sets Common and Rare drop rates to strictly 0% when next pull guarantees Epic or higher', () => {
      const pityEpicGuaranteed = {
        totalPulls: 29,
        sinceLastRare: 2,
        sinceLastEpic: 29, // Lượt 30 bảo đảm Epic+
        sinceLastLegendary: 29,
      };

      const status = getNextPullGuaranteedStatus(pityEpicGuaranteed);
      expect(status.isGuaranteed).toBe(true);
      expect(status.minRarity).toBe('epic');

      const pityRates = getSpeciesDropRates('ao_sen', {}, pityEpicGuaranteed, true);
      const commonOrRareTotal = pityRates
        .filter((r) => r.frog.rarity === 'common' || r.frog.rarity === 'rare')
        .reduce((sum, r) => sum + r.dropChancePercent, 0);
      expect(commonOrRareTotal).toBe(0);

      const pityTotal = pityRates.reduce((sum, r) => sum + r.dropChancePercent, 0);
      expect(pityTotal).toBeGreaterThan(99.0);
      expect(pityTotal).toBeLessThan(101.0);
    });

    it('sets all non-Legendary/Mythic to 0% when next pull guarantees Legendary or higher', () => {
      const pityLegGuaranteed = {
        totalPulls: 99,
        sinceLastRare: 0,
        sinceLastEpic: 5,
        sinceLastLegendary: 99, // Lượt 100 bảo đảm Legendary+
      };

      const status = getNextPullGuaranteedStatus(pityLegGuaranteed);
      expect(status.isGuaranteed).toBe(true);
      expect(status.minRarity).toBe('legendary');

      const pityRates = getSpeciesDropRates('ao_sen', {}, pityLegGuaranteed, true);
      const lowRarityTotal = pityRates
        .filter((r) => r.frog.rarity === 'common' || r.frog.rarity === 'rare' || r.frog.rarity === 'epic')
        .reduce((sum, r) => sum + r.dropChancePercent, 0);
      expect(lowRarityTotal).toBe(0);

      const legMythicTotal = pityRates
        .filter((r) => r.frog.rarity === 'legendary' || r.frog.rarity === 'mythic')
        .reduce((sum, r) => sum + r.dropChancePercent, 0);
      expect(legMythicTotal).toBeGreaterThan(99.0);
      expect(legMythicTotal).toBeLessThan(101.0);
    });
  });
});
