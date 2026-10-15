import React from 'react';
import { useGameStore, ActiveTab } from '../store/gameStore';
import { Sparkles, BookOpen, Trophy, Settings } from 'lucide-react';
import { UPGRADES_CONFIG, calculateBatchUpgradeCost } from '../engine/upgrade';

export const BottomNav: React.FC = () => {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const points = useGameStore((s) => s.points);
  const upgradeLevels = useGameStore((s) => s.upgradeLevels);

  // Tính số lượng nâng cấp có thể mua được ngay bây giờ
  const affordableUpgradesCount = UPGRADES_CONFIG.filter((u) => {
    const lvl = upgradeLevels[u.id] || 0;
    const cost = calculateBatchUpgradeCost(u.basePrice, lvl, 1);
    return points >= cost;
  }).length;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'pond',
      label: 'Ao Sen',
      icon: <span className="text-xl">🐸</span>,
    },
    {
      id: 'upgrades',
      label: 'Nâng Cấp',
      icon: <Sparkles className="w-5 h-5" />,
      badge: affordableUpgradesCount > 0 ? affordableUpgradesCount : undefined,
    },
    {
      id: 'gacha',
      label: 'Hồ Gacha',
      icon: <span className="text-xl">🥚</span>,
    },
    {
      id: 'collection',
      label: 'Bộ Sưu Tập',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: 'achievements',
      label: 'Thành Tựu',
      icon: <Trophy className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-pond-600/30 px-2 py-1.5 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-90 ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
              {isActive && (
                <div className="w-4 h-1 bg-emerald-400 rounded-full mt-0.5 shadow-[0_0_8px_#34d399]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
