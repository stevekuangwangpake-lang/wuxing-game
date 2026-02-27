import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue } from 'framer-motion';
import { Card as GameCard } from '../types';

interface CardProps {
  card: GameCard;
  selected?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDragEnd?: (card: GameCard, info: { x: number; y: number }) => void;
  className?: string;
  faceUp?: boolean;
  compact?: boolean;
}

const elementStyleMap: Record<string, { bg: string; accent: string; symbol: string }> = {
  // 金：黄铜/鎏金色
  metal: { bg: '#D4AF37', accent: '#8C6A00', symbol: '金' },
  // 木：深木棕 + 深绿
  wood: { bg: '#8B4513', accent: '#1E5F2E', symbol: '木' },
  // 水：钢蓝 + 深蓝
  water: { bg: '#4682B4', accent: '#1D3E7A', symbol: '水' },
  // 火：绯红 + 深红
  fire: { bg: '#DC143C', accent: '#7D0E22', symbol: '火' },
  // 土：棕黄 + 褐色
  earth: { bg: '#8B7355', accent: '#4F3F2B', symbol: '土' },
};

function yinYangSvg() {
  return (
    <svg viewBox="0 0 100 100" className="h-14 w-14">
      <circle cx="50" cy="50" r="45" fill="#111827" />
      <path d="M50 5a45 45 0 0 1 0 90 22.5 22.5 0 0 0 0-45 22.5 22.5 0 0 1 0-45z" fill="#f8fafc" />
      <circle cx="50" cy="27.5" r="7" fill="#f8fafc" />
      <circle cx="50" cy="72.5" r="7" fill="#111827" />
    </svg>
  );
}

function cardFront(card: GameCard) {
  if (card.kind === 'yinYang') {
    return {
      style: {
        background: 'linear-gradient(145deg, #f8fafc 0%, #d4d4d8 48%, #18181b 52%, #09090b 100%)',
        color: '#18181b',
      },
      center: yinYangSvg(),
      footer: '阴阳鱼',
      isMastery: false,
    };
  }

  const elementKey = card.element ?? 'earth';
  const conf = elementStyleMap[elementKey];
  const isMastery = card.kind === 'mastery';

  return {
    style: {
      background: `linear-gradient(160deg, ${conf.bg} 0%, ${conf.accent} 100%)`,
      color: '#fff7d6',
      borderColor: isMastery ? '#FDE68A' : 'rgba(255,255,255,0.35)',
      boxShadow: isMastery ? '0 0 20px rgba(253, 230, 138, 0.65)' : '0 6px 16px rgba(0,0,0,0.28)',
    },
    center: <span className="text-5xl font-black tracking-widest">{conf.symbol}</span>,
    footer: isMastery ? '精通' : '元素',
    isMastery,
  };
}

export default function Card({
  card,
  selected = false,
  draggable = false,
  onClick,
  onDragEnd,
  className = '',
  faceUp = true,
  compact = false,
}: CardProps) {
  const rootRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCardSize, setDragCardSize] = useState({ width: compact ? 64 : 112, height: compact ? 96 : 160 });
  const ghostX = useMotionValue(0);
  const ghostY = useMotionValue(0);
  const front = cardFront(card);

  const syncGhostPosition = (point: { x: number; y: number }) => {
    ghostX.set(point.x - dragCardSize.width / 2);
    ghostY.set(point.y - dragCardSize.height / 2);
  };

  const renderCardInner = () => (
    <motion.div
      initial={{ rotateY: 180 }}
      animate={{ rotateY: faceUp ? 0 : 180 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div
        className="absolute inset-0 rounded-2xl p-2"
        style={{
          ...front.style,
          backfaceVisibility: 'hidden',
          fontFamily: '"Noto Serif SC", "Songti SC", serif',
        }}
      >
        <div className="flex h-full flex-col justify-between">
          <span className="text-sm font-semibold opacity-90">五行</span>
          <div className="flex items-center justify-center">{front.center}</div>
          <span className="text-right text-sm font-semibold tracking-widest">{front.footer}</span>
        </div>
        {front.isMastery ? (
          <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-yellow-200/70 shadow-[0_0_22px_rgba(250,204,21,0.55)]" />
        ) : null}
      </div>

      <div
        className="absolute inset-0 rounded-2xl border border-zinc-500"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, #52525b 0%, #18181b 45%, #0a0a0a 100%), repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 6px, rgba(0,0,0,0.08) 6px 12px)',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        <div className="flex h-full items-center justify-center text-3xl text-zinc-200">☯</div>
      </div>
    </motion.div>
  );

  const cardFace = (
    <motion.button
      ref={rootRef}
      type="button"
      onClick={onClick}
      whileHover={draggable ? { scale: 1.06, y: -6 } : { scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.98 }}
      drag={draggable}
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0.06}
      dragTransition={{ bounceStiffness: 680, bounceDamping: 36, power: 0.14, timeConstant: 120 }}
      onDragStart={(_, info) => {
        if (!draggable) {
          return;
        }
        const rect = rootRef.current?.getBoundingClientRect();
        if (rect) {
          setDragCardSize({ width: rect.width, height: rect.height });
        }
        syncGhostPosition(info.point);
        setIsDragging(true);
      }}
      onDrag={(_, info) => {
        if (!draggable) {
          return;
        }
        syncGhostPosition(info.point);
      }}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        onDragEnd?.(card, { x: info.point.x, y: info.point.y });
      }}
      className={[
        'relative rounded-2xl text-left touch-none transition-transform duration-150 will-change-transform',
        compact ? 'h-24 w-16' : 'h-40 w-28',
        selected ? 'border-4 border-yellow-400' : 'border border-white/30',
        isDragging ? 'opacity-0 pointer-events-none' : '',
        className,
      ].join(' ')}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
        zIndex: isDragging ? 0 : selected ? 15 : 3,
      }}
    >
      {renderCardInner()}
    </motion.button>
  );

  return (
    <>
      {cardFace}
      {isDragging && typeof document !== 'undefined'
        ? createPortal(
            <motion.div
              className="pointer-events-none fixed left-0 top-0"
              style={{
                x: ghostX,
                y: ghostY,
                width: dragCardSize.width,
                height: dragCardSize.height,
                zIndex: 2147483000,
              }}
              initial={false}
              animate={{ scale: 1.14, rotate: -4 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            >
              <div className="relative h-full w-full rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.45),0_0_30px_rgba(250,204,21,0.4)]">
                {renderCardInner()}
              </div>
            </motion.div>,
            document.body,
          )
        : null}
    </>
  );
}
