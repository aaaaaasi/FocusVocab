'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Delete,
  HelpCircle,
  Keyboard,
  Volume2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SafeButton } from './SafeButton';
import { speakWord } from '../lib/speech';
import {
  evaluateSpelling,
  splitExampleWithTarget,
  type SpellingDiffChar,
} from '../lib/vocab-engine';
import type { QuizQuestion } from '../lib/types';

interface QuizScreenProps {
  questions: QuizQuestion[];
  initialQuestionIdx?: number;
  onFinishQuiz: (results: { word: string; isCorrect: boolean }[]) => void;
  onBackHome: () => void;
}

export function QuizScreen({
  questions,
  initialQuestionIdx = 0,
  onFinishQuiz,
  onBackHome,
}: QuizScreenProps) {
  const [currentIdx, setCurrentIdx] = useState(initialQuestionIdx);
  const [outcomes, setOutcomes] = useState<{ word: string; isCorrect: boolean }[]>([]);

  const q = questions[currentIdx];
  if (!q) return null;

  const handleAdvance = (isCorrectForScore: boolean) => {
    const nextOutcomes = [...outcomes, { word: q.word.word, isCorrect: isCorrectForScore }];
    if (currentIdx + 1 >= questions.length) {
      onFinishQuiz(nextOutcomes);
    } else {
      setOutcomes(nextOutcomes);
      setCurrentIdx((i) => i + 1);
    }
  };

  return (
    <QuizQuestionInner
      key={`${currentIdx}-${q.word.word}`}
      q={q}
      currentIdx={currentIdx}
      total={questions.length}
      onAdvance={handleAdvance}
      onBackHome={onBackHome}
    />
  );
}

interface QuizQuestionInnerProps {
  q: QuizQuestion;
  currentIdx: number;
  total: number;
  onAdvance: (isCorrectForScore: boolean) => void;
  onBackHome: () => void;
}

