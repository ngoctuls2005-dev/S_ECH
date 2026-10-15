import React, { useEffect, useRef } from 'react';
import { useGameStore, ActiveTab } from './store/gameStore';
import { Header } from './components/Header';
import { PondArea } from './components/PondArea';
import { BottomNav } from './components/BottomNav';
import { UpgradePanel } from './components/UpgradePanel';
import { GachaModal } from './components/GachaModal';
import { CollectionModal } from './components/CollectionModal';
import { AchievementsModal } from './components/AchievementsModal';
import { SettingsModal } from './components/SettingsModal';
import { calculateOfflineReward, calculatePointsPerSecond } from './engine/idle';
import { calculateActiveFrogBuffs, RARITY_CONFIG } from './engine/frogs';
import { calculateClickPower, calculateCritStats, formatNumber } from './engine/clicker';
import { saveGameStateToStorage } from './engine/save';
import { ACHIEVEMENTS_DEFINITIONS } from './engine/achievements';
import {
  Sparkles,
  Egg,
  BookOpen,
  Trophy,
  Settings,
  Flame,
  Zap,
  Hand,
  X,
  Target,
} from 'lucide-react';

export default function App() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const tick = useGameStore((s) => s.tick);

  const points = useGameStore((s) => s.points);
  const totalPointsEarned = useGameStore((s) => s.totalPointsEarned);
  const totalClicks = useGameStore((s) => s.totalClicks);
  const upgradeLevels = useGameStore((s) => s.upgradeLevels);
  const ownedFrogs = useGameStore((s) => s.ownedFrogs);
  const mainFrogId = useGameStore((s) => s.mainFrogId);
  const currentCombo = useGameStore((s) => s.currentCombo);
  const highestCombo = useGameStore((s) => s.highestCombo);

  const newAchievementUnlocked = useGameStore((s) => s.newAchievementUnlocked);
  const dismissAchievementToast = useGameStore((s) => s.dismissAchievementToast);
  const offlineReward = useGameStore((s) => s.offlineReward);
  const dismissOfflineReward = useGameStore((s) => s.dismissOfflineReward);

  // Stats calculation
  const activeBuffs = calculateActiveFrogBuffs(mainFrogId, ownedFrogs);
  const pps = calculatePointsPerSecond(upgradeLevels, activeBuffs);
  const clickPower = calculateClickPower(1, upgradeLevels, activeBuffs);
  const { critChance, critMultiplier } = calculateCritStats(upgradeLevels, activeBuffs);
  const ownedCount = Object.keys(ownedFrogs).length;

  // Game loop tick
  const lastTimeRef = useRef<number>(performance.now());
  useEffect(() => {
    let animId: number;

    const loop = (currentTime: number) => {
      const deltaSeconds = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      if (deltaSeconds > 0 && deltaSeconds < 5) {
        tick(deltaSeconds);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [tick]);

  // Offline reward calculation
  useEffect(() => {
    const state = useGameStore.getState();
    const buffs = calculateActiveFrogBuffs(state.mainFrogId, state.ownedFrogs);
    const currPps = calculatePointsPerSecond(state.upgradeLevels, buffs);

    if (currPps > 0 && state.lastClickTimestamp > 0) {
      const reward = calculateOfflineReward(state.lastClickTimestamp, Date.now(), currPps);
      if (reward && reward.earnedPoints > 0) {
        useGameStore.setState({
          offlineReward: reward,
          points: state.points + reward.earnedPoints,
          totalPointsEarned: state.totalPointsEarned + reward.earnedPoints,
        });
      }
    }
  }, []);

  // Auto-save periodic & on tab close
  useEffect(() => {
    const saveCurrent = () => {
      const state = useGameStore.getState();
      saveGameStateToStorage({
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
      });
    };

    const interval = setInterval(saveCurrent, 5000);
    const handleBeforeUnload = () => saveCurrent();

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveCurrent();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const currentAchievement = newAchievementUnlocked
    ? ACHIEVEMENTS_DEFINITIONS.find((a) => a.id === newAchievementUnlocked)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-pond-950 to-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden pb-20 md:pb-0">
      <Header />

      {/* Main Container: 3-column desktop layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 flex flex-col md:flex-row items-stretch gap-4 relative">
        {/* Left Side (Desktop): Fast Navigation & Quick Actions */}
        <aside className="hidden lg:flex flex-col gap-3 w-64 shrink-0">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-pond-300 font-heading">
              Tính Năng Trò Chơi
            </h3>

            <button
              onClick={() => setActiveTab('upgrades')}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-pond-900/80 to-slate-800/80 hover:from-pond-800 hover:to-slate-700 border border-pond-600/30 flex items-center justify-between text-left transition-all active:scale-95 group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pond-600/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-heading">Nâng Cấp</h4>
                  <p className="text-[11px] text-slate-400">8 loại kỹ năng</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('gacha')}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-950/80 to-slate-800/80 hover:from-purple-900 hover:to-slate-700 border border-purple-600/30 flex items-center justify-between text-left transition-all active:scale-95 group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-400 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                  🥚
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-heading">Hồ Gacha</h4>
                  <p className="text-[11px] text-slate-400">Ấp trứng tìm ếch quý</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('collection')}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-950/80 to-slate-800/80 hover:from-blue-900 hover:to-slate-700 border border-blue-600/30 flex items-center justify-between text-left transition-all active:scale-95 group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-heading">Bộ Sưu Tập</h4>
                  <p className="text-[11px] text-slate-400">{ownedCount} / 15 loài đã mở</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('achievements')}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-950/80 to-slate-800/80 hover:from-amber-900 hover:to-slate-700 border border-amber-600/30 flex items-center justify-between text-left transition-all active:scale-95 group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-heading">Thành Tựu</h4>
                  <p className="text-[11px] text-slate-400">Cột mốc vinh quang</p>
                </div>
              </div>
            </button>
          </div>
        </aside>

        {/* Center: Cozy Pond Canvas & Main Interactive Frog */}
        <section className="flex-1 flex flex-col items-center justify-between bg-slate-900/60 backdrop-blur-md border border-pond-600/20 rounded-3xl overflow-hidden shadow-2xl relative min-h-[500px]">
          <PondArea />
        </section>

        {/* Right Side (Desktop): Statistics Overview Card */}
        <aside className="hidden xl:flex flex-col gap-3 w-64 shrink-0">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-pond-300 font-heading">
              Thống Kê Gameplay
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400">Tổng lần sờ:</span>
                <span className="font-bold text-white">{totalClicks.toLocaleString('vi-VN')}</span>
              </div>

              <div className="flex justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400">Tổng điểm kiếm:</span>
                <span className="font-bold text-emerald-400">{formatNumber(totalPointsEarned)}</span>
              </div>

              <div className="flex justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400">Điểm mỗi cú sờ:</span>
                <span className="font-bold text-white">+{formatNumber(clickPower)}</span>
              </div>

              <div className="flex justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400">Thu nhập tự động:</span>
                <span className="font-bold text-cyan-400">+{formatNumber(pps)}/s</span>
              </div>

              <div className="flex justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400">Tỉ lệ chí mạng:</span>
                <span className="font-bold text-amber-400">{(critChance * 100).toFixed(1)}%</span>
              </div>

              <div className="flex justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400">Combo cao nhất:</span>
                <span className="font-bold text-orange-400">{highestCombo}x</span>
              </div>

              <div className="flex justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400">Ếch đã sở hữu:</span>
                <span className="font-bold text-purple-400">{ownedCount} / 15</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Modals & Panels */}
      {activeTab === 'upgrades' && <UpgradePanel onClose={() => setActiveTab('pond')} />}
      {activeTab === 'gacha' && <GachaModal onClose={() => setActiveTab('pond')} />}
      {activeTab === 'collection' && <CollectionModal onClose={() => setActiveTab('pond')} />}
      {activeTab === 'achievements' && <AchievementsModal onClose={() => setActiveTab('pond')} />}
      {activeTab === 'settings' && <SettingsModal onClose={() => setActiveTab('pond')} />}

      {/* Achievement Toast */}
      {currentAchievement && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 bg-slate-900/95 border border-amber-400/60 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-bounce">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Thành Tựu Mở Khóa!
            </p>
            <h4 className="text-sm font-bold text-white font-heading">
              {currentAchievement.name}
            </h4>
            <p className="text-xs text-slate-300">{currentAchievement.description}</p>
          </div>
          <button onClick={dismissAchievementToast} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Offline Reward Modal */}
      {offlineReward && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-pond-500/40 p-6 rounded-3xl max-w-md w-full text-center shadow-2xl relative animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-pond-600/30 border border-pond-400/40 flex items-center justify-center text-3xl mx-auto mb-4">
              🐸💤
            </div>
            <h3 className="text-2xl font-bold font-heading text-pond-300 mb-2">
              Chào Mừng Trở Lại!
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              Trong lúc bạn vắng mặt ({Math.floor(offlineReward.cappedSeconds / 60)} phút), các chú ếch đã tích cực làm việc!
            </p>
            <div className="bg-pond-950/60 border border-pond-600/30 p-4 rounded-2xl mb-6">
              <span className="text-xs text-slate-400 block mb-1">Thu nhập tự động (50%)</span>
              <span className="text-3xl font-extrabold text-emerald-400 font-heading">
                +{offlineReward.earnedPoints.toLocaleString('vi-VN')}
              </span>
              <span className="text-xs text-slate-400 block mt-1">Điểm Sờ Ếch</span>
            </div>
            <button
              onClick={dismissOfflineReward}
              className="w-full py-3 bg-gradient-to-r from-pond-600 to-emerald-500 hover:from-pond-500 hover:to-emerald-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-pond-500/30 transition-all active:scale-95"
            >
              Nhận Thưởng Ngay
            </button>
          </div>
        </div>
      )}
      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
