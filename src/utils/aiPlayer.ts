import { Card, ElementType, GameState } from '../types';
import { getEffectiveTopElement } from './gameLogic';

const elementToChinese: Record<ElementType, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
};

const shengMap: Record<string, string> = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
const keMap: Record<string, string> = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };

function relation(played: ElementType, top: ElementType): '相同' | '相生' | '相克' | '被克制' | '非法' {
  const playedCN = elementToChinese[played];
  const topCN = elementToChinese[top];
  if (playedCN === topCN) return '相同';
  if (shengMap[topCN] === playedCN) return '相生';
  if (keMap[playedCN] === topCN) return '相克';
  if (keMap[topCN] === playedCN) return '被克制';
  return '非法';
}

function cardName(card: Card): string {
  if (card.kind === 'yinYang') return '阴阳鱼';
  const e = card.element ? elementToChinese[card.element] : '';
  return card.kind === 'mastery' ? `${e}精通` : e;
}

interface Candidate {
  cardIds: string[];
  cards: Card[];
  element: ElementType | null;
  relation: '相同' | '相生' | '相克' | '被克制' | '非法' | '无比较';
  score: number;
  description: string;
}

export type AIDecision =
  | { action: 'play'; cardIds: string[]; description: string; reason: string }
  | { action: 'takePile'; reason: string };

function buildCandidates(hand: Card[], top: ElementType | null): Candidate[] {
  const result: Candidate[] = [];

  for (const card of hand) {
    if (card.kind === 'normal' && card.element) {
      const r = top ? relation(card.element, top) : '无比较';
      result.push({
        cardIds: [card.id],
        cards: [card],
        element: card.element,
        relation: r,
        score: 1,
        description: cardName(card),
      });
    }

    if (card.kind === 'yinYang') {
      result.push({
        cardIds: [card.id],
        cards: [card],
        element: null,
        relation: '无比较',
        score: 0,
        description: '阴阳鱼',
      });
    }
  }

  const masteryCards = hand.filter((c) => c.kind === 'mastery' && c.element);
  for (const mastery of masteryCards) {
    const sameNormals = hand.filter((c) => c.kind === 'normal' && c.element === mastery.element);
    const combo = [mastery, ...sameNormals];
    const r = top && mastery.element ? relation(mastery.element, top) : '无比较';
    result.push({
      cardIds: combo.map((c) => c.id),
      cards: combo,
      element: mastery.element,
      relation: r,
      score: combo.length + 2,
      description: `${cardName(mastery)}${sameNormals.length > 0 ? ` + ${sameNormals.length}${elementToChinese[mastery.element as ElementType]}` : ''}`,
    });
  }

  return result;
}

export function getAIBestPlay(currentPlayerId: string, gameState: GameState): AIDecision {
  const player = gameState.players.find((p) => p.id === currentPlayerId);
  if (!player) {
    return { action: 'takePile', reason: 'AI找不到玩家，兜底拿过程堆' };
  }

  const top = getEffectiveTopElement(gameState.processPile);
  const candidates = buildCandidates(player.hand, top).filter((c) => c.relation !== '非法');

  if (candidates.length === 0) {
    console.log('[AI] no legal candidate -> take pile');
    return { action: 'takePile', reason: '无合法出牌，拿过程堆' };
  }

  const chooseBest = (items: Candidate[]): Candidate | null => {
    if (items.length === 0) return null;
    return [...items].sort((a, b) => b.score - a.score)[0];
  };

  const byRelation = (tag: Candidate['relation']) => candidates.filter((c) => c.relation === tag && c.element !== null);

  const bestKe = chooseBest(byRelation('相克'));
  if (bestKe) {
    console.log('[AI] pick 相克', bestKe.description);
    return { action: 'play', cardIds: bestKe.cardIds, description: bestKe.description, reason: '优先相克' };
  }

  const bestSheng = chooseBest(byRelation('相生'));
  if (bestSheng) {
    console.log('[AI] pick 相生', bestSheng.description);
    return { action: 'play', cardIds: bestSheng.cardIds, description: bestSheng.description, reason: '其次相生' };
  }

  const bestSame = chooseBest(byRelation('相同'));
  if (bestSame) {
    console.log('[AI] pick 相同', bestSame.description);
    return { action: 'play', cardIds: bestSame.cardIds, description: bestSame.description, reason: '再次同元素' };
  }

  const yinYang = candidates.find((c) => c.cards.length === 1 && c.cards[0].kind === 'yinYang');
  if (yinYang) {
    console.log('[AI] pick 阴阳鱼');
    return { action: 'play', cardIds: yinYang.cardIds, description: yinYang.description, reason: '阴阳鱼切断局面' };
  }

  const fallback = [...candidates]
    .filter((c) => c.cards.length === 1)
    .sort((_a, _b) => Math.random() - 0.5)[0];

  if (fallback) {
    console.log('[AI] pick random single', fallback.description);
    return { action: 'play', cardIds: fallback.cardIds, description: fallback.description, reason: '随机单张兜底' };
  }

  console.log('[AI] fallback take pile');
  return { action: 'takePile', reason: '无适配候选，拿过程堆' };
}
