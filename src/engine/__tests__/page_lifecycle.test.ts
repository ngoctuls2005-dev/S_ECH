import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { DEFAULT_IDLE_CONFIG } from '../idle';
import { saveGameStateToStorage, loadGameStateFromStorage, exportSaveToString } from '../save';

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

const mockDocument = {
  visibilityState: 'visible',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
(globalThis as any).document = mockDocument;

describe('Task R06: Page Lifecycle Integration (Active vs Offline Income & Tab Throttling)', () => {
  let virtualTime = 1_700_000_000_000;

  beforeEach(() => {
    mockStorage.clear();
    virtualTime = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => virtualTime);

    mockDocument.visibilityState = 'visible';

    useGameStore.getState().resetGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Accrues 100% active income during visible state (10 seconds with 10 PPS)', () => {
    // Cài đặt 10 PPS (mua frog_touch_team: 1 level)
    useGameStore.setState({
      points: 0,
      totalPointsEarned: 0,
      upgradeLevels: { frog_touch_team: 1 }, // 10 PPS
      lastActiveTimestamp: virtualTime,
    });

    // Mô phỏng 10 giây visible với 10 frames (mỗi frame 1s)
    for (let i = 0; i < 10; i++) {
      virtualTime += 1000;
      useGameStore.getState().tick(1.0);
    }

    const state = useGameStore.getState();
    // 10 PPS * 10 giây = 100 điểm active + 200 điểm thưởng thành tựu kiếm 100 điểm đầu tiên (score_100) = 300 điểm
    expect(state.points).toBe(300);
    expect(state.totalPointsEarned).toBe(300);
    expect(state.offlineReward).toBeNull();
  });

  it('2. Blocks tick accumulation when document is hidden to avoid active-offline double count', () => {
    useGameStore.setState({
      points: 100,
      totalPointsEarned: 100,
      upgradeLevels: { frog_touch_team: 1 }, // 10 PPS
      lastActiveTimestamp: virtualTime,
    });

    // 1. Chuyển sang Hidden
    (document as any).visibilityState = 'hidden';
    useGameStore.getState().handleVisibilityChange(false, virtualTime);

    // 2. Giả lập rAF callback vẫn tiếp tục gọi tick thêm 5 lần khi hidden
    for (let i = 0; i < 5; i++) {
      virtualTime += 1000;
      useGameStore.getState().tick(1.0);
    }

    // Điểm số KHÔNG được tăng thêm qua tick khi tab đang hidden!
    expect(useGameStore.getState().points).toBe(100);
  });

  it('3. Compensates 100% active rate for short absences (< 30s) without showing offline modal', () => {
    useGameStore.setState({
      points: 100,
      totalPointsEarned: 100,
      upgradeLevels: { frog_touch_team: 1 }, // 10 PPS
      lastActiveTimestamp: virtualTime,
    });

    // Chuyển Hidden ở t0
    const hideTime = virtualTime;
    (document as any).visibilityState = 'hidden';
    useGameStore.getState().handleVisibilityChange(false, hideTime);

    // Người chơi vắng mặt 15 giây (< 30s threshold)
    virtualTime += 15_000;

    // Quay lại Visible
    (document as any).visibilityState = 'visible';
    useGameStore.getState().handleVisibilityChange(true, virtualTime);

    const state = useGameStore.getState();
    // Vắng mặt 15s * 10 PPS * 100% bù active = 150 điểm
    // 100 + 150 = 250 điểm
    expect(state.points).toBe(250);
    expect(state.totalPointsEarned).toBe(250);
    // Không hiện modal offline reward
    expect(state.offlineReward).toBeNull();
    // Checkpoint được cập nhật về thời điểm hiện tại
    expect(state.lastActiveTimestamp).toBe(virtualTime);
  });

  it('4. Applies 50% offline rate for longer absences (60s >= 30s) and displays offline modal', () => {
    useGameStore.setState({
      points: 250,
      totalPointsEarned: 250,
      upgradeLevels: { frog_touch_team: 1 }, // 10 PPS
      lastActiveTimestamp: virtualTime,
    });

    // Chuyển Hidden ở t0
    const hideTime = virtualTime;
    (document as any).visibilityState = 'hidden';
    useGameStore.getState().handleVisibilityChange(false, hideTime);

    // Người chơi vắng mặt 60 giây (1 phút)
    virtualTime += 60_000;

    // Quay lại Visible
    (document as any).visibilityState = 'visible';
    useGameStore.getState().handleVisibilityChange(true, virtualTime);

    const state = useGameStore.getState();
    // 60s * 10 PPS * 0.50 (offline rate) = 300 điểm
    // 250 + 300 = 550 điểm
    expect(state.points).toBe(550);
    expect(state.totalPointsEarned).toBe(550);

    // Hiển thị modal offline reward
    expect(state.offlineReward).not.toBeNull();
    expect(state.offlineReward?.earnedPoints).toBe(300);
    expect(state.offlineReward?.elapsedSeconds).toBe(60);
    expect(state.offlineReward?.wasCapped).toBe(false);
  });

  it('5. Consistent results when reloading page after 60s in hidden state', () => {
    useGameStore.setState({
      points: 100,
      totalPointsEarned: 100,
      upgradeLevels: { frog_touch_team: 1 }, // 10 PPS
      lastActiveTimestamp: virtualTime,
    });

    // Chuyển Hidden
    const hideTime = virtualTime;
    (document as any).visibilityState = 'hidden';
    useGameStore.getState().handleVisibilityChange(false, hideTime);

    // 60s trôi qua trong trạng thái hidden
    virtualTime += 60_000;

    // Giả lập reload trang:
    // 1. Dữ liệu nạp từ LocalStorage lúc mount
    const saved = loadGameStateFromStorage();
    expect(saved.lastSavedTimestamp).toBe(hideTime);

    // 2. Component App mount và gọi handleVisibilityChange(true, virtualTime)
    useGameStore.getState().handleVisibilityChange(true, virtualTime);

    const reloadedState = useGameStore.getState();
    // 60s * 10 PPS * 0.5 = 300 điểm -> 100 + 300 = 400 điểm
    expect(reloadedState.points).toBe(400);
    expect(reloadedState.offlineReward?.earnedPoints).toBe(300);
  });

  it('6. Enforces safe 8-hour cap (28,800s): 10-hour and 24-hour absence award identical points', () => {
    useGameStore.setState({
      points: 0,
      totalPointsEarned: 0,
      upgradeLevels: { frog_touch_team: 10 }, // 100 PPS
      lastActiveTimestamp: virtualTime,
    });

    // Trường hợp A: Vắng mặt 10 giờ (36,000s)
    const t0 = virtualTime;
    useGameStore.getState().handleVisibilityChange(false, t0);
    const t10h = t0 + 10 * 3600 * 1000;
    useGameStore.getState().handleVisibilityChange(true, t10h);

    const reward10h = useGameStore.getState().offlineReward;
    expect(reward10h).not.toBeNull();
    expect(reward10h?.wasCapped).toBe(true);
    // 28,800s cap * 100 PPS * 0.5 = 1,440,000 points
    expect(reward10h?.earnedPoints).toBe(1_440_000);

    // Reset lại store để thử nghiệm Trường hợp B
    useGameStore.getState().resetGame();
    useGameStore.setState({
      points: 0,
      totalPointsEarned: 0,
      upgradeLevels: { frog_touch_team: 10 },
      lastActiveTimestamp: t0,
    });

    // Trường hợp B: Vắng mặt 24 giờ (86,400s)
    useGameStore.getState().handleVisibilityChange(false, t0);
    const t24h = t0 + 24 * 3600 * 1000;
    useGameStore.getState().handleVisibilityChange(true, t24h);

    const reward24h = useGameStore.getState().offlineReward;
    expect(reward24h).not.toBeNull();
    expect(reward24h?.wasCapped).toBe(true);
    expect(reward24h?.earnedPoints).toBe(1_440_000);

    // Điểm thưởng của 10h và 24h là bằng nhau tuyệt đối nhờ trần an toàn 8 giờ
    expect(reward24h?.earnedPoints).toBe(reward10h?.earnedPoints);
  });

  it('7. Repeated reloads or immediate dismiss does not double-count elapsed offline time', () => {
    useGameStore.setState({
      points: 1000,
      totalPointsEarned: 1000,
      upgradeLevels: { frog_touch_team: 1 }, // 10 PPS
      lastActiveTimestamp: virtualTime,
    });

    // Vắng mặt 100s
    const t0 = virtualTime;
    useGameStore.getState().handleVisibilityChange(false, t0);
    virtualTime += 100_000;
    useGameStore.getState().handleVisibilityChange(true, virtualTime);

    // Điểm tăng: 100s * 10 * 0.5 = 500đ -> 1500đ
    expect(useGameStore.getState().points).toBe(1500);

    // Người chơi bấm đóng popup
    useGameStore.getState().dismissOfflineReward();
    expect(useGameStore.getState().offlineReward).toBeNull();

    // Giả lập ngay sau đó reload lại trang hoặc gọi lại visibility check sau 2s
    virtualTime += 2000;
    useGameStore.getState().handleVisibilityChange(true, virtualTime);

    // Điểm tăng thêm đúng 20đ (2s * 10 PPS theo chính sách bù 100% active khi vắng mặt < 30s) -> 1520đ
    // Khẳng định: Khoảng thời gian offline 100s trước đó (500đ) KHÔNG hề bị tính lặp lại lần 2!
    expect(useGameStore.getState().points).toBe(1520);
    expect(useGameStore.getState().offlineReward).toBeNull();
  });
});
