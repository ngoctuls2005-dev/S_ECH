import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  GACHA_COST_SINGLE,
  GACHA_COST_TEN,
  GACHA_POOLS,
  GachaPoolType,
  GachaSessionResult,
  GachaPullResult,
  getSpeciesDropRates,
  getNextPullGuaranteedStatus,
} from '../engine/gacha';
import { RARITY_CONFIG } from '../engine/frogs';
import { formatNumber } from '../engine/clicker';
import { soundManager } from '../engine/audio';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  HelpCircle, 
  X, 
  History, 
  RotateCcw, 
  Flame, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

export const GachaModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const points = useGameStore((s) => s.points);
  const pity = useGameStore((s) => s.pity);
  const ownedFrogs = useGameStore((s) => s.ownedFrogs);
  const gachaHistory = useGameStore((s) => s.gachaHistory);
  const pullGacha = useGameStore((s) => s.pullGacha);

  // Pool Selection State
  const [selectedPool, setSelectedPool] = useState<GachaPoolType>('ao_sen');

  // Animation & UI States
  const [isHatching, setIsHatching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [skipAnim, setSkipAnim] = useState(false);
  const [showOdds, setShowOdds] = useState(false);
  const [showDetailedRates, setShowDetailedRates] = useState(false);
  const [rateTableMode, setRateTableMode] = useState<'base' | 'next_pull'>('base');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTenPullConfirm, setShowTenPullConfirm] = useState(false);
  const [confirmTenPullSetting, setConfirmTenPullSetting] = useState(true);
  const [results, setResults] = useState<GachaPullResult[] | null>(null);
  const animationTimersRef = useRef<number[]>([]);

  useEffect(() => () => {
    animationTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    animationTimersRef.current = [];
  }, []);

  const scheduleAnimationTimeout = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      animationTimersRef.current = animationTimersRef.current.filter((pending) => pending !== timer);
      callback();
    }, delay);
    animationTimersRef.current.push(timer);
  };

  const poolConfig = GACHA_POOLS[selectedPool];
  const guaranteedStatus = useMemo(() => getNextPullGuaranteedStatus(pity), [pity]);

  // Calculate detailed drop rates for current pool with pity support
  const detailedRates = useMemo(
    () => getSpeciesDropRates(selectedPool, ownedFrogs, pity, rateTableMode === 'next_pull'),
    [selectedPool, ownedFrogs, pity, rateTableMode]
  );

  const executePull = (count: 1 | 10) => {
    const cost = count === 1 ? GACHA_COST_SINGLE : GACHA_COST_TEN;
    if (points < cost || isProcessing || isHatching) return;

    setIsProcessing(true);
    const session = pullGacha(count, selectedPool);
    if (!session) {
      setIsProcessing(false);
      return;
    }

    // Tìm độ hiếm cao nhất trong lần quay này để kích hoạt âm thanh & pháo hoa
    const highestRarity = session.pulls.reduce((highest, pull) => {
      const order = ['common', 'rare', 'epic', 'legendary', 'mythic'];
      return order.indexOf(pull.species.rarity) > order.indexOf(highest)
        ? pull.species.rarity
        : highest;
    }, 'common' as any);

    if (skipAnim) {
      triggerResultView(session, highestRarity);
      setIsProcessing(false);
    } else {
      setIsHatching(true);
      soundManager.playEggCrack();

      scheduleAnimationTimeout(() => {
        soundManager.playEggCrack();
      }, 450);

      scheduleAnimationTimeout(() => {
        setIsHatching(false);
        setIsProcessing(false);
        triggerResultView(session, highestRarity);
      }, 1100);
    }
  };

  const handlePullClick = (count: 1 | 10) => {
    if (count === 10 && confirmTenPullSetting) {
      setShowTenPullConfirm(true);
    } else {
      executePull(count);
    }
  };

  const triggerResultView = (session: GachaSessionResult, highestRarity: any) => {
    soundManager.playGachaReveal(highestRarity);
    setResults(session.pulls);

    if (highestRarity === 'legendary' || highestRarity === 'mythic') {
      try {
        confetti({
          particleCount: highestRarity === 'mythic' ? 140 : 80,
          spread: 85,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  };

  const handleReset = () => {
    setResults(null);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-pond-600/30 rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-xl shadow-md">
              {poolConfig.eggEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-heading text-white">Hồ Gacha Ếch v2.0</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${poolConfig.badgeClass}`}>
                  {poolConfig.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">3 Hồ chuyên đề độc đáo • Dùng chung bảo hiểm Pity</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowOdds(!showOdds)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 border border-slate-700"
              title="Tỉ lệ Gacha"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Tỉ lệ</span>
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 border border-slate-700"
              title="Lịch sử 20 lượt quay gần nhất"
            >
              <History className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Lịch sử</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Pool Selection Tabs */}
        <div className="grid grid-cols-3 bg-slate-950/80 border-b border-slate-800 p-1.5 gap-1.5">
          {(Object.values(GACHA_POOLS) as typeof poolConfig[]).map((pool) => {
            const isSelected = selectedPool === pool.id;
            return (
              <button
                key={pool.id}
                onClick={() => {
                  setSelectedPool(pool.id);
                  setResults(null);
                }}
                className={`py-2 px-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? `bg-gradient-to-r ${pool.bgGradient} border ${pool.borderGlow} text-white font-bold shadow-md`
                    : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{pool.icon}</span>
                  <span className="text-xs sm:text-sm font-bold truncate">{pool.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate hidden sm:inline mt-0.5">
                  {pool.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pity Progress Bars (Dùng chung Pity) */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="bg-slate-900/80 p-1.5 rounded-xl border border-blue-900/30">
            <span className="text-blue-400 font-bold block">Bảo hiểm Hiếm</span>
            <span className="text-slate-300 font-medium">
              Còn {Math.max(0, 10 - pity.sinceLastRare)} lượt
            </span>
          </div>

          <div className="bg-slate-900/80 p-1.5 rounded-xl border border-purple-900/30">
            <span className="text-purple-400 font-bold block">Bảo hiểm Sử Thi</span>
            <span className="text-slate-300 font-medium">
              Còn {Math.max(0, 30 - pity.sinceLastEpic)} lượt
            </span>
          </div>

          <div className="bg-slate-900/80 p-1.5 rounded-xl border border-amber-900/30">
            <span className="text-amber-400 font-bold block">Bảo hiểm Huyền Thoại</span>
            <span className="text-slate-300 font-medium">
              Còn {Math.max(0, 100 - pity.sinceLastLegendary)} lượt
            </span>
          </div>
        </div>

        {/* Odds Dropdown Banner */}
        {showOdds && (
          <div className="p-3 bg-slate-800/95 border-b border-slate-700 text-xs text-slate-300 space-y-2 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.entries(RARITY_CONFIG).map(([key, info]) => (
                <div key={key} className="p-2 rounded-xl bg-slate-900/70 border border-slate-700 text-center">
                  <span className={`font-bold block ${info.color}`}>{info.nameVi}</span>
                  <span className="text-sm font-extrabold text-white">{info.gachaWeight}%</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Trùng: +{info.duplicateFragments} mảnh</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-700/60 text-[11px]">
              <span className="text-slate-400">
                💡 Tỉ lệ tổng độ hiếm luôn là 50%/28%/15%/6%/1%. Trùng ếch tự động quy đổi thành mảnh thăng cấp.
              </span>
              <button
                onClick={() => setShowDetailedRates(true)}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1 shrink-0 ml-2"
              >
                <span>Xem Bảng Tỷ Lệ Từng Loài</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col items-center justify-center min-h-[300px]">
          {results ? (
            /* Result Cards Screen */
            <div className="w-full">
              <h3 className="text-center font-heading text-xl font-bold text-pond-300 mb-2">
                🎉 Bạn Nhận Được:
              </h3>

              {/* Summary Stats Banner for Pull Results */}
              <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-pond-950/80 via-slate-900/90 to-purple-950/80 border border-pond-500/30 flex flex-wrap items-center justify-around gap-2 text-xs shadow-md">
                <span className="text-white font-medium flex items-center gap-1.5">
                  <span>Khám phá:</span>
                  <strong className="text-emerald-400 font-bold">
                    {results.filter((p) => p.isNew).length} loài mới
                  </strong>
                  <span>✨</span>
                </span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="text-white font-medium flex items-center gap-1.5">
                  <span>Mảnh quy đổi trùng:</span>
                  <strong className="text-yellow-300 font-bold">
                    +{results.reduce((acc, p) => acc + p.fragmentsAdded, 0)} mảnh
                  </strong>
                  <span>🧩</span>
                </span>
              </div>

              <div
                className={`grid gap-3 max-h-[48vh] overflow-y-auto p-2 ${
                  results.length === 1
                    ? 'grid-cols-1 max-w-xs mx-auto'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
                }`}
              >
                {results.map((pull, idx) => {
                  const rarity = RARITY_CONFIG[pull.species.rarity];
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border flex flex-col items-center text-center relative overflow-hidden backdrop-blur-md shadow-lg transition-transform hover:scale-105 ${
                        pull.species.rarity === 'mythic'
                          ? 'border-rose-400 bg-rose-950/40 shadow-rose-500/30'
                          : pull.species.rarity === 'legendary'
                          ? 'border-amber-400 bg-amber-950/40 shadow-amber-400/30'
                          : pull.species.rarity === 'epic'
                          ? 'border-purple-400 bg-purple-950/30'
                          : pull.species.rarity === 'rare'
                          ? 'border-blue-400 bg-blue-950/30'
                          : 'border-slate-700 bg-slate-800/40'
                      }`}
                    >
                      {/* Badge status: MỚI hoặc +MẢNH */}
                      <div className="absolute top-2 right-2">
                        {pull.isNew ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                            MỚI!
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-emerald-400 border border-emerald-500/30">
                            +{pull.fragmentsAdded} Mảnh
                          </span>
                        )}
                      </div>

                      <img
                        src={pull.species.image}
                        alt={pull.species.nameVi}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain my-2 drop-shadow-md"
                      />

                      <span className={`text-[10px] font-bold uppercase ${rarity.color}`}>
                        {rarity.nameVi}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white font-heading mt-0.5 line-clamp-1">
                        {pull.species.nameVi}
                      </h4>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex justify-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  Tiếp Tục Quay
                </button>
              </div>
            </div>
          ) : (
            /* Egg Stage Screen */
            <div className="flex flex-col items-center justify-center my-4 text-center">
              {/* Pool Banner Card */}
              <div className={`mb-4 px-4 py-2.5 rounded-2xl border ${poolConfig.borderGlow} bg-slate-950/70 max-w-md`}>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {poolConfig.description}
                </p>
                {poolConfig.rateUpFrogIds.length > 0 && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-amber-400 font-semibold">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Rate-Up x3 trọng số các loài đặc trưng!</span>
                  </div>
                )}
              </div>

              <div className="relative">
                {/* Glow ring */}
                <div className={`absolute inset-0 rounded-full blur-3xl animate-pulse opacity-40 bg-gradient-to-tr ${poolConfig.bgGradient}`} />

                {/* Egg Container */}
                <div
                  className={`text-8xl sm:text-9xl cursor-pointer select-none transition-transform duration-200 ${
                    isHatching ? 'animate-egg-wobble scale-110' : 'hover:scale-105'
                  }`}
                  onClick={() => handlePullClick(1)}
                  title="Nhấp để ấp trứng!"
                >
                  {isHatching ? `✨${poolConfig.eggEmoji}✨` : poolConfig.eggEmoji}
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                {isHatching ? 'Đang nở... chuẩn bị đón ếch mới!' : 'Chọn số lượt mở bên dưới'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipAnim}
                onChange={(e) => setSkipAnim(e.target.checked)}
                className="w-4 h-4 accent-pond-500 rounded cursor-pointer"
              />
              <span>Bỏ qua hoạt ảnh</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmTenPullSetting}
                onChange={(e) => setConfirmTenPullSetting(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
              <span>Xác nhận quay 10 lượt</span>
            </label>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Quay 1 Lượt */}
            <button
              disabled={points < GACHA_COST_SINGLE || isHatching || isProcessing}
              onClick={() => handlePullClick(1)}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                points >= GACHA_COST_SINGLE && !isHatching && !isProcessing
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <span>Quay 1 Lần</span>
              <span className="text-xs text-emerald-400">({formatNumber(GACHA_COST_SINGLE)} đ)</span>
            </button>

            {/* Quay 10 Lượt */}
            <button
              disabled={points < GACHA_COST_TEN || isHatching || isProcessing}
              onClick={() => handlePullClick(10)}
              className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                points >= GACHA_COST_TEN && !isHatching && !isProcessing
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Quay 10 Lần</span>
              <span className="text-xs text-yellow-200">({formatNumber(GACHA_COST_TEN)} đ)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for 10x Pull */}
      {showTenPullConfirm && (
        <div 
          onClick={() => setShowTenPullConfirm(false)}
          className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-purple-500/50 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl animate-scale-up space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-400/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
              {poolConfig.eggEmoji}✨
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white">Xác Nhận Quay 10 Lượt</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tại {poolConfig.name} với chi phí 5.000 điểm sờ ếch
              </p>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Hồ Gacha:</span>
                <span className="font-bold text-emerald-400">{poolConfig.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Số lượt quay:</span>
                <span className="font-bold text-white">10 Lượt</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Chi phí:</span>
                <span className="font-bold text-yellow-300">-{formatNumber(GACHA_COST_TEN)} điểm</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2">
                <span>Điểm sau khi quay:</span>
                <span className="font-bold text-cyan-300">
                  {Math.max(0, points - GACHA_COST_TEN).toLocaleString('vi-VN')} điểm
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                disabled={isProcessing}
                onClick={() => setShowTenPullConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all active:scale-95"
              >
                Hủy Bỏ
              </button>
              <button
                disabled={isProcessing}
                onClick={() => {
                  setShowTenPullConfirm(false);
                  executePull(10);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-purple-500/30 transition-all active:scale-95"
              >
                Xác Nhận Quay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Drop Rates Modal */}
      {showDetailedRates && (
        <div 
          onClick={() => setShowDetailedRates(false)}
          className="fixed inset-0 z-[65] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  Bảng Xác Suất Chi Tiết: {poolConfig.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Xác suất thực tế dựa theo độ hiếm và hệ số Rate-Up của hồ hiện tại
                </p>
              </div>
              <button
                onClick={() => setShowDetailedRates(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center gap-2">
              <button
                onClick={() => setRateTableMode('base')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  rateTableMode === 'base'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Tỉ Lệ Cơ Bản Chuẩn
              </button>
              <button
                onClick={() => setRateTableMode('next_pull')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  rateTableMode === 'next_pull'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Tỉ Lệ Lượt Tiếp Theo (Theo Pity)
              </button>
            </div>

            {/* Guaranteed Banner if applicable */}
            {rateTableMode === 'next_pull' && guaranteedStatus.isGuaranteed && (
              <div className="mx-4 mt-3 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{guaranteedStatus.description}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {detailedRates.map(({ frog, dropChancePercent, isRateUp }) => {
                const rarity = RARITY_CONFIG[frog.rarity];
                return (
                  <div 
                    key={frog.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      dropChancePercent === 0 
                        ? 'opacity-40 border-slate-800/40 bg-slate-950/20'
                        : isRateUp 
                          ? 'border-amber-500/50 bg-amber-950/20' 
                          : 'border-slate-800 bg-slate-950/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={frog.image} alt={frog.nameVi} className="w-8 h-8 object-contain" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{frog.nameVi}</span>
                          {isRateUp && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500 text-slate-950">
                              RATE-UP
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] ${rarity.color}`}>{rarity.nameVi}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-400 text-xs">
                      {dropChancePercent}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footnote notes */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>• <strong>Rate-Up (x3 trọng số):</strong> Tăng tần suất xuất hiện của loài trong cùng bậc độ hiếm tại hồ này, không tự tăng xác suất tổng của bậc độ hiếm.</p>
              <p>• <strong>Ưu tiên loài mới (x1.4 trọng số):</strong> Loài chưa sở hữu được tăng thêm 40% trọng số để hỗ trợ hoàn thành bộ sưu tập 40 loài.</p>
            </div>
          </div>
        </div>
      )}

      {/* History Modal (20 lượt gần nhất) */}
      {showHistoryModal && (
        <div 
          onClick={() => setShowHistoryModal(false)}
          className="fixed inset-0 z-[65] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  Lịch Sử Quay Gacha (20 lượt gần nhất)
                </h3>
                <p className="text-xs text-slate-400">Lưu trữ kết quả các lần mở trứng gần đây</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {(!gachaHistory || gachaHistory.length === 0) ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Chưa có lịch sử quay nào. Hãy thử ấp quả trứng đầu tiên!
                </div>
              ) : (
                gachaHistory.map((item) => {
                  const rarity = RARITY_CONFIG[item.rarity];
                  const pool = GACHA_POOLS[item.poolId] || GACHA_POOLS.ao_sen;
                  const timeStr = new Date(item.timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rarity.badgeBg}`}>
                          {rarity.nameVi}
                        </span>
                        <div>
                          <span className="font-bold text-white block">{item.frogNameVi}</span>
                          <span className="text-[10px] text-slate-400">
                            {pool.name} • {timeStr}
                          </span>
                        </div>
                      </div>

                      <div>
                        {item.isNew ? (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-500/30">
                            MỚI ✨
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-yellow-300 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30">
                            +{item.fragmentsAdded} Mảnh
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
