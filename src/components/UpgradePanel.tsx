import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  UPGRADES_CONFIG,
  calculateBatchUpgradeCost,
  calculateMaxAffordableUpgrades,
  getUpgradeDiscount,
} from '../engine/upgrade';
import { calculateActiveFrogBuffs } from '../engine/frogs';
import { formatNumber } from '../engine/clicker';
import { calculatePointsPerSecond } from '../engine/idle';
import {
  Sparkles,
  Hand,
  Cpu,
  Users,
  Clover,
  Flame,
  Factory,
  Wand2,
  Shield,
  Cog,
  Target,
  Award,
  Bot,
  Zap,
  Trees,
  Moon,
  Building2,
  Crown,
  X,
  Clock,
  ChevronRight,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-5 h-5 text-amber-300" />,
  Hand: <Hand className="w-5 h-5 text-emerald-300" />,
  Cpu: <Cpu className="w-5 h-5 text-blue-300" />,
  Users: <Users className="w-5 h-5 text-cyan-300" />,
  Clover: <Clover className="w-5 h-5 text-green-300" />,
  Flame: <Flame className="w-5 h-5 text-orange-400" />,
  Factory: <Factory className="w-5 h-5 text-purple-300" />,
  Wand2: <Wand2 className="w-5 h-5 text-pink-300" />,
  Shield: <Shield className="w-5 h-5 text-slate-200" />,
  Cog: <Cog className="w-5 h-5 text-amber-400" />,
  Target: <Target className="w-5 h-5 text-red-400" />,
  Award: <Award className="w-5 h-5 text-yellow-400" />,
  Bot: <Bot className="w-5 h-5 text-teal-300" />,
  Zap: <Zap className="w-5 h-5 text-yellow-300" />,
  Trees: <Trees className="w-5 h-5 text-emerald-400" />,
  Moon: <Moon className="w-5 h-5 text-indigo-300" />,
  Building2: <Building2 className="w-5 h-5 text-blue-400" />,
  Crown: <Crown className="w-5 h-5 text-yellow-300" />,
};

const NEXT_MILESTONES = [10, 25, 50, 100, 200];

export const UpgradePanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const points = useGameStore((s) => s.points);
  const upgradeLevels = useGameStore((s) => s.upgradeLevels);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const mainFrogId = useGameStore((s) => s.mainFrogId);
  const ownedFrogs = useGameStore((s) => s.ownedFrogs);

  const [buyMode, setBuyMode] = useState<'x1' | 'x10' | 'max'>('x1');
  const [filterCategory, setFilterCategory] = useState<'all' | 'click' | 'idle' | 'special'>('all');

  const activeBuffs = calculateActiveFrogBuffs(mainFrogId, ownedFrogs);
  const discount = getUpgradeDiscount(activeBuffs);
  const pps = calculatePointsPerSecond(upgradeLevels, activeBuffs);

  // Lọc nâng cấp theo category
  const filteredUpgrades = UPGRADES_CONFIG.filter((u) => {
    if (filterCategory === 'all') return true;
    return u.category === filterCategory;
  });

  // Định dạng thời gian cần thiết
  const formatTimeNeeded = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} phút`;
    return `${(seconds / 3600).toFixed(1)} giờ`;
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-pond-600/30 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
      >
        {/* Panel Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pond-600/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-white">Nâng Cấp Kỹ Năng ({UPGRADES_CONFIG.length})</h2>
              <p className="text-xs text-slate-400">Gia tăng sức mạnh sờ ếch và thu nhập tự động</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switcher: x1, x10, MAX */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700 text-xs font-semibold">
              {(['x1', 'x10', 'max'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBuyMode(mode)}
                  className={`px-3 py-1 rounded-lg uppercase transition-all ${
                    buyMode === mode
                      ? 'bg-pond-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs Filter */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'click', label: '🖐️ Sờ Tay' },
            { id: 'idle', label: '⚡ Tự Động' },
            { id: 'special', label: '✨ Đặc Biệt' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
                filterCategory === cat.id
                  ? 'bg-pond-600/30 text-emerald-300 border border-pond-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
          {discount > 0 && (
            <span className="ml-auto text-[11px] font-semibold text-emerald-400 shrink-0 bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-500/30">
              Giảm giá ếch: -{(discount * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {/* Upgrade Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredUpgrades.map((upgrade) => {
            const currentLevel = upgradeLevels[upgrade.id] || 0;

            let cost = 0;
            let countToBuy = 0;

            if (buyMode === 'x1') {
              cost = calculateBatchUpgradeCost(upgrade.basePrice, currentLevel, 1, discount);
              countToBuy = 1;
            } else if (buyMode === 'x10') {
              cost = calculateBatchUpgradeCost(upgrade.basePrice, currentLevel, 10, discount);
              countToBuy = 10;
            } else if (buyMode === 'max') {
              const maxInfo = calculateMaxAffordableUpgrades(
                upgrade.basePrice,
                currentLevel,
                points,
                discount
              );
              cost = maxInfo.totalCost;
              countToBuy = maxInfo.count;
            }

            const canAfford = countToBuy > 0 && points >= cost;
            const nextMilestone = NEXT_MILESTONES.find((m) => m > currentLevel) || (Math.floor(currentLevel / 100) + 1) * 100;

            // Tính thời gian cần để đủ tiền
            let timeNeededText: string | null = null;
            if (!canAfford && pps > 0) {
              const priceForOne = calculateBatchUpgradeCost(upgrade.basePrice, currentLevel, 1, discount);
              if (points < priceForOne) {
                const diff = priceForOne - points;
                timeNeededText = `còn ~${formatTimeNeeded(Math.ceil(diff / pps))}`;
              }
            }

            return (
              <div
                key={upgrade.id}
                className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  canAfford
                    ? 'bg-slate-800/60 border-slate-700/80 hover:border-pond-500/50'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-85'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    {ICON_MAP[upgrade.icon] || <Sparkles className="w-5 h-5 text-pond-400" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                        {upgrade.name}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400">
                        Cấp {currentLevel}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Mốc tới: {nextMilestone})
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{upgrade.description}</p>
                    {timeNeededText && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{timeNeededText} (tại +{formatNumber(pps)}/s)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  disabled={!canAfford}
                  onClick={() => buyUpgrade(upgrade.id, buyMode)}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shrink-0 active:scale-95 ${
                    canAfford
                      ? 'bg-gradient-to-r from-pond-600 to-emerald-500 hover:from-pond-500 hover:to-emerald-400 text-slate-950 shadow-md shadow-pond-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  <span>
                    Mua {buyMode === 'max' ? (countToBuy > 0 ? `+${countToBuy}` : '0') : `+${countToBuy}`}
                  </span>
                  <span className="opacity-90">({formatNumber(cost)} đ)</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
