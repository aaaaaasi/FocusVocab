'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, RotateCcw, Sparkles, Unlock, Volume2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SafeButton } from './SafeButton';
import { speakWord } from '../lib/speech';
import { SRS_INTERVALS, splitExampleWithTarget } from '../lib/vocab-engine';
import type { SrsRecord, WordEntry, WrongRecord } from '../lib/types';

export interface ActiveStudyItem {
  entry: WordEntry;
  kind: 'new' | 'review';
  isRequeued: boolean;
}

interface StudyScreenProps {
  item: ActiveStudyItem;
  masteredInSession: number;
  totalInSession: number;
  requeuePendingCount: number;
  maskEnabled: boolean;
  srsRecord?: SrsRecord;
  wrongRecord?: WrongRecord;
  lastPassedItem: { word: string; meaning: string } | null;
  onToggleMask: () => void;
  onMarkUnknown: (word: string) => void;
  onConfirmKnown: (word: string) => void;
  onUndoLast: () => void;
  onBackHome: () => void;
}

type MnemonicTab = 'memo' | 'collocations' | 'family' | 'confusable';

const MNEMONIC_TABS: { key: MnemonicTab; label: string }[] = [
  { key: 'memo', label: '怎么记' },
  { key: 'collocations', label: '常用搭配' },
  { key: 'family', label: '同族派生' },
  { key: 'confusable', label: '易错辨析' },
];

export function StudyScreen(props: StudyScreenProps) {
  const wordKey = `${props.item.entry.word}::${props.item.isRequeued ? 'rq' : 'init'}::${props.masteredInSession}`;
  return <StudyCardInner key={wordKey} {...props} />;
}