function QuizQuestionInner({
  q,
  currentIdx,
  total,
  onAdvance,
  onBackHome,
}: QuizQuestionInnerProps) {
  // Choice state
  const [chosenLabel, setChosenLabel] = useState<string | null>(null);

  // Spell state
  const [spellInput, setSpellInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [spellState, setSpellState] = useState<'idle' | 'needs_retype' | 'passed'>('idle');
  const [spellDiff, setSpellDiff] = useState<SpellingDiffChar[] | null>(null);
  const [spellErrorHints, setSpellErrorHints] = useState<string[]>([]);
  const [spellExtraChars, setSpellExtraChars] = useState('');
  const [lastWrongAttempt, setLastWrongAttempt] = useState('');
  const [hadSpellErrorThisQ, setHadSpellErrorThisQ] = useState(false);
  const [slotFocused, setSlotFocused] = useState(true);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const targetWord = q.word.word;
  const targetClean = targetWord.trim();

  useEffect(() => {
    speakWord(targetWord);
    if (q.type === 'spell') {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [targetWord, q.type]);

  const progressPct = Math.round(
    ((currentIdx + (chosenLabel || spellState === 'passed' ? 1 : 0)) / total) * 100
  );

  const handleSelectChoice = (label: string) => {
    if (chosenLabel !== null) return;
    setChosenLabel(label);
  };

  const handleConfirmChoiceNext = () => {
    if (chosenLabel === null || !q.options) return;
    const picked = q.options.find((o) => o.label === chosenLabel);
    onAdvance(Boolean(picked?.isCorrect));
  };

  const handleSubmitSpell = () => {
    if (spellState === 'passed') {
      onAdvance(!hadSpellErrorThisQ);
      return;
    }
    const evalRes = evaluateSpelling(spellInput, targetWord);
    if (evalRes.isMatch) {
      setSpellState('passed');
      setSpellDiff(null);
      setSpellErrorHints([]);
      setSpellExtraChars('');
      if (hadSpellErrorThisQ) {
        onAdvance(false);
      }
    } else {
      setHadSpellErrorThisQ(true);
      setSpellState('needs_retype');
      setSpellDiff(evalRes.diff);
      setSpellErrorHints(evalRes.errorHints);
      setSpellExtraChars(evalRes.extraChars);
      setLastWrongAttempt(evalRes.normalizedAttempt || '（空）');
      setShowHint(true);
      setSpellInput('');
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput = target && target.tagName === 'INPUT';

      if (e.code === 'Space' && !inInput) {
        e.preventDefault();
        speakWord(targetWord);
        return;
      }

      if (q.type === 'choice' && q.options) {
        const keyMap: Record<string, string> = {
          a: 'A',
          b: 'B',
          c: 'C',
          d: 'D',
          '1': 'A',
          '2': 'B',
          '3': 'C',
          '4': 'D',
        };
        const mapped = keyMap[e.key.toLowerCase()];
        if (mapped && chosenLabel === null) {
          e.preventDefault();
          handleSelectChoice(mapped);
          return;
        }
        if ((e.key === 'Enter' || e.key === 'ArrowRight') && chosenLabel !== null) {
          e.preventDefault();
          handleConfirmChoiceNext();
        }
      } else if (q.type === 'spell' && !inInput && spellState !== 'passed') {
        if (/^[a-zA-Z-]$/.test(e.key) || e.key === 'Backspace') {
          inputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const exampleParts = splitExampleWithTarget(q.word.example, targetWord);
  const choiceAnswered = chosenLabel !== null;

  // Live retype matching metrics
  const normalizedTyped = spellInput.trim().toLowerCase();
  const targetChars = targetClean.split('');
  const overflowTyped =
    normalizedTyped.length > targetChars.length
      ? normalizedTyped.slice(targetChars.length).split('')
      : [];
  const activeSlotIndex = Math.min(normalizedTyped.length, targetChars.length - 1);

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between gap-2.5 sm:gap-3">
      {/* Top Progress */}
      <header className="flex items-center justify-between gap-3 shrink-0">
        <SafeButton
          onClick={onBackHome}
          aria-label="返回首页"
          className="btn-secondary min-w-[44px] min-h-[44px] px-3 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">返回</span>
        </SafeButton>

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-[#6B7385] tabular-nums">
            <span>
              小测第 <strong className="text-[#14161F]">{currentIdx + 1}</strong> / {total} 题 ·{' '}
              {q.type === 'choice' ? '看词选义' : '听音拼写'}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#EAF3FF] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150 ease-out"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #2B7BF5 0%, #38BDF8 100%)',
              }}
            />
          </div>
        </div>
      </header>

      {/* Question Card */}
      <main className="surface-card flex-1 min-h-0 p-4 sm:p-6 flex flex-col justify-between gap-3 overflow-hidden">
        {q.type === 'choice' && q.options ? (
          <>
            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-[clamp(26px,4.5vw,38px)] font-bold text-[#14161F] leading-tight break-all">
                    {targetWord}
                  </h1>
                  <div className="mt-0.5 flex items-center gap-2 text-xs sm:text-sm text-[#6B7385]">
                    <span className="font-mono">{q.word.phonetic}</span>
                    <span>·</span>
                    <span className="font-semibold text-[#1E80FF]">{q.word.pos}</span>
                  </div>
                </div>
                <SafeButton
                  onClick={() => speakWord(targetWord)}
                  skipDebounce
                  aria-label="播放发音"
                  className="min-w-[44px] min-h-[44px] rounded-full bg-[#F3F8FF] hover:bg-[#EAF3FF] border border-[#E6EEF8] text-[#1E80FF] flex items-center justify-center gap-1.5 px-3 shrink-0"
                >
                  <Volume2 className="w-5 h-5" />
                  <kbd className="kbd-hint">Space</kbd>
                </SafeButton>
              </div>

              {/* Cloze Context Sentence */}
              <div className="pt-2 border-t border-[#E6EEF8]">
                <p className="text-xs sm:text-sm text-[#6B7385] leading-relaxed line-clamp-2">
                  {exampleParts.map((part, idx) =>
                    part.isTarget ? (
                      choiceAnswered ? (
                        <mark key={idx} className="word-hl">
                          {part.text}
                        </mark>
                      ) : (
                        <span
                          key={idx}
                          className="inline-block min-w-[54px] border-b-2 border-[#1E80FF] text-center text-[#1E80FF] font-mono mx-0.5"
                        >
                          ____
                        </span>
                      )
                    ) : (
                      <React.Fragment key={idx}>{part.text}</React.Fragment>
                    )
                  )}
                </p>
              </div>
            </div>

            {/* 4 Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-auto">
              {q.options.map((opt) => {
                const isPicked = chosenLabel === opt.label;
                let stateClass =
                  'bg-white border-[#E6EEF8] text-[#14161F] hover:border-[#1E80FF] hover:bg-[#F8FBFF]';
                let statusIcon: React.ReactNode = null;

                if (choiceAnswered) {
                  if (opt.isCorrect) {
                    stateClass = 'bg-[#ECFDF5] border-[#12A672] text-[#0E7B54]';
                    statusIcon = (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#12A672] shrink-0">
                        <Check className="w-4 h-4" />
                        正确
                      </span>
                    );
                  } else if (isPicked && !opt.isCorrect) {
                    stateClass = 'bg-[#FEF2F2] border-[#E5484D] text-[#B91C1C]';
                    statusIcon = (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E5484D] shrink-0">
                        <X className="w-4 h-4" />
                        错
                      </span>
                    );
                  } else {
                    stateClass = 'bg-[#F8FAFC] border-[#E6EEF8] text-[#9AA3B2] opacity-75';
                  }
                }

                return (
                  <SafeButton
                    key={opt.label}
                    onClick={() => handleSelectChoice(opt.label)}
                    disabled={choiceAnswered}
                    className={`min-h-[52px] px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors ${stateClass}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-[#F3F8FF] text-[#1E80FF] text-xs font-bold flex items-center justify-center shrink-0">
                        {opt.label}
                      </span>
                      <span className="text-sm font-medium leading-snug line-clamp-2">
                        <span className="text-[#1E80FF] font-semibold mr-1.5">{q.word.pos}</span>
                        {opt.meaning}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {statusIcon}
                      <kbd className="kbd-hint shrink-0">{opt.label}</kbd>
                    </div>
                  </SafeButton>
                );
              })}
            </div>

            {/* Bottom Next Step */}
            <div className="shrink-0 flex items-center justify-between gap-3 pt-1">
              <span className="text-xs text-[#6B7385] truncate">
                {choiceAnswered ? q.word.exampleZh : '选择最匹配的中文释义'}
              </span>
              {choiceAnswered && (
                <SafeButton
                  onClick={handleConfirmChoiceNext}
                  className="btn-primary min-h-[44px] px-5 py-2 text-sm font-semibold flex items-center gap-1.5 shrink-0"
                >
                  <span>{currentIdx + 1 >= total ? '查看成绩' : '下一题'}</span>
                  <ArrowRight className="w-4 h-4" />
                </SafeButton>
              )}
            </div>
          </>
        ) : (
          /* Spelling Question — Interactive Letter Slots Replacing Traditional Input Box */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitSpell();
            }}
            className="flex flex-col flex-1 min-h-0 justify-between gap-2.5"
          >
            {/* Top Audio & Hint Bar */}
            <div className="flex flex-col items-center text-center gap-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <SafeButton
                  onClick={() => speakWord(targetWord)}
                  skipDebounce
                  className="min-h-[44px] px-4 py-2 rounded-full bg-[#F3F8FF] hover:bg-[#EAF3FF] border border-[#E6EEF8] text-[#1E80FF] font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>点击听发音</span>
                  <kbd className="kbd-hint">Space</kbd>
                </SafeButton>
                <SafeButton
                  onClick={() => setShowHint((v) => !v)}
                  className="btn-secondary min-h-[44px] px-3.5 py-2 text-xs font-medium flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? '隐藏中文' : '看中文提示'}</span>
                </SafeButton>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <p className="text-sm sm:text-base font-semibold text-[#14161F]">
                  <span className="text-[#1E80FF] mr-1.5">{q.word.pos}</span>
                  {q.word.meaning}
                </p>
                <p className="text-xs text-[#6B7385] tabular-nums">
                  首字母 <strong className="text-[#14161F]">{targetClean.charAt(0)}</strong> · 共{' '}
                  {targetClean.length} 个字母槽位
                  {showHint ? ` · ${q.word.phonetic}` : ' · 直接敲击键盘输入'}
                </p>
              </div>
            </div>

            {/* Interactive Letter Slots Surface (replaces standalone input box) */}
            <div
              onClick={() => inputRef.current?.focus()}
              data-testid="letter-slots-input"
              className={`relative rounded-2xl border px-3 py-4 sm:px-5 sm:py-5 my-auto flex flex-col items-center justify-center gap-2.5 cursor-text transition-colors ${
                spellState === 'passed'
                  ? 'bg-[#ECFDF5]/60 border-[#12A672]'
                  : spellState === 'needs_retype'
                  ? 'bg-[#FFFBFB] border-[#F6D0D2]'
                  : slotFocused
                  ? 'bg-[#F8FBFF] border-[#1E80FF] shadow-[0_0_0_3px_rgba(30,128,255,0.10)]'
                  : 'bg-[#F8FBFF] border-[#DCE5F2]'
              }`}
            >
              {/* Hidden native input capturing keystrokes with anti-cheat attributes */}
              <input
                ref={inputRef}
                type="text"
                value={spellInput}
                onChange={(e) => setSpellInput(e.target.value)}
                onFocus={() => setSlotFocused(true)}
                onBlur={() => setSlotFocused(false)}
                disabled={spellState === 'passed'}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-label="拼写输入框"
                placeholder={
                  spellState === 'needs_retype'
                    ? `请再敲一遍 ${targetClean} 并回车`
                    : '输入完整英文单词，按回车提交'
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-text"
              />

              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                {targetChars.map((ch, i) => {
                  const typed = normalizedTyped[i] || '';
                  const expectedLower = ch.toLowerCase();
                  const isCurrentCaret =
                    slotFocused && spellState !== 'passed' && i === activeSlotIndex && !typed;
                  const isFirstHint = i === 0 && !typed && spellState === 'idle';
                  const isRetypeGhost = !typed && spellState === 'needs_retype';
                  const isRetypeMatch =
                    Boolean(typed) &&
                    spellState === 'needs_retype' &&
                    typed === expectedLower;
                  const isRetypeMismatch =
                    Boolean(typed) &&
                    spellState === 'needs_retype' &&
                    typed !== expectedLower;
                  const extraGap = i > 0 && i % 4 === 0 ? 'ml-1.5 sm:ml-2' : '';

                  if (ch === '-' || ch === ' ') {
                    return (
                      <span key={i} className="w-3 text-center font-bold text-[#9AA3B2]">
                        {ch}
                      </span>
                    );
                  }

                  let slotStyle = 'border-[#DCE5F2] bg-white text-transparent';
                  if (spellState === 'passed') {
                    slotStyle = 'border-[#12A672] bg-[#ECFDF5] text-[#12A672]';
                  } else if (isRetypeMatch) {
                    slotStyle = 'border-[#12A672] bg-[#ECFDF5] text-[#0E7B54]';
                  } else if (isRetypeMismatch) {
                    slotStyle = 'border-[#E5484D] bg-[#FEF2F2] text-[#E5484D] underline decoration-2';
                  } else if (typed) {
                    slotStyle = 'border-[#1E80FF] bg-white text-[#14161F]';
                  } else if (isCurrentCaret) {
                    slotStyle =
                      'border-[#1E80FF] bg-white text-[#9AA3B2] ring-2 ring-[#1E80FF]/25';
                  } else if (isRetypeGhost) {
                    slotStyle = 'border-[#F6D0D2] bg-white/90 text-[#E5484D]/35';
                  } else if (isFirstHint) {
                    slotStyle = 'border-[#C7DAF5] bg-white text-[#9AA3B2]';
                  }

                  return (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{
                        scale: typed ? 1.03 : 1,
                      }}
                      transition={{ duration: 0.1 }}
                      className={`w-8 sm:w-9 h-10 sm:h-11 rounded-lg border-b-2 border flex flex-col items-center justify-center font-mono select-none transition-colors ${extraGap} ${slotStyle}`}
                    >
                      <span className="text-base sm:text-xl font-bold leading-none">
                        {typed
                          ? typed
                          : isRetypeGhost
                          ? ch
                          : isFirstHint
                          ? ch
                          : isCurrentCaret
                          ? '|'
                          : '_'}
                      </span>
                      <span className="text-[9px] text-[#9AA3B2] leading-none mt-1 tabular-nums">
                        {i + 1}
                      </span>
                    </motion.div>
                  );
                })}

                {/* Overflow extra typed characters */}
                {overflowTyped.map((exCh, exIdx) => (
                  <div
                    key={`extra-${exIdx}`}
                    className="w-8 sm:w-9 h-10 sm:h-11 rounded-lg border border-[#E5484D] bg-[#FEF2F2] text-[#E5484D] flex flex-col items-center justify-center font-mono select-none"
                    title="多输的字符"
                  >
                    <span className="text-base sm:text-xl font-bold leading-none line-through">
                      {exCh}
                    </span>
                    <span className="text-[9px] leading-none mt-1">多输</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#6B7385] tabular-nums">
                <Keyboard className="w-3.5 h-3.5 text-[#1E80FF]" />
                <span>
                  {spellState === 'needs_retype'
                    ? `请对照浅红字母槽逐字跟敲 "${targetClean}"（已匹配 ${
                        targetChars.filter(
                          (c, idx) => normalizedTyped[idx] === c.toLowerCase()
                        ).length
                      }/${targetChars.length}）`
                    : `已输入 ${normalizedTyped.length} / ${targetChars.length} 个字母 · 点击槽位可直接键入`}
                </span>
              </div>
            </div>

            {/* Character-level Diff Feedback & Error Hints when spelling wrong */}
            <AnimatePresence mode="wait">
              {spellState === 'needs_retype' && spellDiff && (
                <motion.div
                  key="diff-box"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  data-testid="spelling-diff-panel"
                  className="rounded-xl bg-[#FEF2F2] border border-[#F6D0D2] px-3.5 py-2.5 flex flex-col items-center gap-1.5 text-center shrink-0"
                >
                  {/* Character-by-character comparison row */}
                  <div className="flex flex-wrap items-center justify-center gap-1 font-mono text-xs sm:text-sm">
                    <span className="text-[11px] font-sans font-semibold text-[#6B7385] mr-1">
                      逐字比对（上次输入 {lastWrongAttempt}）：
                    </span>
                    {spellDiff.map((cell) => (
                      <span
                        key={cell.index}
                        className={`inline-flex flex-col items-center px-1.5 py-0.5 rounded border ${
                          cell.status === 'correct'
                            ? 'text-[#0E7B54] bg-[#ECFDF5] border-[#A7F3D0]'
                            : 'text-[#B91C1C] bg-white border-[#F6D0D2]'
                        }`}
                        title={
                          cell.status === 'correct'
                            ? `第 ${cell.index + 1} 位正确`
                            : cell.status === 'missing'
                            ? `第 ${cell.index + 1} 位缺失，应为 ${cell.expected}`
                            : `第 ${cell.index + 1} 位应为 ${cell.expected}，误输为 ${cell.actual}`
                        }
                      >
                        <strong className="font-bold leading-tight">{cell.expected}</strong>
                        <span className="text-[10px] leading-tight opacity-85">
                          {cell.status === 'correct'
                            ? '✓'
                            : cell.status === 'missing'
                            ? '漏'
                            : `误:${cell.actual}`}
                        </span>
                      </span>
                    ))}
                    {spellExtraChars && (
                      <span className="inline-flex flex-col items-center px-1.5 py-0.5 rounded border border-[#F6D0D2] bg-white text-[#B91C1C]">
                        <strong className="font-bold leading-tight line-through">
                          {spellExtraChars}
                        </strong>
                        <span className="text-[10px] leading-tight">多输</span>
                      </span>
                    )}
                  </div>

                  {/* Character-level specific error hints */}
                  {spellErrorHints.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-[#B91C1C] font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#E5484D]" />
                      <span>
                        字符级纠错：{spellErrorHints.slice(0, 3).join(' · ')}
                        {spellErrorHints.length > 3 ? ` 等 ${spellErrorHints.length} 处` : ''}
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] sm:text-xs text-[#991B1B] font-semibold">
                    强制跟敲闭环：请对照上方字母槽把正确拼写 {targetClean} 亲手敲对一遍并按回车继续
                  </p>
                </motion.div>
              )}

              {spellState === 'passed' && !hadSpellErrorThisQ && (
                <motion.div
                  key="pass-box"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] px-3.5 py-2 text-center text-xs sm:text-sm font-semibold text-[#12A672] shrink-0"
                >
                  拼写正确 · {targetClean}（{q.word.pos} {q.word.meaning}）
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Action Bar for Letter Slots */}
            <div className="flex items-center justify-between gap-2.5 shrink-0">
              <SafeButton
                onClick={() => {
                  setSpellInput('');
                  inputRef.current?.focus();
                }}
                disabled={!spellInput || spellState === 'passed'}
                className="btn-secondary min-h-[44px] px-3.5 py-2 text-xs font-medium flex items-center gap-1.5 shrink-0"
              >
                <Delete className="w-3.5 h-3.5" />
                <span>清空重输</span>
              </SafeButton>

              <SafeButton
                onClick={handleSubmitSpell}
                className="btn-primary flex-1 max-w-[260px] min-h-[44px] px-5 py-2 text-sm font-semibold shrink-0 whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                <span>
                  {spellState === 'passed'
                    ? currentIdx + 1 >= total
                      ? '查看成绩'
                      : '下一题'
                    : spellState === 'needs_retype'
                    ? '跟敲完成 · 提交验证'
                    : '提交拼写'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </SafeButton>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
