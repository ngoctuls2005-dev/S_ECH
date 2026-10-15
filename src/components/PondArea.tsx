import React, { useState, useRef, useEffect } from 'react';
import { useGameStore, FloatingTextItem } from '../store/gameStore';
import { getFrogSpeciesById, RARITY_CONFIG } from '../engine/frogs';
import { formatNumber, calculateClickPower, calculateCritStats } from '../engine/clicker';
import { calculateActiveFrogBuffs } from '../engine/frogs';
import { Sparkles, Flame, Eye } from 'lucide-react';

interface ClickRipple {
  id: string;
  x: number;
  y: number;
}

export const PondArea: React.FC = () => {
  const mainFrogId = useGameStore((s) => s.mainFrogId);
  const ownedFrogs = useGameStore((s) => s.ownedFrogs);
  const upgradeLevels = useGameStore((s) => s.upgradeLevels);
  const currentCombo = useGameStore((s) => s.currentCombo);
  const floatingTexts = useGameStore((s) => s.floatingTexts);
  const clickFrog = useGameStore((s) => s.clickFrog);
  const removeFloatingText = useGameStore((s) => s.removeFloatingText);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  const [isSquished, setIsSquished] = useState(false);
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const pondRef = useRef<HTMLDivElement>(null);

  const species = getFrogSpeciesById(mainFrogId) || getFrogSpeciesById('green_frog')!;
  const ownedInfo = ownedFrogs[mainFrogId] || { level: 1, fragments: 0 };
  const rarityInfo = RARITY_CONFIG[species.rarity];

  const activeBuffs = calculateActiveFrogBuffs(mainFrogId, ownedFrogs);
  const clickPower = calculateClickPower(1, upgradeLevels, activeBuffs);
  const { critChance, critMultiplier } = calculateCritStats(upgradeLevels, activeBuffs);

  // Xử lý click sờ ếch
  const handleFrogTouch = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();

    let clientX: number;
    let clientY: number;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      const rect = pondRef.current?.getBoundingClientRect();
      clientX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      clientY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    }

    // Hiệu ứng squash
    setIsSquished(true);
    setTimeout(() => setIsSquished(false), 140);

    // Thêm ripple
    const pondRect = pondRef.current?.getBoundingClientRect();
    if (pondRect) {
      const rippleX = clientX - pondRect.left;
      const rippleY = clientY - pondRect.top;
      const newRippleId = `${Date.now()}_${Math.random()}`;
      setRipples((prev) => [...prev, { id: newRippleId, x: rippleX, y: rippleY }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRippleId));
      }, 600);
    }

    clickFrog(clientX, clientY);
  };

  return (
    <div
      ref={pondRef}
      className="relative w-full flex-1 flex flex-col items-center justify-between p-4 overflow-hidden select-none min-h-[440px]"
    >
      {/* Background Pond Elements (Lá sen trôi & bóng nước) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ánh sáng hồ nước lung linh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-pond-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        
        {/* Đốm sáng đom đóm bay lơ lửng */}
        <div className="absolute top-16 left-12 w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_12px_#86efac] animate-ping" />
        <div className="absolute top-36 right-20 w-2.5 h-2.5 rounded-full bg-cream shadow-[0_0_15px_#fde68a] animate-bounce" />
        <div className="absolute bottom-24 left-24 w-2 h-2 rounded-full bg-teal-300 shadow-[0_0_10px_#2dd4bf] animate-pulse" />

        {/* Lá sen trang trí mờ ảo ở các góc */}
        <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-gradient-to-tr from-pond-900/60 to-emerald-800/30 border border-pond-600/20 backdrop-blur-[2px] opacity-70" />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-bl from-pond-900/60 to-emerald-800/30 border border-pond-600/20 backdrop-blur-[2px] opacity-60" />
      </div>

      {/* Ripples khi chạm vào hồ */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: '60px',
            height: '60px',
            marginLeft: '-30px',
            marginTop: '-30px',
          }}
        />
      ))}

      {/* Floating Score Texts */}
      {floatingTexts.map((ft) => (
        <FloatingTextItemView
          key={ft.id}
          item={ft}
          onComplete={() => removeFloatingText(ft.id)}
        />
      ))}

      {/* Top Tag: Frog Identity Card */}
      <div className="z-10 bg-slate-900/80 backdrop-blur-md border border-pond-600/40 px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all hover:border-pond-400">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${rarityInfo.badgeBg}`}
        >
          {rarityInfo.nameVi}
        </span>
        <div>
          <h2 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-1.5">
            {species.nameVi}
            <span className="text-xs font-normal text-emerald-400">
              (Cấp {ownedInfo.level})
            </span>
          </h2>
          <p className="text-[11px] text-slate-400 italic">
            {species.scientificName || species.nameEn}
          </p>
        </div>
        <button
          onClick={() => setActiveTab('collection')}
          className="ml-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1 transition-all"
          title="Đổi ếch chính"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Đổi ếch</span>
        </button>
      </div>

      {/* CENTER: The Big Frog on Giant Lilypad */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-4 group">
        {/* Lá Sen Khổng Lồ (Giant Lilypad) */}
        <div className="relative flex items-center justify-center">
          <div className="w-[280px] h-[160px] sm:w-[380px] h-[200px] md:w-[440px] md:h-[230px] rounded-[50%] bg-gradient-to-b from-pond-700 via-pond-800 to-pond-950 border-4 border-pond-500/40 shadow-2xl shadow-pond-950/80 flex items-center justify-center transition-transform group-hover:scale-[1.02]">
            {/* Gân lá sen */}
            <div className="absolute inset-0 rounded-[50%] opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pond-300 via-transparent to-transparent pointer-events-none" />
            <div className="w-[90%] h-[90%] rounded-[50%] border border-pond-400/20" />
          </div>

          {/* Hào quang độ hiếm */}
          <div
            className={`absolute w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] rounded-full blur-2xl pointer-events-none opacity-40 transition-opacity ${
              species.rarity === 'mythic'
                ? 'bg-rose-500 animate-pulse'
                : species.rarity === 'legendary'
                ? 'bg-amber-400'
                : species.rarity === 'epic'
                ? 'bg-purple-500'
                : species.rarity === 'rare'
                ? 'bg-blue-400'
                : 'bg-pond-400'
            }`}
          />

          {/* Con Ếch Thực Tế (Real Frog Transparent WebP) */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleFrogTouch}
            onTouchStart={handleFrogTouch}
            aria-label={`Sờ ếch ${species.nameVi}`}
            className={`absolute cursor-pointer transition-transform duration-75 ease-out select-none focus:outline-none ${
              isSquished ? 'scale-x-[1.18] scale-y-[0.82] translate-y-3' : 'hover:scale-[1.04]'
            }`}
          >
            <img
              src={species.image}
              alt={species.nameVi}
              draggable={false}
              className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)] pointer-events-none"
            />
          </div>
        </div>

        {/* Chú thích nhắc nhở chạm vào ếch */}
        <p className="mt-4 text-xs font-medium text-slate-300 bg-slate-900/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-pond-600/30 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          Chạm hoặc click liên tục vào ếch để nhận điểm!
        </p>
      </div>

      {/* BOTTOM: Real-time Stats Quick Panel */}
      <div className="z-10 w-full max-w-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
          <p className="text-[11px] text-slate-400">Mỗi Lần Sờ</p>
          <p className="text-base sm:text-lg font-bold font-heading text-emerald-400">
            +{formatNumber(clickPower)}
          </p>
        </div>

        <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
          <p className="text-[11px] text-slate-400">Tỉ Lệ Chí Mạng</p>
          <p className="text-base sm:text-lg font-bold font-heading text-amber-400">
            {(critChance * 100).toFixed(1)}% <span className="text-[11px] font-normal text-slate-400">(x{critMultiplier.toFixed(1)})</span>
          </p>
        </div>

        <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
          <p className="text-[11px] text-slate-400">Chuỗi Combo</p>
          <p className="text-base sm:text-lg font-bold font-heading text-orange-400 flex items-center justify-center gap-1">
            <Flame className="w-4 h-4 fill-orange-400" />
            {currentCombo > 0 ? `${currentCombo}x` : '0'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Component Floating Text hiển thị số điểm bay lên khi click
const FloatingTextItemView: React.FC<{ item: FloatingTextItem; onComplete: () => void }> = ({
  item,
  onComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed pointer-events-none z-50 font-heading font-extrabold animate-float-up ${
        item.isCrit ? 'text-lg sm:text-2xl drop-shadow-[0_0_8px_#f59e0b]' : 'text-base sm:text-lg drop-shadow-[0_0_6px_#22c55e]'
      }`}
      style={{
        left: `${item.x}px`,
        top: `${item.y - 20}px`,
        color: item.color,
      }}
    >
      {item.text}
    </div>
  );
};