function StudyCardInner({
  item,
  masteredInSession,
  totalInSession,
  requeuePendingCount,
  maskEnabled,
  srsRecord,
  wrongRecord,
  lastPassedItem,
  onToggleMask,
  onMarkUnknown,
  onConfirmKnown,
  onUndoLast,
  onBackHome,
}: StudyScreenProps) {
  const [manualRevealed, setManualRevealed] = useState(false);
  const [exampleWordRevealed, setExampleWordRevealed] = useState(false);
  const [unknownMode, setUnknownMode] = useState(false);
  const [mobileTab, setMobileTab] = useState<MnemonicTab>('memo');
  const [isAdvancing, setIsAdvancing] = useState(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revealed = !maskEnabled || manualRevealed || unknownMode;
  const isExampleHighlightRevealed = !maskEnabled || revealed || exampleWordRevealed;

  useEffect(() => {
    speakWord(item.entry.word);
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, [item.entry.word]);

  const handleReveal = () => {
    setManualRevealed(true);
    setExampleWordRevealed(true);
  };

  const handleRevealExampleWord = () => {
    if (!isExampleHighlightRevealed) {
      setExampleWordRevealed(true);
      speakWord(item.entry.word);
    } else {
      speakWord(item.entry.word);
    }
  };

  const handleUnknown = () => {
    if (isAdvancing || unknownMode) return;
    setManualRevealed(true);
    setExampleWordRevealed(true);
    setUnknownMode(true);
    onMarkUnknown(item.entry.word);
  };

  const handleKnown = () => {
    if (isAdvancing) return;
    if (unknownMode) {
      // Already marked unknown & read explanation -> advance to next
      onConfirmKnown(item.entry.word);
      return;
    }
    if (maskEnabled && !revealed) {
      // Flash reveal briefly so student verifies meaning before advancing
      setManualRevealed(true);
      setExampleWordRevealed(true);
      setIsAdvancing(true);
      advanceTimerRef.current = setTimeout(() => {
        setIsAdvancing(false);
        onConfirmKnown(item.entry.word);
      }, 280);
      return;
    }
    onConfirmKnown(item.entry.word);
  };

  // Global keyboard controls on Study Screen
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        speakWord(item.entry.word);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleReveal();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleUnknown();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleKnown();
      } else if (e.key === 'Backspace' && lastPassedItem && !isAdvancing) {
        e.preventDefault();
        onUndoLast();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const exampleParts = splitExampleWithTarget(item.entry.example, item.entry.word);
  const progressPct = totalInSession > 0 ? Math.min(100, Math.round((masteredInSession / totalInSession) * 100)) : 0;

  // 5-stage SRS dots
  const streakLevel = wrongRecord ? wrongRecord.streak : srsRecord ? srsRecord.streak : 0;
  const stageIdx = Math.min(4, Math.max(0, streakLevel));
  const srsLabel =
    streakLevel > 0 || wrongRecord
      ? `第 ${stageIdx + 1} 档 · ${SRS_INTERVALS[stageIdx]} 天后复习`
      : '首轮记忆 · 未入复习曲线';

  const statusTagText = item.isRequeued
    ? '重现巩固'
    : item.kind === 'review'
    ? '记忆复习'
    : '新词';

  const activeMnemonicContent =
    mobileTab === 'memo'
      ? item.entry.memo
      : mobileTab === 'collocations'
      ? item.entry.collocations
      : mobileTab === 'family'
      ? item.entry.family
      : item.entry.confusable;

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between gap-2.5 sm:gap-3">
      {/* Top Progress Bar */}
      <header className="flex items-center justify-between gap-2 shrink-0">
        <SafeButton
          onClick={onBackHome}
          aria-label="返回首页"
          className="btn-secondary min-w-[44px] min-h-[44px] px-3 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">返回</span>
        </SafeButton>

        <div className="flex-1 min-w-0 flex flex-col gap-1 px-1">
          <div className="flex items-center justify-between text-xs text-[#6B7385] tabular-nums">
            <span>
              第 <strong className="text-[#14161F]">{Math.min(totalInSession, masteredInSession + 1)}</strong> / {totalInSession} 个 · 已掌握{' '}
              <strong className="text-[#14161F]">{masteredInSession}</strong>
              {requeuePendingCount > 0 ? ` · 待重现 ${requeuePendingCount}` : ''}
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

        <SafeButton
          onClick={onToggleMask}
          aria-pressed={maskEnabled}
          className="btn-secondary min-h-[44px] px-3 flex items-center gap-1.5 text-xs font-medium shrink-0 whitespace-nowrap"
        >
          {maskEnabled ? <EyeOff className="w-3.5 h-3.5 text-[#1E80FF]" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{maskEnabled ? '遮罩自测：开' : '遮罩自测：关'}</span>
        </SafeButton>
      </header>

      {/* Main Flashcard */}
      <main className="surface-card flex-1 min-h-0 flex flex-col min-[900px]:grid min-[900px]:grid-cols-[1.25fr_1fr] overflow-hidden">
        {/* Left / Top Word & Context Pane */}
        <div className="p-4 sm:p-6 flex flex-col justify-between gap-2 min-h-0 flex-1">
          {/* Status + SRS 5 dots */}
          <div className="flex items-center justify-between gap-2 text-xs shrink-0">
            <span
              className={`font-semibold ${
                item.isRequeued
                  ? 'text-[#D97706]'
                  : item.kind === 'review'
                  ? 'text-[#12A672]'
                  : 'text-[#1E80FF]'
              }`}
            >
              {statusTagText}
            </span>

            <div className="flex items-center gap-2 text-[#6B7385] tabular-nums">
              <span className="flex items-center gap-1" aria-label={srsLabel}>
                {[0, 1, 2, 3, 4].map((dot) => (
                  <span
                    key={dot}
                    className={`w-1.5 h-1.5 rounded-full ${
                      dot < streakLevel ? 'bg-[#1E80FF]' : 'bg-[#DCE5F2]'
                    }`}
                  />
                ))}
              </span>
              <span className="text-[11px]">{srsLabel}</span>
            </div>
          </div>

          {/* Word + Audio + Phonetic + Example + Blurred Chinese Meaning */}
          <div className="flex flex-col gap-1.5 sm:gap-2 my-auto">
            <div className="flex items-center justify-between gap-3">
              <SafeButton
                onClick={() => speakWord(item.entry.word)}
                skipDebounce
                className="text-left min-w-0 min-h-[44px] flex items-center cursor-pointer bg-transparent border-0 p-0"
                aria-label={`朗读单词 ${item.entry.word}`}
              >
                <span className="text-[clamp(28px,5vw,44px)] font-bold tracking-tight text-[#14161F] leading-none break-all">
                  {item.entry.word}
                </span>
              </SafeButton>

              <SafeButton
                onClick={() => speakWord(item.entry.word)}
                skipDebounce
                aria-label="播放美式发音"
                className="min-w-[44px] min-h-[44px] rounded-full bg-[#F3F8FF] hover:bg-[#EAF3FF] border border-[#E6EEF8] text-[#1E80FF] flex items-center justify-center gap-1.5 px-3 shrink-0 transition-colors"
              >
                <Volume2 className="w-5 h-5" />
                <kbd className="kbd-hint">Space</kbd>
              </SafeButton>
            </div>

            <div className="flex items-center gap-2.5 text-sm sm:text-base text-[#6B7385]">
              <span className="font-mono">{item.entry.phonetic}</span>
              <span className="text-[#DCE5F2]" aria-hidden="true">|</span>
              <span className="font-semibold text-[#1E80FF]">{item.entry.pos}</span>
            </div>

            {/* Interactive English Context Example with Click-to-Reveal Highlighted Word */}
            <div className="pt-1.5 sm:pt-2 border-t border-[#E6EEF8]">
              <div
                data-testid="example-sentence-reveal"
                role="button"
                tabIndex={0}
                aria-label={
                  isExampleHighlightRevealed
                    ? '英文例句（高亮词汇已揭开，点击朗读）'
                    : '点击英文例句即时揭开高亮词汇'
                }
                onClick={handleRevealExampleWord}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRevealExampleWord();
                  }
                }}
                className="group rounded-xl px-2.5 py-1.5 -mx-2.5 hover:bg-[#F3F8FF]/80 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[11px] font-medium text-[#6B7385] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#1E80FF]" />
                    <span>语境原声例句</span>
                  </span>
                  <span
                    data-testid="example-reveal-status"
                    className={`text-[11px] font-medium transition-colors ${
                      isExampleHighlightRevealed
                        ? 'text-[#12A672]'
                        : 'text-[#1E80FF] group-hover:underline'
                    }`}
                  >
                    {isExampleHighlightRevealed
                      ? '高亮词汇已揭开 · 点击重听'
                      : '点击例句即时揭开高亮词汇'}
                  </span>
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-[#14161F] line-clamp-2">
                  {exampleParts.map((part, idx) =>
                    part.isTarget ? (
                      <motion.mark
                        key={idx}
                        data-testid="example-target-mark"
                        data-revealed={isExampleHighlightRevealed ? 'true' : 'false'}
                        initial={false}
                        animate={
                          isExampleHighlightRevealed
                            ? {
                                filter: 'blur(0px)',
                                scale: 1,
                                backgroundColor: '#DCEBFF',
                                color: '#1E80FF',
                              }
                            : {
                                filter: 'blur(5px)',
                                scale: 0.96,
                                backgroundColor: '#DCEBFF',
                                color: '#1E80FF',
                              }
                        }
                        transition={{ duration: 0.24, ease: 'easeOut' }}
                        className="word-hl inline-block mx-0.5 cursor-pointer"
                      >
                        {part.text}
                      </motion.mark>
                    ) : (
                      <React.Fragment key={idx}>{part.text}</React.Fragment>
                    )
                  )}
                </p>
              </div>
            </div>

            {/* Default Completely Blurred Chinese Meaning + Click-to-Unlock Interactive Animation */}
            <div className="pt-1.5 sm:pt-2 border-t border-[#E6EEF8]">
              <div
                data-testid="meaning-blur-container"
                data-unlocked={revealed ? 'true' : 'false'}
                className="relative rounded-xl overflow-hidden min-h-[54px] px-3 py-2 bg-[#F8FBFF] border border-[#E6EEF8]"
              >
                <motion.div
                  data-testid="meaning-blur-content"
                  initial={false}
                  animate={
                    revealed
                      ? {
                          filter: 'blur(0px)',
                          opacity: 1,
                          scale: 1,
                          y: 0,
                        }
                      : {
                          filter: 'blur(9px)',
                          opacity: 0.45,
                          scale: 0.985,
                          y: 1,
                        }
                  }
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex flex-col gap-0.5 ${
                    revealed ? '' : 'select-none pointer-events-none'
                  }`}
                >
                  <p className="text-base sm:text-lg font-bold text-[#14161F]">
                    <span className="text-[#1E80FF] mr-1.5 font-semibold">{item.entry.pos}</span>
                    {item.entry.meaning}
                  </p>
                  <p className="text-xs sm:text-[13px] text-[#6B7385] line-clamp-1">
                    {item.entry.exampleZh}
                  </p>
                </motion.div>

                <AnimatePresence initial={false}>
                  {!revealed && (
                    <motion.button
                      key="meaning-unlock-overlay"
                      type="button"
                      data-testid="unlock-meaning-btn"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 1.04,
                        filter: 'blur(6px)',
                      }}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.24, ease: 'easeOut' }}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        handleReveal();
                      }}
                      className="absolute inset-0 w-full h-full px-3 py-2 rounded-xl bg-[#F3F8FF]/78 hover:bg-[#EAF3FF]/88 backdrop-blur-[5px] border border-dashed border-[#B8D4F8] flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-white border border-[#DCE5F2] text-[#1E80FF] flex items-center justify-center shrink-0 shadow-2xs">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-[#14161F] truncate">
                          点击解锁中文释义与助记 · 先在脑中回想再判分
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-semibold text-[#1E80FF] hidden sm:inline">
                          点击解锁
                        </span>
                        <kbd className="kbd-hint">↓</kbd>
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile Compact 4-Dimension Tabs (only visible < 900px) */}
          <div className="min-[900px]:hidden pt-2 border-t border-[#E6EEF8] shrink-0">
            <div className="relative rounded-lg overflow-hidden">
              <motion.div
                initial={false}
                animate={
                  revealed
                    ? { filter: 'blur(0px)', opacity: 1 }
                    : { filter: 'blur(7px)', opacity: 0.45 }
                }
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className={`flex flex-col gap-1.5 ${
                  revealed ? '' : 'select-none pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-1 border-b border-[#E6EEF8] pb-1.5">
                  {MNEMONIC_TABS.map((t) => (
                    <SafeButton
                      key={t.key}
                      onClick={() => setMobileTab(t.key)}
                      className={`flex-1 min-w-0 py-1 px-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors ${
                        mobileTab === t.key
                          ? 'bg-[#EAF3FF] text-[#1E80FF] font-semibold'
                          : 'text-[#6B7385]'
                      }`}
                    >
                      {t.label}
                    </SafeButton>
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-[#14161F] line-clamp-2 min-h-[34px]">
                  {activeMnemonicContent}
                </p>
              </motion.div>

              <AnimatePresence initial={false}>
                {!revealed && (
                  <motion.button
                    key="mobile-mnemonic-mask"
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.03 }}
                    transition={{ duration: 0.22 }}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      handleReveal();
                    }}
                    className="absolute inset-0 w-full h-full flex items-center justify-center gap-1.5 text-xs text-[#6B7385] bg-[#F8FBFF]/75 backdrop-blur-[4px] cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5 text-[#1E80FF]" />
                    <span>解锁释义后同步展开构词助记与真题搭配</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Desktop Right Column: 4-Dimension Mnemonics separated by 1px hairlines */}
        <aside
          aria-label="四维助记拆解"
          className="hidden min-[900px]:flex flex-col justify-center border-l border-[#E6EEF8] bg-[#F8FBFF]/60 p-5 relative overflow-hidden"
        >
          <motion.div
            initial={false}
            animate={
              revealed
                ? { filter: 'blur(0px)', opacity: 1, scale: 1 }
                : { filter: 'blur(9px)', opacity: 0.4, scale: 0.985 }
            }
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={`flex flex-col divide-y divide-[#E6EEF8] ${
              revealed ? '' : 'select-none pointer-events-none'
            }`}
          >
            <div className="pb-3">
              <div className="text-[11px] font-semibold text-[#1E80FF] mb-1">怎么记 · 词根拆解</div>
              <p className="text-[13px] text-[#14161F] leading-relaxed">{item.entry.memo}</p>
            </div>
            <div className="py-3">
              <div className="text-[11px] font-semibold text-[#1E80FF] mb-1">常用搭配</div>
              <p className="text-[13px] text-[#14161F] leading-relaxed">{item.entry.collocations}</p>
            </div>
            <div className="py-3">
              <div className="text-[11px] font-semibold text-[#1E80FF] mb-1">同族与派生</div>
              <p className="text-[13px] text-[#14161F] leading-relaxed">{item.entry.family}</p>
            </div>
            <div className="pt-3">
              <div className="text-[11px] font-semibold text-[#D97706] mb-1">最容易错 / 近义易混</div>
              <p className="text-[13px] text-[#14161F] leading-relaxed">{item.entry.confusable}</p>
            </div>
          </motion.div>

          <AnimatePresence initial={false}>
            {!revealed && (
              <motion.button
                key="desktop-mnemonic-mask"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleReveal();
                }}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center px-6 gap-2.5 bg-[#F8FBFF]/65 hover:bg-[#F3F8FF]/75 backdrop-blur-[4px] cursor-pointer transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-white border border-[#DCE5F2] text-[#1E80FF] flex items-center justify-center shadow-2xs">
                  <Lock className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold text-[#14161F]">
                  四维记忆解析处于模糊遮罩态
                </span>
                <span className="text-xs text-[#6B7385] leading-relaxed">
                  先结合左侧英文例句主动检索词义，点击此处或按 <kbd className="kbd-hint">↓</kbd> 解锁构词、搭配、同族词与易混辨析
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </aside>
      </main>

      {/* Bottom Action Bar */}
      <footer className="shrink-0 flex flex-col gap-1.5">
        {unknownMode ? (
          <div className="flex items-center gap-3 w-full">
            <SafeButton
              onClick={handleKnown}
              className="btn-primary flex-1 min-w-0 min-h-[48px] px-4 py-2.5 text-sm sm:text-base font-semibold flex items-center justify-center gap-2"
            >
              <span>记住了，下一个（稍后重现）</span>
              <kbd className="kbd-hint">→</kbd>
            </SafeButton>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full">
            <SafeButton
              onClick={handleUnknown}
              disabled={isAdvancing}
              className="btn-secondary flex-1 min-w-0 min-h-[48px] px-4 py-2.5 text-sm sm:text-base font-semibold text-[#E5484D] border-[#F6D0D2] hover:bg-[#FFF5F5] hover:border-[#E5484D] flex items-center justify-center gap-2"
            >
              <span>不认识</span>
              <kbd className="kbd-hint">←</kbd>
            </SafeButton>
            <SafeButton
              onClick={handleKnown}
              disabled={isAdvancing}
              className="btn-primary flex-[1.4] min-w-0 min-h-[48px] px-4 py-2.5 text-sm sm:text-base font-semibold flex items-center justify-center gap-2"
            >
              <span>认识</span>
              <kbd className="kbd-hint">→</kbd>
            </SafeButton>
          </div>
        )}

        {/* Quiet Undo Bar for False Recognition Protection */}
        <div className="min-h-[24px] flex items-center justify-center">
          {lastPassedItem ? (
            <SafeButton
              onClick={onUndoLast}
              disabled={isAdvancing}
              className="inline-flex items-center gap-1.5 text-xs text-[#6B7385] hover:text-[#1E80FF] px-2 py-0.5 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>
                上一词：{lastPassedItem.word}（{lastPassedItem.meaning}） · 误点撤回
              </span>
              <kbd className="kbd-hint">Backspace</kbd>
            </SafeButton>
          ) : (
            <span className="text-[11px] text-[#9AA3B2]">
              不认识的词将记入错题本并在本轮末尾重现巩固
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
