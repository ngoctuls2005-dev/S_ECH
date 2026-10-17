import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import * as saveModule from '../save';
import { exportSaveToString, DEFAULT_INITIAL_SAVE, GameSaveData } from '../save';

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
  public shouldFail: boolean = false;

  get length() {
    return Object.keys(this.store).length;
  }
  clear() {
    this.store = {};
    this.shouldFail = false;
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
    if (this.shouldFail) {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      (err as any).code = 22;
      throw err;
    }
    this.store[key] = value;
  }
}

const mockStorage = new MockStorage();
(globalThis as any).localStorage = mockStorage;
(globalThis as any).window = { localStorage: mockStorage };

describe('Task C01: Import Persistence Integrity & Storage Failure Handling', () => {
  beforeEach(() => {
    mockStorage.clear();
    useGameStore.getState().resetGame();
  });

  it('rejects import and preserves current RAM/persistent state when storage fails (QuotaExceededError)', () => {
    // 1. Chuẩn bị state hiện tại với 5,000 điểm và sound volume 0.8
    useGameStore.setState({
      points: 5000,
      totalPointsEarned: 5000,
      totalClicks: 200,
      settings: { ...DEFAULT_INITIAL_SAVE.settings, volume: 0.8 },
    });
    // Lưu state hiện tại vào mockStorage
    saveModule.saveGameStateToStorage({
      ...DEFAULT_INITIAL_SAVE,
      points: 5000,
      totalPointsEarned: 5000,
      totalClicks: 200,
      settings: { ...DEFAULT_INITIAL_SAVE.settings, volume: 0.8 },
    });

    const storageBefore = mockStorage.getItem(saveModule.STORAGE_KEY);
    expect(storageBefore).toContain('5000');

    // 2. Tạo một chuỗi save mới với 99,999 điểm và volume 0.2
    const incomingData: GameSaveData = {
      ...DEFAULT_INITIAL_SAVE,
      points: 99999,
      totalPointsEarned: 99999,
      totalClicks: 500,
      settings: { ...DEFAULT_INITIAL_SAVE.settings, volume: 0.2 },
    };
    const incomingCode = exportSaveToString(incomingData);

    // 3. Kích hoạt lỗi Storage Failure (QuotaExceededError)
    mockStorage.shouldFail = true;

    // 4. Thực hiện import
    const result = useGameStore.getState().importSave(incomingCode);

    // 5. Xác minh:
    // a. Import phải trả về thất bại với thông báo rõ ràng
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/không thể lưu|bộ nhớ|dung lượng/i);

    // b. State trong RAM không bị thay đổi (vẫn là 5,000 điểm và volume 0.8)
    const currentState = useGameStore.getState();
    expect(currentState.points).toBe(5000);
    expect(currentState.totalPointsEarned).toBe(5000);
    expect(currentState.totalClicks).toBe(200);
    expect(currentState.settings.volume).toBe(0.8);

    // c. Bản lưu cũ trong storage vẫn nguyên vẹn
    mockStorage.shouldFail = false;
    expect(mockStorage.getItem(saveModule.STORAGE_KEY)).toBe(storageBefore);
  });

  it('successfully imports and persists new state when storage writes normally', () => {
    // Chuỗi save mới với 12,345 điểm
    const incomingData: GameSaveData = {
      ...DEFAULT_INITIAL_SAVE,
      points: 12345,
      totalPointsEarned: 15000,
      totalClicks: 100,
    };
    const incomingCode = exportSaveToString(incomingData);

    const result = useGameStore.getState().importSave(incomingCode);
    expect(result.success).toBe(true);

    const state = useGameStore.getState();
    expect(state.points).toBe(12345);
    expect(mockStorage.getItem(saveModule.STORAGE_KEY)).toContain('12345');
  });
});
