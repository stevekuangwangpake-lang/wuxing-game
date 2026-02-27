import { create } from 'zustand';
import { Card, GameState } from '../types';
import { applyPlay, createInitialGameState, formatCard, getEffectiveTopElement, takeProcessPile } from '../utils/gameLogic';
import { getAIBestPlay } from '../utils/aiPlayer';

export type GameMode = 'hotseat' | 'ai';

interface GameStore extends GameState {
  gameMode: GameMode;
  gameStarted: boolean;
  aiPlayerId: string | null;
  isAIThinking: boolean;
  isAITurn: boolean;
  lastAIDescription: string | null;
  toggleSelectCard: (cardId: string) => void;
  setSelectedCardIds: (cardIds: string[]) => void;
  clearSelection: () => void;
  playSelected: () => void;
  playCards: (cardIds: string[]) => void;
  takeEntireProcessPile: () => void;
  setGameMode: (mode: GameMode) => void;
  startNewGame: (mode?: GameMode) => void;
  backToMenu: () => void;
  aiTurn: () => void;
  resetGame: () => void;
  isAIPlayer: (playerId: string) => boolean;
  getCurrentPlayerCards: () => Card[];
  getEffectiveTopElementLabel: () => string;
  hasAnyLegalPlay: () => boolean;
}

const initialState = createInitialGameState(['玩家A', '玩家B']);
let aiTimer: number | null = null;

function computeIsAITurn(input: {
  gameStarted: boolean;
  gameMode: GameMode;
  aiPlayerId: string | null;
  players: { id: string }[];
  currentPlayerIndex: number;
  winnerPlayerId: string | null;
}): boolean {
  if (!input.gameStarted || input.gameMode !== 'ai' || !input.aiPlayerId || input.winnerPlayerId) {
    return false;
  }

  return input.players[input.currentPlayerIndex]?.id === input.aiPlayerId;
}

