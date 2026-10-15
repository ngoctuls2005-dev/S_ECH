import React from 'react';
import { Volume2, VolumeX, Settings, Zap, Flame } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../engine/clicker';
import { calculatePointsPerSecond } from '../engine/idle';
import { calculateActiveFrogBuffs } from '../engine/frogs';

export const Header: React.FC = () => {
  const points = useGameStore((s) => s.points);
  const upgradeLevels = useGameStore((s) => s.upgradeLevels);
  const mainFrogId = useGameStore((s) => s.mainFrogId);
  const ownedFrogs = useGameStore((s) => s.ownedFrogs);
  const currentCombo = useGameStore((s) => s.currentCombo);
  const settings = useGameStore((s) => s.settings);
  const setSettings = useGameStore((s) => s.setSettings);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  const activeBuffs = calculateActiveFrogBuffs(mainFrogId, ownedFrogs);
  const pps = calculatePointsPerSecond(upgradeLevels, activeBuffs);

  const toggleSound = () => {
    setSettings({ soundEnabled: !settings.soundEnabled });
  };

  return (
    <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-pond-600/30 px-4 py-3 sticky top-0 z-40 transition-all shadow-lg shadow-pond-950/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('pond')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pond-600 to-emerald-400 flex items-center justify-center text-2xl shadow-md shadow-pond-500/20 group-hover:scale-105 transition-transform">
            🐸
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-heading bg-gradient-to-r from-pond-300 via-emerald-400 to-cream-light bg-clip-text text-transparent">
              S ẾCH
            </h1>
            <p className="text-[10px] text-pond-300/80 uppercase tracking-widest hidden sm:block">
              Ao Sen Thư Giãn
            </p>
          </div>
        </div>

        {/* Center: Score & DPS Indicator */}
        <div className="flex flex-col items-center select-none">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-pond-300 tracking-tight drop-shadow-[0_0_12px_rgba(74,222,128,0.35)]">
              {formatNumber(points)}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-400/90 uppercase tracking-wider">
              Điểm
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1 font-medium text-emerald-400">
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>+{formatNumber(pps)}/giây</span>
            </span>

            {currentCombo > 1 && (
              <span className="flex items-center gap-1 text-amber-400 font-bold animate-bounce">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                <span>Combo x{currentCombo}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            aria-label="Bật tắt âm thanh"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-pond-300 transition-all shadow-sm active:scale-95"
            title={settings.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            aria-label="Cài đặt"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-pond-300 transition-all shadow-sm active:scale-95"
            title="Cài đặt game"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
