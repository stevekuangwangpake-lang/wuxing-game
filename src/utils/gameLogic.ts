import { Card, ElementType, GameState, Player, ValidatedPlay } from '../types';

const ELEMENTS: ElementType[] = ['metal', 'wood', 'water', 'fire', 'earth'];

const elementToChinese: Record<ElementType, '金' | '木' | '水' | '火' | '土'> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
};

let cardIdCounter = 0;

export function createInitialDeck(): Card[] {
  const deck: Card[] = [];

  for (const element of ELEMENTS) {
    for (let i = 0; i < 6; i += 1) {
      deck.push({
        id: `n-${element}-${cardIdCounter++}`,
        kind: 'normal',
        element,
      });
    }

    deck.push({
      id: `m-${element}-${cardIdCounter++}`,
      kind: 'mastery',
      element,
    });
  }

  for (let i = 0; i < 6; i += 1) {
    deck.push({
      id: `yy-${cardIdCounter++}`,
      kind: 'yinYang',
      element: null,
    });
  }

  return deck;
}

export function shuffleCards(cards: Card[]): Card[] {
  const cloned = [...cards];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

export function createInitialGameState(playerNames: string[]): GameState {
  const shuffled = shuffleCards(createInitialDeck());
  const players: Player[] = playerNames.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    hand: [],
  }));

  const cardsPerPlayer = 10;
  const drawPile = [...shuffled];

  for (let r = 0; r < cardsPerPlayer; r += 1) {
    for (const player of players) {
      const card = drawPile.shift();
      if (card) {
        player.hand.push(card);
      }
    }
  }

  return {
    players,
    drawPile,
    processPile: [],
    annihilatePile: [],
    currentPlayerIndex: 0,
    selectedCardIds: [],
    winnerPlayerId: null,
    lastAction: '游戏开始',
    errorMessage: null,
  };
}

export function validatePlayedCards(cards: Card[]): ValidatedPlay {
  if (cards.length === 0) {
    return { valid: false, reason: '请选择要出的牌' };
  }

  if (cards.every((card) => card.kind === 'yinYang')) {
    if (cards.length === 1) {
      return {
        valid: true,
        type: 'singleYinYang',
        nonYinCount: 0,
      };
    }

    return { valid: false, reason: '一次只能出 1 张阴阳鱼' };
  }

  if (cards.some((card) => card.kind === 'yinYang')) {
    return { valid: false, reason: '阴阳鱼不能与其他牌混出' };
  }

  const masteryCards = cards.filter((card) => card.kind === 'mastery');
  const normalCards = cards.filter((card) => card.kind === 'normal');

  if (masteryCards.length === 0) {
    if (cards.length === 1 && cards[0].kind === 'normal' && cards[0].element) {
      return {
        valid: true,
        type: 'elementCombo',
        element: cards[0].element,
        nonYinCount: 1,
      };
    }

    return { valid: false, reason: '无精通时只能出 1 张普通元素牌' };
  }

  if (masteryCards.length > 1) {
    return { valid: false, reason: '一次最多只能出 1 张精通牌' };
  }

  const masteryElement = masteryCards[0].element;
  if (!masteryElement) {
    return { valid: false, reason: '精通牌元素异常' };
  }

  if (normalCards.length > 5) {
    return { valid: false, reason: '精通组合最多带 5 张同元素普通牌' };
  }

  const invalidNormal = normalCards.find((card) => card.element !== masteryElement);
  if (invalidNormal) {
    return { valid: false, reason: '精通组合只能带同元素普通牌' };
  }

  if (cards.length !== 1 + normalCards.length) {
    return { valid: false, reason: '精通组合中包含非法牌型' };
  }

  return {
    valid: true,
    type: 'elementCombo',
    element: masteryElement,
    nonYinCount: cards.length,
  };
}

export function getEffectiveTopElement(processPile: Card[]): ElementType | null {
  if (processPile.length === 0) {
    return null;
  }

  const topCard = processPile[processPile.length - 1];
  if (topCard.kind === 'yinYang') {
    return null;
  }

  return topCard.element;
}

const shengMap: Record<string, string> = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
const keMap: Record<string, string> = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };

function getRelation(played: string, top: string): '相同' | '相生' | '相克' | '被克制' | '非法' {
  if (played === top) return '相同';
  if (shengMap[top] === played) return '相生';
  if (keMap[played] === top) return '相克'; // 我克顶
  if (keMap[top] === played) return '被克制'; // 顶克我
  return '非法';
}

