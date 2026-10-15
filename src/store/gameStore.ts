import { create } from 'zustand';
import { FrogBuff, FrogOwned, GameSettings } from '../engine/types';
import {
  processFrogClick,
  calculateClickPower,
  calculateCritStats,
  calculateComboMultiplier,
  formatNumber,
} from '../engine/clicker';
import {
  calculatePointsPerSecond,
  accumulateDeltaPoints,
  calculateOfflineReward,
  OfflineRewardResult,
} from '../engine/idle';
import { purchaseUpgrade } from '../engine/upgrade';
import {
  calculateActiveFrogBuffs,
  canLevelUpFrog,
  levelUpFrog as executeLevelUp,
  getFrogSpeciesById,
} from '../engine/frogs';
import {
  GachaPityState,
  GachaSessionResult,
  INITIAL_PITY_STATE,
  executeGacha,
} from '../engine/gacha';
import {
  GameSaveData,
  DEFAULT_INITIAL_SAVE,
  loadGameStateFromStorage,
  saveGameStateToStorage,
  exportSaveToString,
  importSaveFromString,
  clearSavedGame,
} from '../engine/save';
import { evaluateAchievements } from '../engine/achievements';
import { soundManager } from '../engine/audio';

export interface FloatingTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  isCrit: boolean;
  color: string;
}

export type ActiveTab = 'pond' | 'upgrades' | 'gacha' | 'collection' | 'achievements' | 'settings';

export interface GameStoreState {
  // Core State
  points: number;
  totalPointsEarned: number;
  totalClicks: number;
  currentCombo: number;
  highestCombo: number;
  lastClickTimestamp: number;
  upgradeLevels: Record<string, number>;
  ownedFrogs: Record<string, FrogOwned>;
  mainFrogId: string;
  pity: GachaPityState;
  unlockedAchievements: string[];
  settings: GameSettings;

  // Runtime UI State
  activeTab: ActiveTab;
  floatingTexts: FloatingTextItem[];
  offlineReward: OfflineRewardResult | null;
  newAchievementUnlocked: string | null; // ID of newly unlocked achievement for notification toast
  idleAccumulator: number;

  // Actions
  clickFrog: (clickX?: number, clickY?: number) => void;
  removeFloatingText: (id: string) => void;
  tick: (deltaSeconds: number) => void;
  buyUpgrade: (id: string, mode: 'x1' | 'x10' | 'max') => boolean;
  pullGacha: (count: 1 | 10) => GachaSessionResult | null;
  setMainFrog: (id: string) => void;
  levelUpFrog: (id: string) => boolean;
  dismissOfflineReward: () => void;
  dismissAchievementToast: () => void;
  setSettings: (settings: Partial<GameSettings>) => void;
  setActiveTab: (tab: ActiveTab) => void;
  exportSave: () => string;
  importSave: (code: string) => { success: boolean; message?: string };
  resetGame: () => void;
}

// Khởi tạo state từ lưu trữ cục bộ
const initialLoaded = loadGameStateFromStorage();

