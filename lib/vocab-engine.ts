import type {
  AppStorageState,
  DailyQuote,
  DailyRecord,
  DeckDefinition,
  DeckProgress,
  QueueItem,
  QuizQuestion,
  WordEntry,
  WrongRecord,
} from './types';
import { BUILTIN_DECKS, DAILY_QUOTES, MASTER_DICT } from './decks';

export const SRS_INTERVALS = [1, 2, 4, 7, 15] as const;
export const DAILY_SIZE_OPTIONS = [5, 7, 10, 15, 20, 30] as const;

export function formatLocalDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(dateStr: string, days: number): string {
  const dt = parseLocalDate(dateStr);
  dt.setDate(dt.getDate() + days);
  return formatLocalDate(dt);
}

export function diffDays(fromStr: string, toStr: string): number {
  const a = parseLocalDate(fromStr);
  const b = parseLocalDate(toStr);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000);
}

export function getDayNumber(firstDate: string, today: string): number {
  const diff = diffDays(firstDate, today);
  return Math.max(1, diff + 1);
}

export function createEmptyDeckProgress(today: string): DeckProgress {
  return {
    firstDate: today,
    cursor: 0,
    daily: {},
    wrong: {},
    srs: {},
    learned: [],
  };
}

export function createInitialState(today: string = formatLocalDate()): AppStorageState {
  const decks: Record<string, DeckProgress> = {};
  for (const d of BUILTIN_DECKS) {
    decks[d.id] = createEmptyDeckProgress(today);
  }
  return {
    version: 1,
    activeDeckId: 'cet4',
    dailySize: 7,
    maskEnabled: true,
    nickname: 'TCAMP 同学',
    decks,
    customDecks: [],
    globalCheckins: {},
  };
}

export function getAllDecks(state: AppStorageState): DeckDefinition[] {
  const overrides = state.deckOverrides || {};
  const builtins: DeckDefinition[] = BUILTIN_DECKS.map((bd) => {
    const ov = overrides[bd.id];
    if (!ov) return bd;
    return {
      ...bd,
      name: ov.name || bd.name,
      words: ov.words || bd.words,
    };
  });
  const custom: DeckDefinition[] = state.customDecks.map((cd) => ({
    id: cd.id,
    name: cd.name,
    subtitle: cd.subtitle || '自定义导入词库',
    builtin: false,
    words: cd.words,
  }));
  return [...builtins, ...custom];
}

export function getActiveDeck(state: AppStorageState): DeckDefinition {
  const all = getAllDecks(state);
  return all.find((d) => d.id === state.activeDeckId) || BUILTIN_DECKS[0];
}

export function getDeckProgress(
  state: AppStorageState,
  deckId: string,
  today: string
): DeckProgress {
  return state.decks[deckId] || createEmptyDeckProgress(today);
}

/**
 * Build or adjust today's daily queue for a deck.
 * Rules:
 * 1. Due review words (srs[w].next <= today and !mastered) prioritized first.
 * 2. Reserve at least 1 slot for a new word when deck has >= 1 word and quota >= 1.
 * 3. Total queue size = min(dailySize, deck.words.length) if deck smaller, or dailySize cycling smoothly.
 * 4. If user increases dailySize mid-day, append extra words without dropping studiedWords.
 * 5. If user decreases dailySize mid-day, shrink pending unstudied tail (never removing already studied words).
 */
