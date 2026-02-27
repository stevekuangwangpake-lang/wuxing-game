export type ElementType = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

export type CardKind = 'normal' | 'mastery' | 'yinYang';

export interface Card {
  id: string;
  kind: CardKind;
  element: ElementType | null;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
}

export interface GameState {
  players: Player[];
  drawPile: Card[];
  processPile: Card[];
  annihilatePile: Card[];
  currentPlayerIndex: number;
  selectedCardIds: string[];
  winnerPlayerId: string | null;
  lastAction: string;
  errorMessage: string | null;
}

export type PlayValidationType = 'singleYinYang' | 'elementCombo';

export interface ValidatedPlay {
  valid: boolean;
  type?: PlayValidationType;
  element?: ElementType;
  nonYinCount?: number;
  reason?: string;
}
