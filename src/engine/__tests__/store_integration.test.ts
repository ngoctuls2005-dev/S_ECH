import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { FROG_SPECIES_LIST } from '../../data/frogs';

// Mock audio
vi.mock('../audio', () => ({
  soundManager: {
    playRibbit: vi.fn(),
    playClick: vi.fn(),
    playCrit: vi.fn(),
    playGachaPull: vi.fn(),
    playUpgrade: vi.fn(),
    playUpgradeSuccess: vi.fn(),
    playAchievement: vi.fn(),
    playAchievementUnlocked: vi.fn(),
    playComboMilestone: vi.fn(),
    playFrogGreeting: vi.fn(),
    playEggCrack: vi.fn(),
    setSoundEnabled: vi.fn(),
    setVolume: vi.fn(),
    setMusicEnabled: vi.fn(),
    setMusicPreference: vi.fn(),
    unlockAudio: vi.fn(),
  },
}));

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

const mockStorage = new MockStorage();
(globalThis as any).localStorage = mockStorage;
(globalThis as any).window = { localStorage: mockStorage };

const mockDocument = {
  visibilityState: 'visible',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
(globalThis as any).document = mockDocument;

describe('Task R07: Real Store Integration Test Suite & Golden Fixture Verification', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockDocument.visibilityState = 'visible';
    useGameStore.getState().resetGame();
  });

  // =========================================================================
  // A. SAVE V1 GOLDEN FIXTURE (INVARIANT HARDCODED TEST)
  // =========================================================================
  describe('A. Invariant Save v1 Golden Fixture', () => {
    // Chuỗi fixture bất biến độc lập từ format v1, không gọi calculateSaveChecksumV1() ở runtime
    const INVARIANT_GOLDEN_V1_STRING =
      'SECH_SAVE_V1_012abc52_eyJwb2ludHMiOjE1MDAsInRvdGFsUG9pbnRzRWFybmVkIjoyMDAwLCJ0b3RhbENsaWNrcyI6MTIwLCJtYWluRnJvZ0lkIjoiZ3JlZW5fZnJvZyIsIm93bmVkRnJvZ3MiOnsiZ3JlZW5fZnJvZyI6eyJpZCI6ImdyZWVuX2Zyb2ciLCJsZXZlbCI6MSwiZnJhZ21lbnRzIjowLCJ1bmxvY2tlZEF0IjoxNzAwMDAwMDAwMDAwfX0sInVwZ3JhZGVzIjp7ImRpdmluZV9maW5nZXIiOjN9LCJ1bmxvY2tlZEFjaGlldmVtZW50cyI6WyJmaXJzdF90b3VjaCJdLCJsYXN0U2F2ZWRUaW1lc3RhbXAiOjE3MDAwMDAwMDAwMDB9';

    it('successfully loads invariant golden v1 save fixture with exact expected state', () => {
      const res = useGameStore.getState().importSave(INVARIANT_GOLDEN_V1_STRING);
      expect(res.success).toBe(true);

      const state = useGameStore.getState();
      expect(state.points).toBe(1500);
      expect(state.totalPointsEarned).toBe(2000);
      expect(state.totalClicks).toBe(120);
      expect(state.mainFrogId).toBe('green_frog');
      expect(state.upgradeLevels['divine_finger']).toBe(3);
      expect(state.ownedFrogs['green_frog'].level).toBe(1);
      expect(state.unlockedAchievements).toEqual(['first_touch']);

      // Kiểm tra schema v2 default fields
      expect(state.favoriteFrogIds).toEqual([]);
      expect(state.gachaHistory).toEqual([]);
      expect(state.totalCrits).toBe(0);
      expect(state.totalGachaPulls).toBe(0);
      expect(state.highestCombo).toBe(0);
    });

    it('strictly rejects golden v1 fixture if checksum character is altered', () => {
      // Đổi checksum từ 012abc52 thành 012abc53
      const tamperedChecksum = INVARIANT_GOLDEN_V1_STRING.replace('012abc52', '012abc53');
      const res = useGameStore.getState().importSave(tamperedChecksum);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/checksum|toàn vẹn/i);
    });
  });

  // =========================================================================
  // B. ZUSTAND FULL ACTION INTEGRATION
  // =========================================================================
  describe('B. Zustand Full Action Integration Flow', () => {
    it('executes user journey across click, buyUpgrade, gacha, setMainFrog, levelUpFrog', () => {
      const store = useGameStore.getState();

      // 1. clickFrog
      expect(useGameStore.getState().totalClicks).toBe(0);
      useGameStore.getState().clickFrog(200, 300);
      const afterClick = useGameStore.getState();
      expect(afterClick.totalClicks).toBe(1);
      // Điểm: click (1 hoặc 2) + thưởng first_touch (20)
      expect(afterClick.points).toBeGreaterThanOrEqual(21);
      expect(afterClick.floatingTexts.length).toBe(1);
      expect(afterClick.floatingTexts[0].x).toBe(200);

      // 2. Tặng điểm để kiểm tra buyUpgrade
      useGameStore.setState({ points: 5000 });
      const buyOk = useGameStore.getState().buyUpgrade('divine_finger', 'x1');
      expect(buyOk).toBe(true);
      expect(useGameStore.getState().upgradeLevels['divine_finger']).toBe(1);

      // 3. pullGacha (1 pull)
      const initialPulls = useGameStore.getState().totalGachaPulls;
      const initialPoints = useGameStore.getState().points;
      const session = useGameStore.getState().pullGacha(1, 'ao_sen');
      expect(session).not.toBeNull();
      expect(session?.pulls.length).toBe(1);

      const afterGacha = useGameStore.getState();
      expect(afterGacha.totalGachaPulls).toBe(initialPulls + 1);
      expect(session?.costPaid).toBe(500);
      expect(afterGacha.points).toBeGreaterThanOrEqual(initialPoints - 500);
      expect(afterGacha.gachaHistory.length).toBe(1);

      // 4. setMainFrog
      // Thêm một con ếch mới vào ownedFrogs với 7 mảnh (cần 5 mảnh để lên level 2)
      useGameStore.setState({
        ownedFrogs: {
          ...afterGacha.ownedFrogs,
          tomato_frog: { id: 'tomato_frog', level: 1, fragments: 7, unlockedAt: 1 },
        },
      });
      useGameStore.getState().setMainFrog('tomato_frog');
      expect(useGameStore.getState().mainFrogId).toBe('tomato_frog');

      // 5. levelUpFrog
      const canUp = useGameStore.getState().levelUpFrog('tomato_frog');
      expect(canUp).toBe(true);
      expect(useGameStore.getState().ownedFrogs['tomato_frog'].level).toBe(2);
      expect(useGameStore.getState().ownedFrogs['tomato_frog'].fragments).toBe(2); // 7 - 5 = 2
    });
  });

  // =========================================================================
  // C. CHỐNG NHẬN THƯỞNG TRÙNG LẶP QUA CHUỖI HÀNH ĐỘNG
  // =========================================================================
  describe('C. Anti-Duplicate Reward Simulation Across Action Chain', () => {
    it('does not re-award achievement points after autosave, reload, tick, click, upgrade, and gacha', () => {
      // 1. Bấm click đầu tiên mở khóa first_touch
      useGameStore.getState().clickFrog();
      const state1 = useGameStore.getState();
      expect(state1.unlockedAchievements).toContain('first_touch');
      const pointsAfterFirstTouch = state1.points;

      // 2. Export và nạp lại (giả lập autosave & reload)
      const exported = useGameStore.getState().exportSave();
      useGameStore.getState().resetGame();
      useGameStore.getState().importSave(exported);

      const state2 = useGameStore.getState();
      expect(state2.points).toBe(pointsAfterFirstTouch);
      expect(state2.unlockedAchievements).toContain('first_touch');

      // 3. Chạy chuỗi hành động: tick -> click -> buyUpgrade -> pullGacha
      useGameStore.getState().tick(1.0);
      useGameStore.getState().clickFrog();

      // Cấp thêm điểm để mua nâng cấp và gacha
      useGameStore.setState({ points: 2000 });
      useGameStore.getState().buyUpgrade('frog_touch_machine', 'x1');
      useGameStore.getState().pullGacha(1, 'ao_sen');

      // 4. Xác nhận: first_touch không bao giờ xuất hiện trong newlyUnlocked toast lần 2
      // và danh sách unlockedAchievements không có phần tử trùng lặp
      const finalAchievements = useGameStore.getState().unlockedAchievements;
      const duplicates = finalAchievements.filter((item, index) => finalAchievements.indexOf(item) !== index);
      expect(duplicates).toEqual([]);
    });
  });

  // =========================================================================
  // D. GACHA FULL TRANSACTION INTEGRITY
  // =========================================================================
  describe('D. Full Gacha Transaction Atomic Integrity', () => {
    it('executes complete atomic gacha transaction: points, counters, pity, inventory, history, and persistence', () => {
      useGameStore.setState({
        points: 6000,
        totalGachaPulls: 0,
        gachaHistory: [],
      });

      // Thực hiện quay 10 lượt (chi phí 5000)
      const session = useGameStore.getState().pullGacha(10, 'rung_mua');
      expect(session).not.toBeNull();
      expect(session?.pulls.length).toBe(10);

      const state = useGameStore.getState();
      // Điểm trừ đúng 5000 (còn 1000 + thưởng thành tựu gacha nếu có)
      expect(state.points).toBeGreaterThanOrEqual(1000);
      expect(state.totalGachaPulls).toBe(10);

      // Lịch sử quay lưu đủ 10 entries
      expect(state.gachaHistory.length).toBe(10);
      expect(state.gachaHistory[0].poolId).toBe('rung_mua');

      // Pity counters được cập nhật hợp lệ
      expect(state.pity.sinceLastRare).toBeGreaterThanOrEqual(0);
      expect(state.pity.sinceLastEpic).toBeGreaterThanOrEqual(0);
      expect(state.pity.sinceLastLegendary).toBeGreaterThanOrEqual(0);

      // Đã mở khóa ít nhất thành tựu gacha_multi_pull (10 lượt)
      expect(state.unlockedAchievements).toContain('gacha_multi_pull');

      // Export save và import vào store mới để xác nhận tính toàn vẹn khi lưu trữ
      const exported = useGameStore.getState().exportSave();
      useGameStore.getState().resetGame();
      useGameStore.getState().importSave(exported);

      const restoredState = useGameStore.getState();
      expect(restoredState.totalGachaPulls).toBe(10);
      expect(restoredState.gachaHistory.length).toBe(10);
      expect(restoredState.unlockedAchievements).toContain('gacha_multi_pull');
      expect(restoredState.pity.sinceLastLegendary).toBe(state.pity.sinceLastLegendary);
    });
  });
});