export function ensureTodayRecord(
  progress: DeckProgress,
  deck: DeckDefinition,
  today: string,
  dailySize: number
): { progress: DeckProgress; record: DailyRecord } {
  const words = deck.words;
  const existing = progress.daily[today];

  if (words.length === 0) {
    const emptyRec: DailyRecord = {
      targetSize: dailySize,
      queue: [],
      studiedWords: [],
      unknownWords: [],
      checked: false,
      newCount: 0,
      reviewCount: 0,
    };
    return {
      progress: {
        ...progress,
        daily: { ...progress.daily, [today]: emptyRec },
      },
      record: emptyRec,
    };
  }

  const targetCount = Math.max(1, Math.min(dailySize, words.length));

  if (existing && existing.targetSize === targetCount && existing.queue.length > 0) {
    return { progress, record: existing };
  }

  const learnedSet = new Set(progress.learned);
  const wordSet = new Set(words.map((w) => w.word));

  // Keep already studied words intact if resizing mid-day
  const studiedWords = existing
    ? existing.studiedWords.filter((w) => wordSet.has(w))
    : [];
  const studiedSet = new Set(studiedWords);

  let nextQueue: QueueItem[] = [];
  if (existing && existing.queue.length > 0) {
    // Keep studied items + pending items up to targetCount
    const keptStudied = existing.queue.filter((q) => studiedSet.has(q.word));
    const keptPending = existing.queue.filter(
      (q) => !studiedSet.has(q.word) && wordSet.has(q.word)
    );
    if (keptStudied.length >= targetCount) {
      // Shrunk below or equal to already studied count -> complete at studied items
      nextQueue = keptStudied;
    } else {
      const needed = targetCount - keptStudied.length;
      nextQueue = [...keptStudied, ...keptPending.slice(0, needed)];
    }
  }

  if (nextQueue.length < targetCount) {
    const inQueue = new Set(nextQueue.map((q) => q.word));
    const remainingSlots = targetCount - nextQueue.length;

    // Due review words: either in wrong or in srs (not mastered, next <= today)
    const dueReviewWords: string[] = [];
    for (const w of words) {
      if (inQueue.has(w.word)) continue;
      const srsRec = progress.srs[w.word];
      const wrongRec = progress.wrong[w.word];
      if (wrongRec && wrongRec.next <= today) {
        dueReviewWords.push(w.word);
      } else if (srsRec && !srsRec.mastered && srsRec.next <= today) {
        dueReviewWords.push(w.word);
      }
    }

    // Reserve at least 1 slot for a new word if the queue doesn't already contain a new word
    const hasNewAlready = nextQueue.some((q) => q.kind === 'new');
    const maxReviewsToAdd =
      !hasNewAlready && remainingSlots >= 1
        ? Math.max(0, remainingSlots - 1)
        : remainingSlots;

    const pickedReviews = dueReviewWords.slice(0, maxReviewsToAdd);
    for (const rw of pickedReviews) {
      nextQueue.push({ word: rw, kind: 'review' });
      inQueue.add(rw);
    }

    // Fill remaining slots with new words sequentially from cursor (wrapping if needed)
    let safety = 0;
    let cursor = progress.cursor % words.length;
    // First pass: unseen words (not in learnedSet, not inQueue)
    while (nextQueue.length < targetCount && safety < words.length) {
      const candidate = words[cursor].word;
      cursor = (cursor + 1) % words.length;
      safety++;
      if (!inQueue.has(candidate) && !learnedSet.has(candidate)) {
        nextQueue.push({ word: candidate, kind: 'new' });
        inQueue.add(candidate);
      }
    }
    // Second pass: if deck was fully cycled, pick next words from cursor
    safety = 0;
    while (nextQueue.length < targetCount && safety < words.length) {
      const candidate = words[cursor].word;
      cursor = (cursor + 1) % words.length;
      safety++;
      if (!inQueue.has(candidate)) {
        nextQueue.push({ word: candidate, kind: 'new' });
        inQueue.add(candidate);
      }
    }
  }

  const newCount = nextQueue.filter((q) => q.kind === 'new').length;
  const reviewCount = nextQueue.filter((q) => q.kind === 'review').length;

  const updatedRecord: DailyRecord = {
    targetSize: targetCount,
    queue: nextQueue,
    studiedWords,
    unknownWords: existing ? existing.unknownWords : [],
    quiz: existing?.quiz,
    checked: existing?.checked ?? false,
    newCount,
    reviewCount,
  };

  return {
    progress: {
      ...progress,
      daily: {
        ...progress.daily,
        [today]: updatedRecord,
      },
    },
    record: updatedRecord,
  };
}

/**
 * Update SRS and wrong-book state for a word on review/study/quiz outcome.
 * Fixed intervals: [1, 2, 4, 7, 15] days.
 * - Correct: advance stage (0->1->2->3->4->5), increment streak. At streak >= 5 -> mastered & removed from wrong!
 * - Incorrect: reset to stage 0, streak 0, next = today + 1 day, add/increment in wrong.
 */
