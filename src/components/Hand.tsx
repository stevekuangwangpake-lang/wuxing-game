import { useMemo, useState, type RefObject } from 'react';
import { Card as GameCard } from '../types';
import BackCard from './BackCard';
import Card from './Card';

interface HandProps {
  cards: GameCard[];
  selectedCardIds: string[];
  onSelectChange: (nextIds: string[]) => void;
  onPlayCards: (cardIds: string[]) => void;
  dropZoneRef: RefObject<HTMLDivElement>;
  disabled?: boolean;
  hidden?: boolean;
  hiddenLabel?: string;
}

function getCardById(cards: GameCard[], id: string): GameCard | undefined {
  return cards.find((card) => card.id === id);
}

function canCoexistWithSelection(target: GameCard, selectedCards: GameCard[]): boolean {
  if (selectedCards.length === 0) {
    return true;
  }

  if (target.kind === 'yinYang') {
    return false;
  }

  if (selectedCards.some((card) => card.kind === 'yinYang')) {
    return false;
  }

  const masteryInSelection = selectedCards.find((card) => card.kind === 'mastery');
  if (masteryInSelection) {
    if (target.kind === 'mastery') {
      return false;
    }
    return target.kind === 'normal' && target.element === masteryInSelection.element;
  }

  const allNormalSingle = selectedCards.length === 1 && selectedCards[0].kind === 'normal';
  if (allNormalSingle && target.kind === 'mastery' && target.element === selectedCards[0].element) {
    return true;
  }

  return false;
}

export default function Hand({
  cards,
  selectedCardIds,
  onSelectChange,
  onPlayCards,
  dropZoneRef,
  disabled = false,
  hidden = false,
  hiddenLabel,
}: HandProps) {
  const [shakeId, setShakeId] = useState<string | null>(null);

  const selectedCards = useMemo(
    () => selectedCardIds.map((id) => getCardById(cards, id)).filter((c): c is GameCard => Boolean(c)),
    [cards, selectedCardIds],
  );

  const handleCardClick = (card: GameCard) => {
    if (disabled || hidden) {
      return;
    }

    const already = selectedCardIds.includes(card.id);
    if (already) {
      onSelectChange(selectedCardIds.filter((id) => id !== card.id));
      return;
    }

    if (canCoexistWithSelection(card, selectedCards)) {
      onSelectChange([...selectedCardIds, card.id]);
    } else {
      onSelectChange([card.id]);
    }
  };

  const handleDragEnd = (card: GameCard, point: { x: number; y: number }) => {
    if (disabled || hidden) {
      return;
    }

    const dropEl = dropZoneRef.current;
    if (!dropEl) {
      return;
    }

    const rect = dropEl.getBoundingClientRect();
    const droppedInPile = point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;

    if (!droppedInPile) {
      return;
    }

    const shouldUseSelection = selectedCardIds.includes(card.id) && selectedCardIds.length > 0;
    const playIds = shouldUseSelection ? selectedCardIds : [card.id];

    onPlayCards(playIds);
    setShakeId(card.id);
    window.setTimeout(() => setShakeId(null), 260);
  };

  if (hidden) {
    return (
      <section className="rounded-2xl border border-zinc-700/40 bg-zinc-900/70 p-3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">AI 手牌</h3>
          <span className="text-xs text-zinc-300">{hiddenLabel ?? `AI 手牌：${cards.length} 张`}</span>
        </div>

        <div className="flex -space-x-8 overflow-x-auto overflow-y-visible px-1 py-3">
          {Array.from({ length: Math.min(cards.length, 10) }).map((_, idx) => (
            <BackCard key={`ai-back-${idx}`} compact />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-700/40 bg-zinc-900/70 p-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">当前手牌</h3>
        <span className="text-xs text-zinc-300">拖到中间过程堆可直接出牌</span>
      </div>

      <div className="flex gap-3 overflow-x-auto overflow-y-visible px-1 py-3">
        {cards.map((card) => {
          const selected = selectedCardIds.includes(card.id);
          return (
            <div key={card.id} className={shakeId === card.id ? 'animate-[wiggle_0.24s_ease-in-out_1]' : ''}>
              <Card
                card={card}
                selected={selected}
                draggable={!disabled}
                onClick={() => handleCardClick(card)}
                onDragEnd={handleDragEnd}
                className="shrink-0"
              />
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-zinc-300">
        可出牌提示：阴阳鱼只能单出；精通牌可叠加同元素普通牌；其余情况会重置为单选。
      </p>
    </section>
  );
}