export const useGameStore = create<GameStore>((set, get) => {
  const clearAiTimer = () => {
    if (aiTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(aiTimer);
      aiTimer = null;
    }
  };

  const scheduleAITurn = () => {
    clearAiTimer();
    const state = get();

    if (!state.gameStarted || state.gameMode !== 'ai' || state.winnerPlayerId || !state.aiPlayerId) {
      return;
    }

    const current = state.players[state.currentPlayerIndex];
    if (current.id !== state.aiPlayerId) {
      return;
    }

    set({ isAIThinking: true, isAITurn: true });

    const delay = 1000 + Math.floor(Math.random() * 1000);
    aiTimer = window.setTimeout(() => {
      const now = get();
      if (!now.gameStarted || now.gameMode !== 'ai' || now.winnerPlayerId || !now.aiPlayerId) {
        set({ isAIThinking: false, isAITurn: false });
        return;
      }

      const currentNow = now.players[now.currentPlayerIndex];
      if (currentNow.id !== now.aiPlayerId) {
        set({ isAIThinking: false, isAITurn: false });
        return;
      }

      const decision = getAIBestPlay(now.aiPlayerId, now);
      console.log('[AI] decision', decision);

      let nextState: GameState;
      if (decision.action === 'takePile') {
        nextState = takeProcessPile(now);
      } else {
        nextState = applyPlay(now, decision.cardIds);
        if (nextState.errorMessage) {
          nextState = takeProcessPile(now);
        }
      }

      const aiText =
        decision.action === 'play'
          ? `AI出：${decision.description}（${decision.reason}）`
          : `AI拿过程堆（${decision.reason}）`;

      const nextAITurn = computeIsAITurn({
        gameStarted: now.gameStarted,
        gameMode: now.gameMode,
        aiPlayerId: now.aiPlayerId,
        players: nextState.players,
        currentPlayerIndex: nextState.currentPlayerIndex,
        winnerPlayerId: nextState.winnerPlayerId,
      });

      set({
        ...nextState,
        isAIThinking: false,
        isAITurn: nextAITurn,
        lastAIDescription: aiText,
        lastAction: `${aiText}。${nextState.lastAction}`,
      });

      const after = get();
      if (after.gameStarted && after.gameMode === 'ai' && !after.winnerPlayerId && after.isAITurn) {
        scheduleAITurn();
      }
    }, delay);
  };

  return {
    ...initialState,
    gameMode: 'hotseat',
    gameStarted: false,
    aiPlayerId: null,
    isAIThinking: false,
    isAITurn: false,
    lastAIDescription: null,
    toggleSelectCard: (cardId) => {
      const state = get();
      if (state.winnerPlayerId || !state.gameStarted || state.isAITurn) {
        return;
      }

      const currentCards = state.players[state.currentPlayerIndex].hand;
      if (!currentCards.some((card) => card.id === cardId)) {
        return;
      }

      const selected = state.selectedCardIds.includes(cardId)
        ? state.selectedCardIds.filter((id) => id !== cardId)
        : [...state.selectedCardIds, cardId];

      set({ selectedCardIds: selected, errorMessage: null });
    },
    setSelectedCardIds: (cardIds) => {
      const state = get();
      if (state.winnerPlayerId || !state.gameStarted || state.isAITurn) {
        return;
      }

      const handSet = new Set(state.players[state.currentPlayerIndex].hand.map((card) => card.id));
      const filtered = cardIds.filter((id) => handSet.has(id));
      set({ selectedCardIds: filtered, errorMessage: null });
    },
    clearSelection: () => set({ selectedCardIds: [], errorMessage: null }),
    playSelected: () => {
      const state = get();
      if (!state.gameStarted || state.isAITurn) {
        return;
      }

      const next = applyPlay(state, state.selectedCardIds);
      const nextAITurn = computeIsAITurn({
        gameStarted: state.gameStarted,
        gameMode: state.gameMode,
        aiPlayerId: state.aiPlayerId,
        players: next.players,
        currentPlayerIndex: next.currentPlayerIndex,
        winnerPlayerId: next.winnerPlayerId,
      });

      set({ ...next, isAITurn: nextAITurn, lastAIDescription: state.lastAIDescription });
      scheduleAITurn();
    },
    playCards: (cardIds) => {
      const state = get();
      if (!state.gameStarted || state.isAITurn) {
        return;
      }

      const next = applyPlay(state, cardIds);
      const nextAITurn = computeIsAITurn({
        gameStarted: state.gameStarted,
        gameMode: state.gameMode,
        aiPlayerId: state.aiPlayerId,
        players: next.players,
        currentPlayerIndex: next.currentPlayerIndex,
        winnerPlayerId: next.winnerPlayerId,
      });

      set({ ...next, isAITurn: nextAITurn, lastAIDescription: state.lastAIDescription });
      scheduleAITurn();
    },
    takeEntireProcessPile: () => {
      const state = get();
      if (!state.gameStarted || state.isAITurn) {
        return;
      }

      const next = takeProcessPile(state);
      const nextAITurn = computeIsAITurn({
        gameStarted: state.gameStarted,
        gameMode: state.gameMode,
        aiPlayerId: state.aiPlayerId,
        players: next.players,
        currentPlayerIndex: next.currentPlayerIndex,
        winnerPlayerId: next.winnerPlayerId,
      });

      set({ ...next, isAITurn: nextAITurn, lastAIDescription: state.lastAIDescription });
      scheduleAITurn();
    },
    setGameMode: (mode) => {
      set({ gameMode: mode });
    },
    startNewGame: (mode) => {
      const nextMode = mode ?? get().gameMode;
      const names = nextMode === 'ai' ? ['玩家A', 'AI'] : ['玩家A', '玩家B'];
      const fresh = createInitialGameState(names);
      const randomFirst = Math.floor(Math.random() * fresh.players.length);

      clearAiTimer();
      const nextAITurn = computeIsAITurn({
        gameStarted: true,
        gameMode: nextMode,
        aiPlayerId: nextMode === 'ai' ? 'player-2' : null,
        players: fresh.players,
        currentPlayerIndex: randomFirst,
        winnerPlayerId: fresh.winnerPlayerId,
      });

      set({
        ...fresh,
        currentPlayerIndex: randomFirst,
        gameMode: nextMode,
        gameStarted: true,
        aiPlayerId: nextMode === 'ai' ? 'player-2' : null,
        isAIThinking: false,
        isAITurn: nextAITurn,
        lastAIDescription: null,
        errorMessage: null,
        lastAction: `${names[randomFirst]} 先手`,
      });

      scheduleAITurn();
    },
    backToMenu: () => {
      clearAiTimer();
      set({
        gameStarted: false,
        isAIThinking: false,
        isAITurn: false,
        selectedCardIds: [],
      });
    },
    aiTurn: () => {
      scheduleAITurn();
    },
    resetGame: () => {
      const mode = get().gameMode;
      get().startNewGame(mode);
    },
    isAIPlayer: (playerId) => {
      const state = get();
      return state.gameMode === 'ai' && state.aiPlayerId === playerId;
    },
    getCurrentPlayerCards: () => {
      const state = get();
      return state.players[state.currentPlayerIndex].hand;
    },
    getEffectiveTopElementLabel: () => {
      const state = get();
      const top = getEffectiveTopElement(state.processPile);
      if (!top) {
        return '无有效元素';
      }

      const map = {
        metal: '金',
        wood: '木',
        water: '水',
        fire: '火',
        earth: '土',
      };

      return map[top];
    },
    hasAnyLegalPlay: () => {
      const state = get();
      const hand = state.players[state.currentPlayerIndex].hand;
      if (hand.length === 0) {
        return false;
      }

      return hand.some((card) => card.kind === 'normal' || card.kind === 'yinYang' || card.kind === 'mastery');
    },
  };
});

if (typeof window !== 'undefined') {
  (window as Window & { render_game_to_text?: () => string }).render_game_to_text = () => {
    const state = useGameStore.getState();
    return JSON.stringify({
      mode: state.gameMode,
      started: state.gameStarted,
      aiThinking: state.isAIThinking,
      aiTurn: state.isAITurn,
      currentPlayer: state.players[state.currentPlayerIndex].name,
      winner: state.winnerPlayerId,
      drawPileCount: state.drawPile.length,
      annihilatePileCount: state.annihilatePile.length,
      processPileTop3: state.processPile.slice(-3).map(formatCard),
      effectiveTopElement: state.getEffectiveTopElementLabel(),
      hands: state.players.map((p) => ({ name: p.name, count: p.hand.length })),
      selected: state.selectedCardIds,
      lastAction: state.lastAction,
      lastAI: state.lastAIDescription,
      errorMessage: state.errorMessage,
    });
  };
}