export function applyWordOutcome(
  progress: DeckProgress,
  word: string,
  isCorrect: boolean,
  today: string,
  incrementWrongCount: boolean = true
): DeckProgress {
  const prevSrs = progress.srs[word];
  const prevWrong = progress.wrong[word];
  const nextSrsMap = { ...progress.srs };
  const nextWrongMap = { ...progress.wrong };
  const learnedSet = new Set(progress.learned);
  learnedSet.add(word);

  if (isCorrect) {
    const currentStreak = prevSrs ? prevSrs.streak : 0;
    const nextStreak = Math.min(5, currentStreak + 1);
    if (nextStreak >= 5) {
      nextSrsMap[word] = {
        stage: 5,
        streak: 5,
        next: addDays(today, 15),
        last: today,
        mastered: true,
      };
      delete nextWrongMap[word];
    } else {
      const intervalIdx = Math.min(SRS_INTERVALS.length - 1, nextStreak);
      const nextDate = addDays(today, SRS_INTERVALS[intervalIdx]);
      nextSrsMap[word] = {
        stage: nextStreak,
        streak: nextStreak,
        next: nextDate,
        last: today,
        mastered: false,
      };
      if (nextWrongMap[word]) {
        nextWrongMap[word] = {
          ...nextWrongMap[word],
          stage: nextStreak,
          streak: nextStreak,
          next: nextDate,
          last: today,
        };
      }
    }
  } else {
    const nextDate = addDays(today, SRS_INTERVALS[0]); // +1 day
    nextSrsMap[word] = {
      stage: 0,
      streak: 0,
      next: nextDate,
      last: today,
      mastered: false,
    };
    nextWrongMap[word] = {
      n: (prevWrong ? prevWrong.n : 0) + (incrementWrongCount ? 1 : 0),
      added: prevWrong ? prevWrong.added : today,
      last: today,
      stage: 0,
      streak: 0,
      next: nextDate,
    };
  }

  return {
    ...progress,
    srs: nextSrsMap,
    wrong: nextWrongMap,
    learned: Array.from(learnedSet),
  };
}

export function markWordMasteredManually(
  progress: DeckProgress,
  word: string,
  today: string
): DeckProgress {
  const nextWrong = { ...progress.wrong };
  delete nextWrong[word];
  const nextSrs = {
    ...progress.srs,
    [word]: {
      stage: 5,
      streak: 5,
      next: addDays(today, 15),
      last: today,
      mastered: true,
    },
  };
  const learnedSet = new Set(progress.learned);
  learnedSet.add(word);
  return {
    ...progress,
    wrong: nextWrong,
    srs: nextSrs,
    learned: Array.from(learnedSet),
  };
}

/**
 * Compute shared streak across all decks:
 * If checked today, count backwards from today; otherwise count backwards from yesterday.
 */
export function computeStreak(
  globalCheckins: Record<string, boolean>,
  today: string
): number {
  let cursor = globalCheckins[today] ? today : addDays(today, -1);
  let streak = 0;
  while (globalCheckins[cursor]) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function getWeekDates(today: string): { date: string; label: string; shortDate: string }[] {
  const dt = parseLocalDate(today);
  const jsDay = dt.getDay(); // 0=Sun .. 6=Sat
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const labels = ['一', '二', '三', '四', '五', '六', '日'];
  const result: { date: string; label: string; shortDate: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(dt);
    d.setDate(dt.getDate() + mondayOffset + i);
    const iso = formatLocalDate(d);
    const shortDate = `${d.getMonth() + 1}/${d.getDate()}`;
    result.push({ date: iso, label: labels[i], shortDate });
  }
  return result;
}

/**
 * Highlight or blank out target word & its inflected forms (-s/-es/-ed/-ing/-d) in example sentence.
 */
export function splitExampleWithTarget(
  example: string,
  targetWord: string
): { text: string; isTarget: boolean }[] {
  const escaped = targetWord.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!escaped) return [{ text: example, isTarget: false }];
  // Match exact word or stem variations (drop trailing e/y for inflections)
  const lower = targetWord.trim().toLowerCase();
  const stems = [escaped];
  if (lower.endsWith('e') && lower.length > 3) {
    stems.push(lower.slice(0, -1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  }
  if (lower.endsWith('y') && lower.length > 3) {
    stems.push(`${lower.slice(0, -1)}i`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  }
  const regex = new RegExp(`\\b(${stems.join('|')})(?:s|es|ed|d|ing|ies|ied|ly|er|est)?\\b`, 'gi');

  const parts: { text: string; isTarget: boolean }[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(example)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ text: example.slice(lastIdx, match.index), isTarget: false });
    }
    parts.push({ text: match[0], isTarget: true });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < example.length) {
    parts.push({ text: example.slice(lastIdx), isTarget: false });
  }
  return parts.length > 0 ? parts : [{ text: example, isTarget: false }];
}

/**
 * Generate 3 distractors prioritizing:
 * 1) Same POS + same starting letter or similar word length (<= 2 diff)
 * 2) Same POS
 * 3) Fallback any word in deck / MASTER_DICT
 */
