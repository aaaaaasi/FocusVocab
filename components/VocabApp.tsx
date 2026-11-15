'use client';

import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { HomeScreen } from './HomeScreen';
import { StudyScreen, type ActiveStudyItem } from './StudyScreen';
import { DoneScreen } from './DoneScreen';
import { QuizScreen } from './QuizScreen';
import { ResultScreen } from './ResultScreen';
import { WrongScreen, type WrongItemView } from './WrongScreen';
import { CheckinScreen } from './CheckinScreen';
import { DeckSwitcherModal, ManageModal, WordListModal } from './Modals';
import { SafeButton } from './SafeButton';
import { BUILTIN_DECKS, MASTER_DICT } from '../lib/decks';
import { loadStorageState, saveStorageState } from '../lib/storage';
import {
  addDays,
  applyWordOutcome,
  computeStreak,
  createEmptyDeckProgress,
  ensureTodayRecord,
  formatLocalDate,
  getActiveDeck,
  getAllDecks,
  getDayNumber,
  getDeckProgress,
  markWordMasteredManually,
  buildQuizQuestions,
} from '../lib/vocab-engine';
import type {
  AppStorageState,
  DeckProgress,
  QuizQuestion,
  ScreenName,
  WordEntry,
} from '../lib/types';

interface StudyUndoSnapshot {
  prevIndex: number;
  prevQueue: ActiveStudyItem[];
  prevDeckProgress: DeckProgress;
  word: string;
  meaning: string;
}

function downloadJsonFile(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const emptySubscribe = () => () => {};

export function VocabApp() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="app-shell">
        <div className="surface-card flex-1 min-h-0 flex items-center justify-center">
          <span className="text-sm text-[#6B7385]">正在准备词库...</span>
        </div>
      </div>
    );
  }

  return <VocabAppInner />;
}

