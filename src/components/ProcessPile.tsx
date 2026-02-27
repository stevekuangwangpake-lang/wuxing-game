import { useMemo, useState, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card as GameCard } from '../types';
import Card from './Card';

interface ProcessPileProps {
  processPile: GameCard[];
  effectiveTopElementLabel: string;
  dropZoneRef: RefObject<HTMLDivElement>;
}

export default function ProcessPile({ processPile, effectiveTopElementLabel, dropZoneRef }: ProcessPileProps) {
  const [open, setOpen] = useState(false);
  const stack = useMemo(() => processPile.slice(-5), [processPile]);

  return (
    <>
      <section className="flex flex-col items-center gap-2">
        <p className="text-sm font-semibold text-zinc-100">过程堆（有效顶元素：{effectiveTopElementLabel}）</p>
        <div
          ref={dropZoneRef}
          className="relative flex h-52 w-72 items-center justify-center rounded-3xl border-2 border-dashed border-cyan-300/60 bg-zinc-900/70 shadow-[0_0_35px_rgba(34,211,238,0.25)]"
        >
          {stack.length === 0 ? <span className="text-zinc-300">拖拽到这里出牌</span> : null}

          {stack.map((card, index) => {
            const depth = stack.length - 1 - index;
            const isTop = index === stack.length - 1;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{
                  opacity: isTop ? 1 : 0.58,
                  y: depth * 4,
                  x: -depth * 9,
                  rotate: depth * 2.5,
                  scale: isTop ? 1.08 : 0.95,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                className="absolute"
                style={{ zIndex: isTop ? 10 : index }}
              >
                <Card card={card} faceUp compact={false} onClick={() => setOpen(true)} />
              </motion.div>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="max-h-[80vh] w-full max-w-4xl rounded-2xl bg-zinc-950 p-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-zinc-50">过程堆详情（顶牌在最右）</h4>
                <button type="button" className="rounded bg-zinc-700 px-3 py-1 text-sm text-white" onClick={() => setOpen(false)}>
                  关闭
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {processPile.map((card) => (
                  <Card key={card.id} card={card} compact />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
