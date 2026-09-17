import { CardStatus, StudyMode } from 'src/generated/prisma/client';

export const MAX_LEVEL = 5;

export const MODE_CEILING: Record<StudyMode, number> = {
  FLASHCARDS: 5,
  MATCH: 3,
  TEST: 4,
  LEARN: 5,
};

export type StrengthEvent = {
  mode: StudyMode;
  correct: boolean;
  answeredAt: Date;
};

export function applyEvent(level: number, event: StrengthEvent): number {
  if (!event.correct) return level;
  const ceiling = Math.min(MODE_CEILING[event.mode], MAX_LEVEL);
  if (level >= ceiling) return level;
  return level + 1;
}

export function foldStrength(events: StrengthEvent[], initial = 0): number {
  return [...events]
    .sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime())
    .reduce(applyEvent, initial);
}

export function statusForLevel(level: number): CardStatus {
  if (level >= MAX_LEVEL) return CardStatus.KNOWN;
  if (level <= 0) return CardStatus.UNSTUDIED;
  return CardStatus.STILL_LEARNING;
}