export function pickChoiceDistractors(
  target: WordEntry,
  deckWords: WordEntry[],
  seed: number = 0
): WordEntry[] {
  const poolMap = new Map<string, WordEntry>();
  for (const w of deckWords) {
    if (w.word.toLowerCase() !== target.word.toLowerCase()) {
      poolMap.set(w.word.toLowerCase(), w);
    }
  }
  if (poolMap.size < 6) {
    for (const key of Object.keys(MASTER_DICT)) {
      if (key !== target.word.toLowerCase() && !poolMap.has(key)) {
        poolMap.set(key, MASTER_DICT[key]);
      }
      if (poolMap.size >= 40) break;
    }
  }

  const candidates = Array.from(poolMap.values()).filter(
    (c) => c.meaning.trim() !== target.meaning.trim()
  );

  const tPos = target.pos.trim().toLowerCase();
  const tChar = target.word.trim().charAt(0).toLowerCase();
  const tLen = target.word.trim().length;

  const scored = candidates.map((c, idx) => {
    const samePos = c.pos.trim().toLowerCase() === tPos ? 10 : 0;
    const sameInitial = c.word.trim().charAt(0).toLowerCase() === tChar ? 4 : 0;
    const closeLen = Math.abs(c.word.trim().length - tLen) <= 2 ? 3 : 0;
    // Deterministic tie-breaker using seed so tests & UI are predictable yet varied
    const tie = ((idx * 31 + seed * 17) % 97) / 100;
    return { entry: c, score: samePos + sameInitial + closeLen + tie };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s) => s.entry);
}

export function buildQuizQuestions(
  words: WordEntry[],
  deckWords: WordEntry[],
  seed: number = 1
): QuizQuestion[] {
  const labels = ['A', 'B', 'C', 'D'];
  return words.map((entry, idx) => {
    const type: 'choice' | 'spell' = idx % 2 === 0 ? 'choice' : 'spell';
    if (type === 'spell') {
      return { index: idx, type, word: entry };
    }
    const distractors = pickChoiceDistractors(entry, deckWords, idx + seed);
    const rawOpts = [
      { meaning: entry.meaning, word: entry.word, isCorrect: true },
      ...distractors.map((d) => ({ meaning: d.meaning, word: d.word, isCorrect: false })),
    ];
    // Deterministic rotation based on word hash + seed
    const hash = entry.word.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), seed + idx);
    const rotated: typeof rawOpts = [];
    for (let i = 0; i < rawOpts.length; i++) {
      rotated.push(rawOpts[(i + hash) % rawOpts.length]);
    }
    return {
      index: idx,
      type,
      word: entry,
      options: rotated.map((opt, oIdx) => ({
        label: labels[oIdx],
        meaning: opt.meaning,
        word: opt.word,
        isCorrect: opt.isCorrect,
      })),
    };
  });
}

export interface SpellingDiffChar {
  index: number;
  expected: string;
  actual: string;
  status: 'correct' | 'wrong' | 'missing';
}

export function evaluateSpelling(
  attempt: string,
  targetWord: string
): {
  isMatch: boolean;
  normalizedAttempt: string;
  diff: SpellingDiffChar[];
  extraChars: string;
  errorHints: string[];
} {
  const normalizedAttempt = attempt.trim().toLowerCase();
  const normalizedTarget = targetWord.trim().toLowerCase();
  const isMatch = normalizedAttempt === normalizedTarget;

  const diff: SpellingDiffChar[] = [];
  const errorHints: string[] = [];

  for (let i = 0; i < normalizedTarget.length; i++) {
    const exp = normalizedTarget[i];
    const act = normalizedAttempt[i] ?? '';
    if (!act) {
      diff.push({ index: i, expected: exp, actual: '', status: 'missing' });
      errorHints.push(`第 ${i + 1} 位缺失 "${exp}"`);
    } else if (act === exp) {
      diff.push({ index: i, expected: exp, actual: act, status: 'correct' });
    } else {
      diff.push({ index: i, expected: exp, actual: act, status: 'wrong' });
      errorHints.push(`第 ${i + 1} 位应为 "${exp}"（误输 "${act}"）`);
    }
  }

  const extraChars =
    normalizedAttempt.length > normalizedTarget.length
      ? normalizedAttempt.slice(normalizedTarget.length)
      : '';
  if (extraChars) {
    errorHints.push(`尾部多输了 "${extraChars}"`);
  }

  return { isMatch, normalizedAttempt, diff, extraChars, errorHints };
}

/**
 * Parse pasted word list (comma, whitespace, newline separated) and auto-complete from MASTER_DICT.
 */