function VocabAppInner() {
  const [today] = useState(() => formatLocalDate());
  const [initialLoaded] = useState(() => {
    const { state: rawState, storageError } = loadStorageState();
    const deck = getActiveDeck(rawState);
    const prog = getDeckProgress(rawState, deck.id, formatLocalDate());
    const ensured = ensureTodayRecord(prog, deck, formatLocalDate(), rawState.dailySize);
    const normalizedState: AppStorageState = {
      ...rawState,
      decks: {
        ...rawState.decks,
        [deck.id]: ensured.progress,
      },
    };
    return { state: normalizedState, storageError };
  });

  const [state, setState] = useState<AppStorageState>(initialLoaded.state);
  const [storageError, setStorageError] = useState<string | null>(initialLoaded.storageError);
  const [screen, setScreen] = useState<ScreenName>('home');

  // Modals
  const [wordModalMode, setWordModalMode] = useState<'today' | 'all' | null>(null);
  const [deckSwitcherOpen, setDeckSwitcherOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  // Study Session state
  const [studyQueue, setStudyQueue] = useState<ActiveStudyItem[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [undoStack, setUndoStack] = useState<StudyUndoSnapshot[]>([]);

  // Quiz & Result state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizInitialIdx, setQuizInitialIdx] = useState(0);
  const [quizIsDaily, setQuizIsDaily] = useState(true);
  const [lastResults, setLastResults] = useState<{ entry: WordEntry; isCorrect: boolean }[]>([]);

  const persistAndSetState = useCallback(
    (updater: (prev: AppStorageState) => AppStorageState) => {
      setState((prev) => {
        const next = updater(prev);
        const res = saveStorageState(next);
        if (!res.ok && res.error) {
          setStorageError(res.error);
        }
        return next;
      });
    },
    []
  );

  const show = useCallback((target: ScreenName) => {
    setScreen(target);
  }, []);

  const allDecks = useMemo(() => getAllDecks(state), [state]);
  const activeDeck = useMemo(() => getActiveDeck(state), [state]);
  const deckProgress = useMemo(
    () => getDeckProgress(state, activeDeck.id, today),
    [state, activeDeck.id, today]
  );

  const { progress: ensuredProgress, record: todayRecord } = useMemo(
    () => ensureTodayRecord(deckProgress, activeDeck, today, state.dailySize),
    [deckProgress, activeDeck, today, state.dailySize]
  );

  const wordMap = useMemo(() => {
    const map = new Map<string, WordEntry>();
    for (const w of activeDeck.words) {
      map.set(w.word, w);
      map.set(w.word.toLowerCase(), w);
    }
    return map;
  }, [activeDeck.words]);

  const resolveWordEntry = useCallback(
    (word: string): WordEntry | null => {
      return wordMap.get(word) || wordMap.get(word.toLowerCase()) || MASTER_DICT[word.toLowerCase()] || null;
    },
    [wordMap]
  );

  const dayNumber = useMemo(
    () => getDayNumber(ensuredProgress.firstDate, today),
    [ensuredProgress.firstDate, today]
  );

  const streak = useMemo(
    () => computeStreak(state.globalCheckins, today),
    [state.globalCheckins, today]
  );

  const wrongItems: WrongItemView[] = useMemo(() => {
    const list: WrongItemView[] = [];
    for (const [w, rec] of Object.entries(ensuredProgress.wrong)) {
      const entry = resolveWordEntry(w);
      if (entry) {
        list.push({ entry, record: rec });
      }
    }
    list.sort((a, b) => {
      if (a.record.next !== b.record.next) return a.record.next.localeCompare(b.record.next);
      return b.record.n - a.record.n;
    });
    return list;
  }, [ensuredProgress.wrong, resolveWordEntry]);

  const masteredCount = useMemo(
    () => Object.values(ensuredProgress.srs).filter((s) => s.mastered).length,
    [ensuredProgress.srs]
  );

  // Handlers: Home
  const handleChangeDailySize = (size: number) => {
    persistAndSetState((prev) => {
      const deck = getActiveDeck(prev);
      const prog = getDeckProgress(prev, deck.id, today);
      const { progress: updatedProg } = ensureTodayRecord(prog, deck, today, size);
      return {
        ...prev,
        dailySize: size,
        decks: {
          ...prev.decks,
          [deck.id]: updatedProg,
        },
      };
    });
  };

  const handleStartStudy = () => {
    const studiedSet = new Set(todayRecord.studiedWords);
    const pending: ActiveStudyItem[] = [];
    for (const qItem of todayRecord.queue) {
      if (!studiedSet.has(qItem.word)) {
        const entry = resolveWordEntry(qItem.word);
        if (entry) {
          pending.push({
            entry,
            kind: qItem.kind,
            isRequeued: false,
          });
        }
      }
    }
    if (pending.length === 0) {
      show('done');
      return;
    }
    setStudyQueue(pending);
    setStudyIndex(0);
    setUndoStack([]);
    show('study');
  };

  // Handlers: Study
  const handleToggleMask = () => {
    persistAndSetState((prev) => ({
      ...prev,
      maskEnabled: !prev.maskEnabled,
    }));
  };

  const handleMarkUnknown = (word: string) => {
    const current = studyQueue[studyIndex];
    if (!current) return;

    // Re-queue word at end of current study session
    setStudyQueue((prev) => [
      ...prev,
      {
        entry: current.entry,
        kind: current.kind,
        isRequeued: true,
      },
    ]);

    persistAndSetState((prev) => {
      const deck = getActiveDeck(prev);
      const prog = getDeckProgress(prev, deck.id, today);
      const { progress: ensured, record } = ensureTodayRecord(prog, deck, today, prev.dailySize);
      const unknownSet = new Set(record.unknownWords);
      unknownSet.add(word);

      const afterOutcome = applyWordOutcome(ensured, word, false, today, true);
      const updatedRecord = {
        ...record,
        unknownWords: Array.from(unknownSet),
      };

      return {
        ...prev,
        decks: {
          ...prev.decks,
          [deck.id]: {
            ...afterOutcome,
            daily: {
              ...afterOutcome.daily,
              [today]: updatedRecord,
            },
          },
        },
      };
    });
  };

  const handleConfirmKnown = (word: string) => {
    const current = studyQueue[studyIndex];
    if (!current) return;

    // Push undo snapshot before advancing
    setUndoStack((prev) => [
      ...prev,
      {
        prevIndex: studyIndex,
        prevQueue: studyQueue,
        prevDeckProgress: ensuredProgress,
        word: current.entry.word,
        meaning: current.entry.meaning,
      },
    ]);

    persistAndSetState((prev) => {
      const deck = getActiveDeck(prev);
      const prog = getDeckProgress(prev, deck.id, today);
      const { progress: ensured, record } = ensureTodayRecord(prog, deck, today, prev.dailySize);

      const alreadyStudied = record.studiedWords.includes(word);
      const wasMarkedUnknownToday = record.unknownWords.includes(word);
      const shouldCommitStudied =
        !alreadyStudied && (current.isRequeued || !wasMarkedUnknownToday);
      const nextStudied = shouldCommitStudied
        ? [...record.studiedWords, word]
        : record.studiedWords;

      let nextProg = ensured;
      if (shouldCommitStudied) {
        if (!wasMarkedUnknownToday) {
          nextProg = applyWordOutcome(ensured, word, true, today, true);
        }
        if (current.kind === 'new' && deck.words.length > 0) {
          nextProg = {
            ...nextProg,
            cursor: (nextProg.cursor + 1) % deck.words.length,
          };
        }
      }

      return {
        ...prev,
        decks: {
          ...prev.decks,
          [deck.id]: {
            ...nextProg,
            daily: {
              ...nextProg.daily,
              [today]: {
                ...record,
                studiedWords: nextStudied,
              },
            },
          },
        },
      };
    });

    if (studyIndex + 1 >= studyQueue.length) {
      show('done');
    } else {
      setStudyIndex((i) => i + 1);
    }
  };

  const handleUndoLast = () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    setUndoStack((prev) => prev.slice(0, -1));
    setStudyQueue(last.prevQueue);
    setStudyIndex(last.prevIndex);

    persistAndSetState((prev) => ({
      ...prev,
      decks: {
        ...prev.decks,
        [activeDeck.id]: last.prevDeckProgress,
      },
    }));
  };

  // Handlers: Quiz
  const startDailyQuiz = () => {
    const entries: WordEntry[] = [];
    for (const qItem of todayRecord.queue) {
      const entry = resolveWordEntry(qItem.word);
      if (entry) entries.push(entry);
    }
    if (entries.length === 0) return;
    const seed = Number(today.replace(/-/g, '')) % 997;
    setQuizQuestions(buildQuizQuestions(entries, activeDeck.words, seed));
    setQuizInitialIdx(0);
    setQuizIsDaily(true);
    show('quiz');
  };

  const startPracticeQuiz = (entries: WordEntry[]) => {
    if (entries.length === 0) return;
    const seed = (Number(today.replace(/-/g, '')) + 19) % 997;
    setQuizQuestions(buildQuizQuestions(entries, activeDeck.words, seed));
    setQuizInitialIdx(0);
    setQuizIsDaily(false);
    show('quiz');
  };

  useEffect(() => {
    const applyShowcaseState = (stage: number) => {
      const cet4Deck = BUILTIN_DECKS[0];
      const yesterday = addDays(today, -1);
      const day1Words = ['adequate', 'adjust', 'advocate', 'affect', 'afford', 'allocate', 'alter'];
      const day2Words = [
        'abandon',
        'academic',
        'accompany',
        'accomplish',
        'acknowledge',
        'acquire',
        'adapt',
      ];
      const findEntry = (w: string): WordEntry =>
        cet4Deck.words.find((item) => item.word === w) || MASTER_DICT[w] || cet4Deck.words[0];

      const isPostQuiz = stage >= 5;
      const srsMap: DeckProgress['srs'] = {};
      for (const w of day1Words) {
        srsMap[w] = {
          stage: 5,
          streak: 5,
          next: addDays(today, 15),
          last: yesterday,
          mastered: true,
        };
      }
      if (isPostQuiz) {
        for (const w of day2Words) {
          const isWrong = w === 'accompany' || w === 'accomplish';
          srsMap[w] = {
            stage: isWrong ? 0 : 1,
            streak: isWrong ? 0 : 1,
            next: addDays(today, isWrong ? 1 : 2),
            last: today,
            mastered: false,
          };
        }
      }

      const wrongMap: DeckProgress['wrong'] = isPostQuiz
        ? {
            accompany: {
              n: 1,
              added: today,
              last: today,
              stage: 0,
              streak: 0,
              next: addDays(today, 1),
            },
            accomplish: {
              n: 1,
              added: today,
              last: today,
              stage: 0,
              streak: 0,
              next: addDays(today, 1),
            },
          }
        : {};

      const cet4Prog: DeckProgress = {
        firstDate: yesterday,
        cursor: isPostQuiz ? 14 : 7,
        learned: isPostQuiz ? [...day1Words, ...day2Words] : [...day1Words],
        srs: srsMap,
        wrong: wrongMap,
        daily: {
          [yesterday]: {
            targetSize: 7,
            queue: day1Words.map((w) => ({ word: w, kind: 'new' })),
            studiedWords: [...day1Words],
            unknownWords: [],
            quiz: { right: 7, total: 7, wrongWords: [] },
            checked: true,
            newCount: 7,
            reviewCount: 0,
          },
          [today]: {
            targetSize: 7,
            queue: day2Words.map((w) => ({ word: w, kind: 'new' })),
            studiedWords: stage >= 3 ? [...day2Words] : [],
            unknownWords: isPostQuiz ? ['accompany', 'accomplish'] : [],
            quiz: isPostQuiz
              ? { right: 5, total: 7, wrongWords: ['accompany', 'accomplish'] }
              : undefined,
            checked: isPostQuiz,
            newCount: 7,
            reviewCount: 0,
          },
        },
      };

      const nextState: AppStorageState = {
        version: 1,
        activeDeckId: 'cet4',
        dailySize: 7,
        maskEnabled: true,
        nickname: 'TCAMP 同学',
        decks: {
          ...state.decks,
          cet4: cet4Prog,
        },
        customDecks: [],
        globalCheckins: isPostQuiz
          ? { [yesterday]: true, [today]: true }
          : { [yesterday]: true },
      };

      saveStorageState(nextState);
      setState(nextState);

      const day2Entries = day2Words.map(findEntry);
      if (stage === 1) {
        setScreen('home');
      } else if (stage === 2) {
        setStudyQueue(
          day2Entries.map((entry) => ({
            entry,
            kind: 'new',
            isRequeued: false,
          }))
        );
        setStudyIndex(0);
        setUndoStack([]);
        setScreen('study');
      } else if (stage === 3 || stage === 4) {
        const academicEntry = findEntry('academic');
        const abandonEntry = findEntry('abandon');
        const customQs: QuizQuestion[] = day2Entries.map((entry, idx) => {
          if (idx === 1) {
            return {
              index: 1,
              type: 'choice',
              word: academicEntry,
              options: [
                { label: 'A', meaning: '准确的；精确的', word: 'accurate', isCorrect: false },
                {
                  label: 'B',
                  meaning: '学术的；学院的；纯理论的',
                  word: 'academic',
                  isCorrect: true,
                },
                {
                  label: 'C',
                  meaning: '足够的；适当的；胜任的',
                  word: 'adequate',
                  isCorrect: false,
                },
                {
                  label: 'D',
                  meaning: '绝对的；完全的；无条件的',
                  word: 'absolute',
                  isCorrect: false,
                },
              ],
            };
          }
          if (idx === 4) {
            return {
              index: 4,
              type: 'spell',
              word: abandonEntry,
            };
          }
          return {
            index: idx,
            type: idx % 2 === 0 ? 'choice' : 'spell',
            word: entry,
          };
        });
        setQuizQuestions(customQs);
        setQuizInitialIdx(stage === 3 ? 1 : 4);
        setQuizIsDaily(true);
        setScreen('quiz');
      } else if (stage === 5) {
        setLastResults(
          day2Entries.map((entry) => ({
            entry,
            isCorrect: entry.word !== 'accompany' && entry.word !== 'accomplish',
          }))
        );
        setQuizIsDaily(true);
        setScreen('result');
      } else if (stage === 6) {
        setScreen('checkin');
      }
    };

    const win = window as unknown as {
      __applyShowcaseState?: (stage: number) => void;
      show?: (target: ScreenName) => void;
    };
    win.__applyShowcaseState = applyShowcaseState;
    win.show = show;
  }, [today, state.decks, show]);

  const handleFinishQuiz = (outcomes: { word: string; isCorrect: boolean }[]) => {
    const mappedResults: { entry: WordEntry; isCorrect: boolean }[] = [];
    for (const o of outcomes) {
      const entry = resolveWordEntry(o.word);
      if (entry) {
        mappedResults.push({ entry, isCorrect: o.isCorrect });
      }
    }
    setLastResults(mappedResults);

    const rightCount = outcomes.filter((o) => o.isCorrect).length;
    const wrongWords = outcomes.filter((o) => !o.isCorrect).map((o) => o.word);

    persistAndSetState((prev) => {
      const deck = getActiveDeck(prev);
      const prog = getDeckProgress(prev, deck.id, today);
      let { progress: nextProg, record } = ensureTodayRecord(prog, deck, today, prev.dailySize);

      for (const o of outcomes) {
        nextProg = applyWordOutcome(nextProg, o.word, o.isCorrect, today, true);
      }

      if (quizIsDaily) {
        record = {
          ...nextProg.daily[today],
          quiz: {
            right: rightCount,
            total: outcomes.length,
            wrongWords,
          },
          checked: true,
        };
        nextProg = {
          ...nextProg,
          daily: {
            ...nextProg.daily,
            [today]: record,
          },
        };
      }

      return {
        ...prev,
        decks: {
          ...prev.decks,
          [deck.id]: nextProg,
        },
        globalCheckins: quizIsDaily
          ? { ...prev.globalCheckins, [today]: true }
          : prev.globalCheckins,
      };
    });

    show('result');
  };

  // Handlers: Wrong Book
  const handleMarkWrongMastered = (word: string) => {
    persistAndSetState((prev) => {
      const deck = getActiveDeck(prev);
      const prog = getDeckProgress(prev, deck.id, today);
      const updated = markWordMasteredManually(prog, word, today);
      return {
        ...prev,
        decks: {
          ...prev.decks,
          [deck.id]: updated,
        },
      };
    });
  };

  // Handlers: Checkin
  const handleChangeNickname = (name: string) => {
    persistAndSetState((prev) => ({
      ...prev,
      nickname: name.slice(0, 12),
    }));
  };

  // Handlers: Deck Switcher & Manage Modal
  const handleSelectDeck = (deckId: string) => {
    persistAndSetState((prev) => {
      const all = getAllDecks(prev);
      const targetDeck = all.find((d) => d.id === deckId) || BUILTIN_DECKS[0];
      const prog = getDeckProgress(prev, targetDeck.id, today);
      const { progress: ensured } = ensureTodayRecord(prog, targetDeck, today, prev.dailySize);
      return {
        ...prev,
        activeDeckId: targetDeck.id,
        decks: {
          ...prev.decks,
          [targetDeck.id]: ensured,
        },
      };
    });
    show('home');
  };

  const handleExportBackup = () => {
    downloadJsonFile(`vocab-booster-backup-${today}.json`, state);
  };

  const handleImportBackup = (parsed: AppStorageState) => {
    persistAndSetState((prev) => {
      const mergedDecks = { ...prev.decks, ...(parsed.decks || {}) };
      for (const bd of BUILTIN_DECKS) {
        if (!mergedDecks[bd.id]) {
          mergedDecks[bd.id] = createEmptyDeckProgress(today);
        }
      }
      const next: AppStorageState = {
        version: 1,
        activeDeckId: parsed.activeDeckId || prev.activeDeckId,
        dailySize: typeof parsed.dailySize === 'number' && parsed.dailySize > 0 ? parsed.dailySize : 7,
        maskEnabled: typeof parsed.maskEnabled === 'boolean' ? parsed.maskEnabled : true,
        nickname: parsed.nickname || 'TCAMP 同学',
        decks: mergedDecks,
        customDecks: Array.isArray(parsed.customDecks) ? parsed.customDecks : [],
        globalCheckins: parsed.globalCheckins || {},
        deckOverrides: parsed.deckOverrides,
      };
      const deck = getActiveDeck(next);
      const prog = getDeckProgress(next, deck.id, today);
      const ensured = ensureTodayRecord(prog, deck, today, next.dailySize);
      return {
        ...next,
        decks: {
          ...next.decks,
          [deck.id]: ensured.progress,
        },
      };
    });
    show('home');
  };

  const handleResetAllProgress = () => {
    persistAndSetState((prev) => {
      const freshDecks: Record<string, DeckProgress> = {};
      for (const d of getAllDecks(prev)) {
        freshDecks[d.id] = createEmptyDeckProgress(today);
      }
      const active = getActiveDeck(prev);
      const ensured = ensureTodayRecord(freshDecks[active.id], active, today, prev.dailySize);
      freshDecks[active.id] = ensured.progress;
      return {
        ...prev,
        decks: freshDecks,
        globalCheckins: {},
      };
    });
    show('home');
  };

  const handleCreateBlankDeck = (name: string) => {
    const newId = `custom-${Date.now()}`;
    persistAndSetState((prev) => {
      const nextCustom = [
        ...prev.customDecks,
        {
          id: newId,
          name,
          subtitle: '自定义新建词库',
          words: [],
        },
      ];
      return {
        ...prev,
        activeDeckId: newId,
        customDecks: nextCustom,
        decks: {
          ...prev.decks,
          [newId]: createEmptyDeckProgress(today),
        },
      };
    });
  };

  const handleRenameCurrentDeck = (newName: string) => {
    persistAndSetState((prev) => {
      const deck = getActiveDeck(prev);
      if (deck.builtin) {
        const overrides = { ...(prev.deckOverrides || {}) };
        overrides[deck.id] = { ...(overrides[deck.id] || {}), name: newName };
        return { ...prev, deckOverrides: overrides };
      }
      return {
        ...prev,
        customDecks: prev.customDecks.map((cd) =>
          cd.id === deck.id ? { ...cd, name: newName } : cd
        ),
      };
    });
  };

  const handleDeleteCurrentDeck = () => {
    persistAndSetState((prev) => {
      const deck = getActiveDeck(prev);
      if (deck.builtin) return prev;
      const remainingCustom = prev.customDecks.filter((cd) => cd.id !== deck.id);
      const nextDecks = { ...prev.decks };
      delete nextDecks[deck.id];
      const fallbackId = BUILTIN_DECKS[0].id;
      const nextState: AppStorageState = {
        ...prev,
        activeDeckId: fallbackId,
        customDecks: remainingCustom,
        decks: nextDecks,
      };
      const fallbackDeck = getActiveDeck(nextState);
      const ensured = ensureTodayRecord(
        getDeckProgress(nextState, fallbackId, today),
        fallbackDeck,
        today,
        nextState.dailySize
      );
      return {
        ...nextState,
        decks: {
          ...nextState.decks,
          [fallbackId]: ensured.progress,
        },
      };
    });
  };

  const handleImportDeckWords = (words: WordEntry[]) => {
    persistAndSetState((prev) => {
      const deck = getActiveDeck(prev);
      let nextState: AppStorageState;
      if (deck.builtin) {
        const overrides = { ...(prev.deckOverrides || {}) };
        overrides[deck.id] = { ...(overrides[deck.id] || {}), words };
        nextState = { ...prev, deckOverrides: overrides };
      } else {
        nextState = {
          ...prev,
          customDecks: prev.customDecks.map((cd) =>
            cd.id === deck.id ? { ...cd, words } : cd
          ),
        };
      }
      // Keep firstDate, daily history, globalCheckins; reset cursor & today's pending queue cleanly
      const updatedDeck = getActiveDeck(nextState);
      const prevProg = getDeckProgress(nextState, deck.id, today);
      const prevDaily = { ...prevProg.daily };
      delete prevDaily[today];
      const resetProg: DeckProgress = {
        ...prevProg,
        cursor: 0,
        daily: prevDaily,
      };
      const ensured = ensureTodayRecord(resetProg, updatedDeck, today, nextState.dailySize);
      return {
        ...nextState,
        decks: {
          ...nextState.decks,
          [deck.id]: ensured.progress,
        },
      };
    });
  };

  const handleExportCurrentDeck = () => {
    downloadJsonFile(`${activeDeck.name}-${today}.json`, {
      name: activeDeck.name,
      subtitle: activeDeck.subtitle,
      words: activeDeck.words,
    });
  };

  const handleRestoreBuiltinDecks = () => {
    persistAndSetState((prev) => {
      const next: AppStorageState = {
        ...prev,
        deckOverrides: undefined,
      };
      const deck = getActiveDeck(next);
      if (deck.builtin) {
        const prog = getDeckProgress(next, deck.id, today);
        const prevDaily = { ...prog.daily };
        delete prevDaily[today];
        const ensured = ensureTodayRecord(
          { ...prog, daily: prevDaily },
          deck,
          today,
          next.dailySize
        );
        return {
          ...next,
          decks: {
            ...next.decks,
            [deck.id]: ensured.progress,
          },
        };
      }
      return next;
    });
  };

  const handleAppendWordsToDeck = (newWords: WordEntry[]) => {
    persistAndSetState((prev) => {
      const deck = getActiveDeck(prev);
      const existingLower = new Set(deck.words.map((w) => w.word.toLowerCase()));
      const filteredNew = newWords.filter((w) => !existingLower.has(w.word.toLowerCase()));
      const mergedWords = [...deck.words, ...filteredNew];

      let nextState: AppStorageState;
      if (deck.builtin) {
        const overrides = { ...(prev.deckOverrides || {}) };
        overrides[deck.id] = { ...(overrides[deck.id] || {}), words: mergedWords };
        nextState = { ...prev, deckOverrides: overrides };
      } else {
        nextState = {
          ...prev,
          customDecks: prev.customDecks.map((cd) =>
            cd.id === deck.id ? { ...cd, words: mergedWords } : cd
          ),
        };
      }

      const updatedDeck = getActiveDeck(nextState);
      const prog = getDeckProgress(nextState, deck.id, today);
      const ensured = ensureTodayRecord(prog, updatedDeck, today, nextState.dailySize);
      return {
        ...nextState,
        decks: {
          ...nextState.decks,
          [deck.id]: ensured.progress,
        },
      };
    });
  };

  // WordListModal resolved entries
  const modalWords: WordEntry[] = useMemo(() => {
    if (wordModalMode === 'today') {
      return todayRecord.queue
        .map((q) => resolveWordEntry(q.word))
        .filter((w): w is WordEntry => Boolean(w));
    }
    if (wordModalMode === 'all') {
      return activeDeck.words;
    }
    return [];
  }, [wordModalMode, todayRecord.queue, activeDeck.words, resolveWordEntry]);

  // Study derived metrics
  const currentStudyItem = studyQueue[studyIndex];
  const requeuePendingCount = useMemo(() => {
    const remaining = studyQueue.slice(studyIndex);
    return remaining.filter((item) => item.isRequeued).length;
  }, [studyQueue, studyIndex]);
  const lastUndo = undoStack[undoStack.length - 1] || null;

  return (
    <div className="app-shell">
      {storageError && (
        <div
          role="alert"
          className="shrink-0 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] px-3.5 py-2 text-xs text-[#92400E] flex items-center justify-between gap-2"
        >
          <span>{storageError}</span>
          <SafeButton
            onClick={() => setStorageError(null)}
            className="text-xs font-semibold text-[#92400E] underline shrink-0"
          >
            知道了
          </SafeButton>
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen
          deck={activeDeck}
          dayNumber={dayNumber}
          streak={streak}
          dailySize={state.dailySize}
          today={today}
          todayRecord={todayRecord}
          wrongCount={wrongItems.length}
          learnedCount={ensuredProgress.learned.length}
          masteredCount={masteredCount}
          globalCheckins={state.globalCheckins}
          onChangeDailySize={handleChangeDailySize}
          onStartStudy={handleStartStudy}
          onReviewTodayWords={() => setWordModalMode('today')}
          onStartQuiz={startDailyQuiz}
          onOpenCheckin={() => show('checkin')}
          onOpenWrongBook={() => show('wrong')}
          onOpenAllWords={() => setWordModalMode('all')}
          onOpenDeckSwitcher={() => setDeckSwitcherOpen(true)}
          onOpenManageModal={() => setManageModalOpen(true)}
        />
      )}

      {screen === 'study' && currentStudyItem && (
        <StudyScreen
          item={currentStudyItem}
          masteredInSession={todayRecord.studiedWords.length}
          totalInSession={todayRecord.queue.length}
          requeuePendingCount={requeuePendingCount}
          maskEnabled={state.maskEnabled}
          srsRecord={ensuredProgress.srs[currentStudyItem.entry.word]}
          wrongRecord={ensuredProgress.wrong[currentStudyItem.entry.word]}
          lastPassedItem={lastUndo ? { word: lastUndo.word, meaning: lastUndo.meaning } : null}
          onToggleMask={handleToggleMask}
          onMarkUnknown={handleMarkUnknown}
          onConfirmKnown={handleConfirmKnown}
          onUndoLast={handleUndoLast}
          onBackHome={() => show('home')}
        />
      )}

      {screen === 'done' && (
        <DoneScreen
          todayCount={todayRecord.queue.length}
          unknownCount={todayRecord.unknownWords.length}
          onStartQuiz={startDailyQuiz}
          onBackHome={() => show('home')}
        />
      )}

      {screen === 'quiz' && quizQuestions.length > 0 && (
        <QuizScreen
          key={quizInitialIdx}
          questions={quizQuestions}
          initialQuestionIdx={quizInitialIdx}
          onFinishQuiz={handleFinishQuiz}
          onBackHome={() => show('home')}
        />
      )}

      {screen === 'result' && (
        <ResultScreen
          results={lastResults}
          isDailyQuiz={quizIsDaily}
          onGoCheckin={() => show('checkin')}
          onRetryWrong={(wrongWords) => startPracticeQuiz(wrongWords)}
          onBackHome={() => show('home')}
        />
      )}

      {screen === 'wrong' && (
        <WrongScreen
          items={wrongItems}
          onMarkMastered={handleMarkWrongMastered}
          onPracticeWrong={(words) => startPracticeQuiz(words)}
          onBackHome={() => show('home')}
        />
      )}

      {screen === 'checkin' && (
        <CheckinScreen
          deck={activeDeck}
          progress={ensuredProgress}
          today={today}
          streak={streak}
          nickname={state.nickname}
          dailySize={state.dailySize}
          globalCheckins={state.globalCheckins}
          onChangeNickname={handleChangeNickname}
          onBackHome={() => show('home')}
        />
      )}

      {wordModalMode && (
        <WordListModal
          title={
            wordModalMode === 'today'
              ? `今日词表（${modalWords.length} 个）`
              : `${activeDeck.name}（共 ${modalWords.length} 词）`
          }
          words={modalWords}
          onClose={() => setWordModalMode(null)}
        />
      )}

      {deckSwitcherOpen && (
        <DeckSwitcherModal
          decks={allDecks}
          activeDeckId={activeDeck.id}
          deckProgressMap={state.decks}
          today={today}
          onSelectDeck={handleSelectDeck}
          onClose={() => setDeckSwitcherOpen(false)}
        />
      )}

      {manageModalOpen && (
        <ManageModal
          state={state}
          activeDeck={activeDeck}
          today={today}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onResetAllProgress={handleResetAllProgress}
          onCreateBlankDeck={handleCreateBlankDeck}
          onRenameCurrentDeck={handleRenameCurrentDeck}
          onDeleteCurrentDeck={handleDeleteCurrentDeck}
          onImportDeckWords={handleImportDeckWords}
          onExportCurrentDeck={handleExportCurrentDeck}
          onRestoreBuiltinDecks={handleRestoreBuiltinDecks}
          onAppendWordsToDeck={handleAppendWordsToDeck}
          onClose={() => setManageModalOpen(false)}
        />
      )}
    </div>
  );
}