export const useGameStore = create<GameStoreState>((set, get) => {
  // Đồng bộ âm thanh từ cài đặt đã lưu
  soundManager.setSoundEnabled(initialLoaded.settings.soundEnabled);
  soundManager.setVolume(initialLoaded.settings.volume);

  return {
    points: initialLoaded.points,
    totalPointsEarned: initialLoaded.totalPointsEarned,
    totalClicks: initialLoaded.totalClicks,
    currentCombo: 0,
    highestCombo: 0,
    lastClickTimestamp: 0,
    upgradeLevels: initialLoaded.upgrades || {},
    ownedFrogs: initialLoaded.ownedFrogs || DEFAULT_INITIAL_SAVE.ownedFrogs,
    mainFrogId: initialLoaded.mainFrogId || 'green_frog',
    pity: initialLoaded.pity || INITIAL_PITY_STATE,
    unlockedAchievements: initialLoaded.unlockedAchievements || [],
    settings: initialLoaded.settings || DEFAULT_INITIAL_SAVE.settings,

    activeTab: 'pond',
    floatingTexts: [],
    offlineReward: null,
    newAchievementUnlocked: null,
    idleAccumulator: 0,

    clickFrog: (clickX, clickY) => {
      const state = get();
      const activeBuffs = calculateActiveFrogBuffs(state.mainFrogId, state.ownedFrogs);

      const { result, newCombo, newTimestamp } = processFrogClick({
        baseClickPower: 1,
        upgradeLevels: state.upgradeLevels,
        activeFrogBuffs: activeBuffs,
        currentCombo: state.currentCombo,
        lastClickTimestamp: state.lastClickTimestamp,
      });

      // Phát âm thanh
      if (result.isCritical) {
        soundManager.playClick(true);
      } else {
        soundManager.playClick(false);
        // Có tỉ lệ 10% phát thêm tiếng ộp ộp khi sờ
        if (Math.random() < 0.12) {
          soundManager.playRibbit();
        }
      }

      // Tạo floating text
      const newFloatingTexts = [...state.floatingTexts];
      if (clickX !== undefined && clickY !== undefined) {
        const textLabel = result.isCritical
          ? `+${formatNumber(result.earnedPoints)} CHÍ MẠNG!`
          : `+${formatNumber(result.earnedPoints)}`;
        
        newFloatingTexts.push({
          id: `${Date.now()}_${Math.random()}`,
          text: textLabel,
          x: clickX,
          y: clickY,
          isCrit: result.isCritical,
          color: result.isCritical ? '#facc15' : '#4ade80',
        });
        // Giới hạn tối đa 15 floating text cùng lúc để tối ưu FPS
        if (newFloatingTexts.length > 15) {
          newFloatingTexts.shift();
        }
      }

      const newTotalClicks = state.totalClicks + 1;
      const newPoints = state.points + result.earnedPoints;
      const newTotalPointsEarned = state.totalPointsEarned + result.earnedPoints;
      const highestCombo = Math.max(state.highestCombo, newCombo);

      // Đánh giá thành tựu
      const evalRes = evaluateAchievements(
        {
          totalClicks: newTotalClicks,
          totalPointsEarned: newTotalPointsEarned,
          points: newPoints,
          ownedFrogs: state.ownedFrogs,
          upgrades: state.upgradeLevels,
          highestCombo,
        },
        state.unlockedAchievements
      );

      let newlyUnlockedToast = state.newAchievementUnlocked;
      if (evalRes.newlyUnlockedIds.length > 0) {
        soundManager.playAchievement();
        newlyUnlockedToast = evalRes.newlyUnlockedIds[0];
      }

      set({
        points: newPoints,
        totalPointsEarned: newTotalPointsEarned,
        totalClicks: newTotalClicks,
        currentCombo: newCombo,
        highestCombo,
        lastClickTimestamp: newTimestamp,
        floatingTexts: newFloatingTexts,
        unlockedAchievements: evalRes.achievements.filter((a) => a.isUnlocked).map((a) => a.id),
        newAchievementUnlocked: newlyUnlockedToast,
      });
    },

    removeFloatingText: (id) => {
      set((state) => ({
        floatingTexts: state.floatingTexts.filter((t) => t.id !== id),
      }));
    },

    tick: (deltaSeconds) => {
      const state = get();
      const activeBuffs = calculateActiveFrogBuffs(state.mainFrogId, state.ownedFrogs);
      const pps = calculatePointsPerSecond(state.upgradeLevels, activeBuffs);

      // Kiểm tra timeout combo
      let updatedCombo = state.currentCombo;
      if (state.lastClickTimestamp > 0 && Date.now() - state.lastClickTimestamp > 2000 && state.currentCombo > 0) {
        updatedCombo = 0;
      }

      if (pps <= 0) {
        if (updatedCombo !== state.currentCombo) {
          set({ currentCombo: updatedCombo });
        }
        return;
      }

      const { pointsToAdd, newAccumulator } = accumulateDeltaPoints(
        pps,
        deltaSeconds,
        state.idleAccumulator
      );

      if (pointsToAdd > 0 || updatedCombo !== state.currentCombo) {
        const newPoints = state.points + pointsToAdd;
        const newTotalPointsEarned = state.totalPointsEarned + pointsToAdd;

        // Đánh giá thành tựu định kỳ
        const evalRes = evaluateAchievements(
          {
            totalClicks: state.totalClicks,
            totalPointsEarned: newTotalPointsEarned,
            points: newPoints,
            ownedFrogs: state.ownedFrogs,
            upgrades: state.upgradeLevels,
            highestCombo: state.highestCombo,
            pointsPerSecond: pps,
          },
          state.unlockedAchievements
        );

        let newlyUnlockedToast = state.newAchievementUnlocked;
        if (evalRes.newlyUnlockedIds.length > 0) {
          soundManager.playAchievement();
          newlyUnlockedToast = evalRes.newlyUnlockedIds[0];
        }

        set({
          points: newPoints,
          totalPointsEarned: newTotalPointsEarned,
          currentCombo: updatedCombo,
          idleAccumulator: newAccumulator,
          unlockedAchievements: evalRes.achievements.filter((a) => a.isUnlocked).map((a) => a.id),
          newAchievementUnlocked: newlyUnlockedToast,
        });
      } else {
        set({ idleAccumulator: newAccumulator, currentCombo: updatedCombo });
      }
    },

    buyUpgrade: (id, mode) => {
      const state = get();
      const activeBuffs = calculateActiveFrogBuffs(state.mainFrogId, state.ownedFrogs);
      const result = purchaseUpgrade(
        id,
        mode,
        state.points,
        state.upgradeLevels,
        activeBuffs
      );

      if (!result.success) return false;

      soundManager.playUpgrade();

      // Đánh giá thành tựu sau khi mua
      const evalRes = evaluateAchievements(
        {
          totalClicks: state.totalClicks,
          totalPointsEarned: state.totalPointsEarned,
          points: result.newPoints,
          ownedFrogs: state.ownedFrogs,
          upgrades: result.newLevels,
          highestCombo: state.highestCombo,
        },
        state.unlockedAchievements
      );

      set({
        points: result.newPoints,
        upgradeLevels: result.newLevels,
        unlockedAchievements: evalRes.achievements.filter((a) => a.isUnlocked).map((a) => a.id),
      });

      return true;
    },

    pullGacha: (count) => {
      const state = get();
      const res = executeGacha(count, state.points, state.ownedFrogs, state.pity);
      if (!res.success || !res.session) {
        return null;
      }

      const session = res.session;

      // Đánh giá thành tựu gacha & collection
      const evalRes = evaluateAchievements(
        {
          totalClicks: state.totalClicks,
          totalPointsEarned: state.totalPointsEarned,
          points: session.newPoints,
          ownedFrogs: session.newOwnedFrogs,
          upgrades: state.upgradeLevels,
          highestCombo: state.highestCombo,
        },
        state.unlockedAchievements
      );

      let newlyUnlockedToast = state.newAchievementUnlocked;
      if (evalRes.newlyUnlockedIds.length > 0) {
        soundManager.playAchievement();
        newlyUnlockedToast = evalRes.newlyUnlockedIds[0];
      }

      set({
        points: session.newPoints,
        ownedFrogs: session.newOwnedFrogs,
        pity: session.newPity,
        unlockedAchievements: evalRes.achievements.filter((a) => a.isUnlocked).map((a) => a.id),
        newAchievementUnlocked: newlyUnlockedToast,
      });

      return session;
    },

    setMainFrog: (id) => {
      const state = get();
      if (!state.ownedFrogs[id]) return;
      soundManager.playRibbit(1.1);
      set({ mainFrogId: id });
    },

    levelUpFrog: (id) => {
      const state = get();
      const owned = state.ownedFrogs[id];
      if (!owned) return false;

      const res = executeLevelUp(owned);
      if (!res.success) return false;

      soundManager.playUpgrade();
      set({
        ownedFrogs: {
          ...state.ownedFrogs,
          [id]: res.newFrog,
        },
      });
      return true;
    },

    dismissOfflineReward: () => {
      set({ offlineReward: null });
    },

    dismissAchievementToast: () => {
      set({ newAchievementUnlocked: null });
    },

    setSettings: (partial) => {
      set((state) => {
        const updated = { ...state.settings, ...partial };
        if (partial.soundEnabled !== undefined) {
          soundManager.setSoundEnabled(partial.soundEnabled);
        }
        if (partial.volume !== undefined) {
          soundManager.setVolume(partial.volume);
        }
        return { settings: updated };
      });
    },

    setActiveTab: (tab) => {
      set({ activeTab: tab });
    },

    exportSave: () => {
      const state = get();
      const saveData: GameSaveData = {
        version: 1,
        points: state.points,
        totalPointsEarned: state.totalPointsEarned,
        totalClicks: state.totalClicks,
        upgrades: state.upgradeLevels,
        ownedFrogs: state.ownedFrogs,
        mainFrogId: state.mainFrogId,
        pity: state.pity,
        unlockedAchievements: state.unlockedAchievements,
        settings: state.settings,
        lastSavedTimestamp: Date.now(),
      };
      return exportSaveToString(saveData);
    },

    importSave: (code) => {
      const res = importSaveFromString(code);
      if (!res.success || !res.data) {
        return { success: false, message: res.error || 'Dữ liệu không hợp lệ' };
      }

      const d = res.data;
      saveGameStateToStorage(d);
      set({
        points: d.points,
        totalPointsEarned: d.totalPointsEarned,
        totalClicks: d.totalClicks,
        upgradeLevels: d.upgrades,
        ownedFrogs: d.ownedFrogs,
        mainFrogId: d.mainFrogId,
        pity: d.pity,
        unlockedAchievements: d.unlockedAchievements,
        settings: d.settings,
      });

      return { success: true };
    },

    resetGame: () => {
      clearSavedGame();
      set({
        points: DEFAULT_INITIAL_SAVE.points,
        totalPointsEarned: DEFAULT_INITIAL_SAVE.totalPointsEarned,
        totalClicks: DEFAULT_INITIAL_SAVE.totalClicks,
        currentCombo: 0,
        highestCombo: 0,
        upgradeLevels: {},
        ownedFrogs: DEFAULT_INITIAL_SAVE.ownedFrogs,
        mainFrogId: 'green_frog',
        pity: INITIAL_PITY_STATE,
        unlockedAchievements: [],
        settings: DEFAULT_INITIAL_SAVE.settings,
        floatingTexts: [],
        activeTab: 'pond',
      });
    },
  };
});