export function parseAndLookupWords(rawText: string): {
  matched: WordEntry[];
  unmatched: string[];
} {
  const tokens = rawText
    .split(/[\s,;，；\n\r\t]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-z][a-z-]*$/i.test(s));

  const seen = new Set<string>();
  const matched: WordEntry[] = [];
  const unmatched: string[] = [];

  for (const token of tokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    if (MASTER_DICT[token]) {
      matched.push(MASTER_DICT[token]);
    } else {
      unmatched.push(token);
    }
  }
  return { matched, unmatched };
}

/**
 * Normalize imported JSON deck (supports both native format and KyleBing open-source format).
 */
export function normalizeImportedWords(raw: unknown): WordEntry[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: WordEntry[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const rawWord = String(obj.word || obj.name || '').trim();
    if (!rawWord) continue;
    const key = rawWord.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // Handle KyleBing format: translations [{ translation, type }], sentences [{ sentence, sentence_trans }], usphone
    let pos = String(obj.pos || '').trim();
    let meaning = String(obj.meaning || '').trim();
    if (!meaning && Array.isArray(obj.translations) && obj.translations.length > 0) {
      const first = obj.translations[0] as Record<string, unknown>;
      pos = pos || (first.type ? `${String(first.type).replace(/\.$/, '')}.` : 'n.');
      meaning = obj.translations
        .slice(0, 2)
        .map((t) => String((t as Record<string, unknown>).translation || '').trim())
        .filter(Boolean)
        .join('；');
    }

    let phonetic = String(obj.phonetic || '').trim();
    if (!phonetic && obj.usphone) {
      phonetic = `/${String(obj.usphone).replace(/^\/|\/$/g, '')}/`;
    }
    if (phonetic && !phonetic.startsWith('/')) phonetic = `/${phonetic}/`;

    let example = String(obj.example || '').trim();
    let exampleZh = String(obj.exampleZh || '').trim();
    if (!example && Array.isArray(obj.sentences) && obj.sentences.length > 0) {
      const s0 = obj.sentences[0] as Record<string, unknown>;
      example = String(s0.sentence || '').trim();
      exampleZh = String(s0.sentence_trans || '').trim();
    }

    const fallback = MASTER_DICT[key];
    result.push({
      word: rawWord,
      phonetic: phonetic || fallback?.phonetic || '/—/',
      pos: pos || fallback?.pos || 'n.',
      meaning: meaning || fallback?.meaning || '待补充释义',
      example: example || fallback?.example || `We reviewed the word ${rawWord} in today’s reading practice.`,
      exampleZh: exampleZh || fallback?.exampleZh || '我们在今天的阅读练习中复习了这个词。',
      memo: String(obj.memo || fallback?.memo || '结合语境例句记忆词义与搭配').trim(),
      collocations: String(obj.collocations || fallback?.collocations || rawWord).trim(),
      family: String(obj.family || fallback?.family || '暂无派生词').trim(),
      confusable: String(obj.confusable || fallback?.confusable || '注意结合例句辨析具体语境').trim(),
    });
  }
  return result;
}

export function getDailyQuote(dateStr: string): DailyQuote {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return DAILY_QUOTES[hash % DAILY_QUOTES.length];
}

export function buildCheckinCopyText(params: {
  day: number;
  date: string;
  deckName: string;
  newCount: number;
  reviewCount: number;
  streak: number;
}): string {
  return `【TCAMP 每日背单词】打卡第 ${params.day} 天 / ${params.date} · ${params.deckName} 第 ${params.day} 天 / 今天新学 ${params.newCount} 复习 ${params.reviewCount} / 已连续打卡 ${params.streak} 天`;
}

export function pickKeyWordForPoster(
  dailyRecord: DailyRecord | undefined,
  deckWords: WordEntry[]
): WordEntry | null {
  const byWord = new Map(deckWords.map((w) => [w.word, w]));
  if (dailyRecord?.quiz?.wrongWords && dailyRecord.quiz.wrongWords.length > 0) {
    const found = byWord.get(dailyRecord.quiz.wrongWords[0]);
    if (found) return found;
  }
  if (dailyRecord?.unknownWords && dailyRecord.unknownWords.length > 0) {
    const found = byWord.get(dailyRecord.unknownWords[0]);
    if (found) return found;
  }
  if (dailyRecord?.queue && dailyRecord.queue.length > 0) {
    const found = byWord.get(dailyRecord.queue[0].word);
    if (found) return found;
  }
  return deckWords[0] || null;
}

export function getSrsStageLabel(wrong: WrongRecord | undefined): string {
  if (!wrong) return '第 1 档 · 1 天后复习';
  const stage = Math.min(SRS_INTERVALS.length - 1, Math.max(0, wrong.stage));
  const days = SRS_INTERVALS[stage];
  return `第 ${stage + 1} 档 · ${days} 天后复习`;
}