function nextPlayerIndex(totalPlayers: number, current: number): number {
  return (current + 1) % totalPlayers;
}

function prevPlayerIndex(totalPlayers: number, current: number): number {
  return (current - 1 + totalPlayers) % totalPlayers;
}

function drawCards(drawPile: Card[], count: number): { drawn: Card[]; remaining: Card[] } {
  if (count <= 0) {
    return { drawn: [], remaining: drawPile };
  }

  const drawn = drawPile.slice(0, count);
  const remaining = drawPile.slice(count);
  return { drawn, remaining };
}

function removeCardsByIds(cards: Card[], cardIds: string[]): Card[] {
  const idSet = new Set(cardIds);
  return cards.filter((card) => !idSet.has(card.id));
}

function cardLabel(card: Card): string {
  if (card.kind === 'yinYang') {
    return '阴阳鱼';
  }

  const names: Record<ElementType, string> = {
    metal: '金',
    wood: '木',
    water: '水',
    fire: '火',
    earth: '土',
  };

  return `${names[card.element as ElementType]}${card.kind === 'mastery' ? '精通' : ''}`;
}

function topContinuousSameElementGroup(processPile: Card[]): { group: Card[]; remaining: Card[] } {
  if (processPile.length === 0) {
    return { group: [], remaining: [] };
  }

  let i = processPile.length - 1;
  const topCard = processPile[i];

  if (topCard.kind === 'yinYang' || !topCard.element) {
    return { group: [], remaining: processPile };
  }

  const element = topCard.element;
  while (i >= 0) {
    const current = processPile[i];
    if (current.kind === 'yinYang' || current.element !== element) {
      break;
    }
    i -= 1;
  }

  return {
    group: processPile.slice(i + 1),
    remaining: processPile.slice(0, i + 1),
  };
}

export function takeProcessPile(state: GameState): GameState {
  if (state.winnerPlayerId) {
    return state;
  }

  const current = state.players[state.currentPlayerIndex];
  const taken = state.processPile;

  const updatedPlayers = state.players.map((player, index) => {
    if (index !== state.currentPlayerIndex) {
      return player;
    }

    return {
      ...player,
      hand: [...player.hand, ...taken],
    };
  });

  return {
    ...state,
    players: updatedPlayers,
    processPile: [],
    selectedCardIds: [],
    errorMessage: null,
    lastAction:
      taken.length > 0
        ? `${current.name} 拿走过程堆 ${taken.length} 张并继续出牌`
        : `${current.name} 选择拿过程堆（当前为空）并继续出牌`,
  };
}

