export type ScreenName =
  | 'home'
  | 'study'
  | 'done'
  | 'quiz'
  | 'result'
  | 'wrong'
  | 'checkin';

export interface WordEntry {
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  exampleZh: string;
  memo: string;
  collocations: string;
  family: string;
  confusable: string;
}

export interface DeckDefinition {
  id: string;
  name: string;
  subtitle: string;
  builtin: boolean;
  words: WordEntry[];
}

export interface QueueItem {
  word: string;
  kind: 'new' | 'review';
}

export interface DailyRecord {
  targetSize: number;
  queue: QueueItem[];
  studiedWords: string[];
  unknownWords: string[];
  quiz?: {
    right: number;
    total: number;
    wrongWords: string[];
  };
  checked: boolean;
  newCount: number;
  reviewCount: number;
}

export interface WrongRecord {
  n: number;
  added: string;
  last: string;
  stage: number; // 0..4 index into [1, 2, 4, 7, 15]
  streak: number; // 0..5 consecutive rights
  next: string; // YYYY-MM-DD
}

export interface SrsRecord {
  stage: number; // 0..4
  streak: number; // 0..5
  next: string; // YYYY-MM-DD
  last: string;
  mastered: boolean;
}

export interface DeckProgress {
  firstDate: string;
  cursor: number;
  daily: Record<string, DailyRecord>;
  wrong: Record<string, WrongRecord>;
  srs: Record<string, SrsRecord>;
  learned: string[];
}

export interface CustomDeckStorage {
  id: string;
  name: string;
  subtitle: string;
  words: WordEntry[];
}

export interface AppStorageState {
  version: number;
  activeDeckId: string;
  dailySize: number;
  maskEnabled: boolean;
  nickname: string;
  decks: Record<string, DeckProgress>;
  customDecks: CustomDeckStorage[];
  globalCheckins: Record<string, boolean>;
  deckOverrides?: Record<string, { name?: string; words?: WordEntry[] }>;
}

export interface QuizQuestion {
  index: number;
  type: 'choice' | 'spell';
  word: WordEntry;
  options?: {
    label: string;
    meaning: string;
    word: string;
    isCorrect: boolean;
  }[];
}

export interface DailyQuote {
  en: string;
  zh: string;
  source: string;
}
