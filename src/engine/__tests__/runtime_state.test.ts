import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { exportSaveToString, GameSaveData, CURRENT_SAVE_VERSION } from '../save';
import { INITIAL_PITY_STATE } from '../gacha';

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

describe('Task R05: Zustand Runtime State Isolation & Cleanup (Import/Reset)', () => {
  beforeEach(() => {
    mockStorage.clear();
    // Đưa store về trạng thái reset sạch
    useGameStore.getState().resetGame();
  });

  it('1. Does not leak runtime combo when importing a save during an active combo streak', () => {
    const store = useGameStore.getState();

    // Giả lập người chơi đang chơi và có combo 50
    useGameStore.setState({
      currentCombo: 50,
      lastClickTimestamp: Date.now(),
      floatingTexts: [{ id: 'f1', text: '+10', x: 100, y: 100, isCrit: false, color: '#fff' }],
    });

    expect(useGameStore.getState().currentCombo).toBe(50);
    expect(useGameStore.getState().floatingTexts.length).toBe(1);

    // Chuẩn bị một bản save khác
    const newSave: GameSaveData = {
      version: CURRENT_SAVE_VERSION,
      points: 50000,
      totalPointsEarned: 100000,
      totalClicks: 500,
      highestCombo: 20,
      totalCrits: 15,
      totalGachaPulls: 5,
      upgrades: { divine_finger: 5 },
      ownedFrogs: {
        green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 },
      },
      mainFrogId: 'green_frog',
      pity: INITIAL_PITY_STATE,
      unlockedAchievements: ['first_touch'],
      settings: { soundEnabled: true, musicEnabled: true, volume: 0.7, reducedMotion: false },
      favoriteFrogIds: [],
      gachaHistory: [],
      lastSavedTimestamp: Date.now() - 3600_000, // Save cũ từ 1 giờ trước
    };

    const saveCode = exportSaveToString(newSave);

    // Thực hiện Import
    const res = useGameStore.getState().importSave(saveCode);
    expect(res.success).toBe(true);

    const postImportState = useGameStore.getState();
    // Combo của phiên cũ phải được xóa sạch, không rò rỉ sang save mới!
    expect(postImportState.currentCombo).toBe(0);
    expect(postImportState.lastClickTimestamp).toBe(0);
    expect(postImportState.floatingTexts).toEqual([]);
    expect(postImportState.points).toBe(50000);
    expect(postImportState.highestCombo).toBe(20);
  });

  it('2. Cleans idleAccumulator and prevents leakage after resetGame', () => {
    // Giả lập có idleAccumulator tích lũy dở dang 0.85 và offlineReward đang treo
    useGameStore.setState({
      idleAccumulator: 0.85,
      offlineReward: {
        earnedPoints: 1234,
        elapsedSeconds: 500,
        cappedSeconds: 500,
        wasCapped: false,
        pointsPerSecond: 10,
      },
      points: 9999,
    });

    expect(useGameStore.getState().idleAccumulator).toBe(0.85);
    expect(useGameStore.getState().offlineReward).not.toBeNull();

    // Reset game
    useGameStore.getState().resetGame();

    const stateAfterReset = useGameStore.getState();
    expect(stateAfterReset.idleAccumulator).toBe(0);
    expect(stateAfterReset.offlineReward).toBeNull();
    expect(stateAfterReset.points).toBe(0);
  });

  it('3. Anchors lastActiveTimestamp to now upon Import to prevent premature offline rewards', () => {
    // Bản save được lưu từ 5 giờ trước
    const fiveHoursAgo = Date.now() - 5 * 3600 * 1000;
    const oldSave: GameSaveData = {
      version: CURRENT_SAVE_VERSION,
      points: 1000,
      totalPointsEarned: 2000,
      totalClicks: 100,
      highestCombo: 10,
      totalCrits: 5,
      totalGachaPulls: 0,
      upgrades: { frog_touch_machine: 10 }, // 10 PPS
      ownedFrogs: { green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 } },
      mainFrogId: 'green_frog',
      pity: INITIAL_PITY_STATE,
      unlockedAchievements: [],
      settings: { soundEnabled: true, musicEnabled: true, volume: 0.7, reducedMotion: false },
      favoriteFrogIds: [],
      gachaHistory: [],
      lastSavedTimestamp: fiveHoursAgo,
    };

    const code = exportSaveToString(oldSave);
    const importTimeBefore = Date.now();
    const res = useGameStore.getState().importSave(code);
    expect(res.success).toBe(true);

    const postState = useGameStore.getState();
    // lastActiveTimestamp phải được neo về thời điểm import (~now), không phải fiveHoursAgo
    expect(postState.lastActiveTimestamp).toBeGreaterThanOrEqual(importTimeBefore);
    expect(postState.lastActiveTimestamp).toBeLessThanOrEqual(Date.now());

    // Ngay sau khi import, người chơi chuyển tab 10 giây
    const tenSecondsAfterImport = postState.lastActiveTimestamp + 10_000;
    useGameStore.getState().handleVisibilityChange(false, tenSecondsAfterImport);
    useGameStore.getState().handleVisibilityChange(true, tenSecondsAfterImport + 5_000);

    // Không được kích hoạt popup offline vì vắng mặt < 30s sau khi import
    expect(useGameStore.getState().offlineReward).toBeNull();
  });

  it('4. Buying new idle upgrade after Reset does not receive points from previous session', () => {
    // Phiên cũ: có 500 PPS và thời gian chạy cũ
    useGameStore.setState({
      points: 100000,
      upgradeLevels: { frog_factory: 5 },
      lastActiveTimestamp: Date.now() - 100_000,
      idleAccumulator: 0.99,
    });

    // Reset game
    useGameStore.getState().resetGame();

    // Mua 1 máy sờ ếch đầu tiên
    useGameStore.setState({ points: 100 });
    const buyRes = useGameStore.getState().buyUpgrade('frog_touch_machine', 'x1');
    expect(buyRes).toBe(true);

    // Chạy tick 0.5s: 1 PPS * 0.5s = 0.5 -> chưa sinh ra điểm nguyên, idleAccumulator = 0.5
    useGameStore.getState().tick(0.5);
    // Điểm: mua máy (100 - 100 = 0) + thưởng thành tựu nâng cấp đầu tiên (upgrade_first: 200) = 200
    // Quan trọng: 100,000 điểm và 0.99 idleAccumulator từ phiên trước hoàn toàn không rò rỉ!
    expect(useGameStore.getState().points).toBe(200);
    expect(useGameStore.getState().idleAccumulator).toBeCloseTo(0.5, 2);
  });

  it('5. Failed import preserves current state 100% without mutation', () => {
    // State hiện tại với các giá trị riêng biệt
    useGameStore.setState({
      points: 7777,
      totalClicks: 333,
      currentCombo: 12,
      mainFrogId: 'green_frog',
    });

    const brokenCode = 'SECH_SAVE_V2_invalid_checksum_corrupted_data';
    const res = useGameStore.getState().importSave(brokenCode);

    expect(res.success).toBe(false);
    expect(res.message).toBeDefined();

    // State hiện tại được bảo toàn nguyên vẹn
    const current = useGameStore.getState();
    expect(current.points).toBe(7777);
    expect(current.totalClicks).toBe(333);
    expect(current.currentCombo).toBe(12);
  });

  it('6. Successful import and re-export preserves core data with zero loss', () => {
    const originalSave: GameSaveData = {
      version: CURRENT_SAVE_VERSION,
      points: 88888,
      totalPointsEarned: 200000,
      totalClicks: 1500,
      highestCombo: 45,
      totalCrits: 60,
      totalGachaPulls: 30,
      upgrades: { divine_finger: 15, frog_touch_team: 5 },
      ownedFrogs: {
        green_frog: { id: 'green_frog', level: 3, fragments: 10, unlockedAt: 1 },
      },
      mainFrogId: 'green_frog',
      pity: { sinceLastRare: 4, sinceLastEpic: 14, sinceLastLegendary: 40 },
      unlockedAchievements: ['first_touch', 'click_100'],
      settings: { soundEnabled: false, musicEnabled: true, volume: 0.5, reducedMotion: false },
      favoriteFrogIds: ['green_frog'],
      gachaHistory: [
        {
          id: 'gh1',
          timestamp: 5000,
          poolId: 'ao_sen',
          frogId: 'green_frog',
          frogNameVi: 'Ếch Xanh',
          rarity: 'common',
          isNew: false,
          fragmentsAdded: 1,
        },
      ],
      lastSavedTimestamp: Date.now(),
    };

    const initialCode = exportSaveToString(originalSave);
    const importRes = useGameStore.getState().importSave(initialCode);
    expect(importRes.success).toBe(true);

    // Xuất lại từ store
    const reExportedCode = useGameStore.getState().exportSave();
    expect(reExportedCode.startsWith('SECH_SAVE_V2_')).toBe(true);

    // Import vào phiên sạch để kiểm tra dữ liệu
    useGameStore.getState().resetGame();
    const reImportRes = useGameStore.getState().importSave(reExportedCode);
    expect(reImportRes.success).toBe(true);

    const finalState = useGameStore.getState();
    expect(finalState.points).toBe(88888);
    expect(finalState.highestCombo).toBe(45);
    expect(finalState.totalCrits).toBe(60);
    expect(finalState.totalGachaPulls).toBe(30);
    expect(finalState.upgradeLevels['divine_finger']).toBe(15);
    expect(finalState.favoriteFrogIds).toEqual(['green_frog']);
    expect(finalState.gachaHistory.length).toBe(1);
    expect(finalState.settings.volume).toBe(0.5);
  });
});