export function applyPlay(state: GameState, selectedCardIds: string[]): GameState {
  if (state.winnerPlayerId) {
    return state;
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  const selectedCards = currentPlayer.hand.filter((card) => selectedCardIds.includes(card.id));

  if (selectedCards.length !== selectedCardIds.length) {
    return {
      ...state,
      errorMessage: '所选牌不在当前玩家手牌中',
    };
  }

  const validation = validatePlayedCards(selectedCards);
  if (!validation.valid || !validation.type) {
    return {
      ...state,
      errorMessage: validation.reason ?? '非法出牌',
    };
  }

  const effectiveBefore = getEffectiveTopElement(state.processPile);
  if (validation.type === 'elementCombo' && validation.element && effectiveBefore) {
    const relation = getRelation(elementToChinese[validation.element], elementToChinese[effectiveBefore]);
    if (relation === '非法') {
      return {
        ...state,
        errorMessage: '非法出牌：与有效顶元素关系非法',
      };
    }
  }

  const playedIds = selectedCards.map((card) => card.id);

  const playersAfterPlay = state.players.map((player, index) => {
    if (index !== state.currentPlayerIndex) {
      return player;
    }

    return {
      ...player,
      hand: removeCardsByIds(player.hand, playedIds),
    };
  });

  const processAfterPlay = [...state.processPile, ...selectedCards];

  const handAfterPlay = playersAfterPlay[state.currentPlayerIndex].hand;
  if (handAfterPlay.length === 0) {
    return {
      ...state,
      players: playersAfterPlay,
      processPile: processAfterPlay,
      selectedCardIds: [],
      errorMessage: null,
      winnerPlayerId: currentPlayer.id,
      lastAction: `${currentPlayer.name} 出牌后手牌为 0，立即获胜`,
    };
  }

  if (validation.type === 'singleYinYang') {
    return {
      ...state,
      players: playersAfterPlay,
      processPile: processAfterPlay,
      selectedCardIds: [],
      currentPlayerIndex: nextPlayerIndex(state.players.length, state.currentPlayerIndex),
      errorMessage: null,
      lastAction: `${currentPlayer.name} 出 ${cardLabel(selectedCards[0])}，回合结束`,
    };
  }

  if (!validation.element || !effectiveBefore) {
    return {
      ...state,
      players: playersAfterPlay,
      processPile: processAfterPlay,
      selectedCardIds: [],
      currentPlayerIndex: nextPlayerIndex(state.players.length, state.currentPlayerIndex),
      errorMessage: null,
      lastAction: `${currentPlayer.name} 出牌（无有效顶元素或无需比较），回合结束`,
    };
  }

  const attacker = validation.element;
  const defender = effectiveBefore;
  const relation = getRelation(elementToChinese[attacker], elementToChinese[defender]);

  if (relation === '相克') {
    const prevIndex = prevPlayerIndex(state.players.length, state.currentPlayerIndex);
    const prevPlayer = playersAfterPlay[prevIndex];
    const { group: topContinuousGroup, remaining: remainingProcessPile } = topContinuousSameElementGroup(state.processPile);
    const playedAnnihilate = selectedCards.filter((card) => card.kind !== 'yinYang');
    const nextAnnihilatePile = [...state.annihilatePile, ...playedAnnihilate];
    const topGroupCount = topContinuousGroup.filter((card) => card.kind !== 'yinYang').length;
    const playedCount = playedAnnihilate.length;
    const drawCount = Math.max(topGroupCount, playedCount);
    const { drawn, remaining: remainingDrawPile } = drawCards(state.drawPile, drawCount);

    const updatedPlayers = playersAfterPlay.map((player, index) => {
      if (index !== prevIndex) {
        return player;
      }

      return {
        ...player,
        hand: [...player.hand, ...topContinuousGroup, ...drawn],
      };
    });

    return {
      ...state,
      players: updatedPlayers,
      drawPile: remainingDrawPile,
      processPile: remainingProcessPile,
      annihilatePile: nextAnnihilatePile,
      currentPlayerIndex: prevIndex,
      selectedCardIds: [],
      errorMessage: null,
      lastAction: `${currentPlayer.name} 相克成功，本次出牌湮灭 ${playedAnnihilate.length} 张；${prevPlayer.name} 收回顶连续同元素组 ${topContinuousGroup.length} 张并补 ${drawn.length} 张（按两组较大值），轮到 ${prevPlayer.name}`,
    };
  }

  if (relation === '被克制') {
    const { group: topContinuousGroup, remaining: remainingProcessPile } = topContinuousSameElementGroup(state.processPile);
    const playedCount = validation.nonYinCount ?? selectedCards.length;
    const topGroupCount = topContinuousGroup.filter((card) => card.kind !== 'yinYang').length;
    const drawCount = Math.max(playedCount, topGroupCount);
    const { drawn, remaining: remainingDrawPile } = drawCards(state.drawPile, drawCount);
    const nextAnnihilatePile = [...state.annihilatePile, ...topContinuousGroup];

    const updatedPlayers = playersAfterPlay.map((player, index) => {
      if (index !== state.currentPlayerIndex) {
        return player;
      }

      return {
        ...player,
        hand: [...player.hand, ...selectedCards, ...drawn],
      };
    });

    return {
      ...state,
      players: updatedPlayers,
      drawPile: remainingDrawPile,
      processPile: remainingProcessPile,
      annihilatePile: nextAnnihilatePile,
      currentPlayerIndex: state.currentPlayerIndex,
      selectedCardIds: [],
      errorMessage: null,
      lastAction: `${currentPlayer.name} 被克制，顶连续同元素组 ${topContinuousGroup.length} 张进入湮灭堆，退回 ${selectedCards.length} 张并补 ${drawn.length} 张（按两组较大值），继续出牌`,
    };
  }

  if (relation === '非法') {
    return {
      ...state,
      errorMessage: '非法出牌：与有效顶元素关系非法',
    };
  }

  const relationText = relation === '相同' ? '同元素' : '相生';

  return {
    ...state,
    players: playersAfterPlay,
    processPile: processAfterPlay,
    selectedCardIds: [],
    currentPlayerIndex: nextPlayerIndex(state.players.length, state.currentPlayerIndex),
    errorMessage: null,
    lastAction: `${currentPlayer.name} 出牌判定为${relationText}，回合结束`,
  };
}

export function formatCard(card: Card): string {
  return cardLabel(card);
}
