'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Layers, Settings2 } from 'lucide-react';
import { SafeButton } from './SafeButton';
import { DAILY_SIZE_OPTIONS, getWeekDates } from '../lib/vocab-engine';
import type { DailyRecord, DeckDefinition } from '../lib/types';

interface HomeScreenProps {
  deck: DeckDefinition;
  dayNumber: number;
  streak: number;
  dailySize: number;
  today: string;
  todayRecord: DailyRecord;
  wrongCount: number;
  learnedCount: number;
  masteredCount: number;
  globalCheckins: Record<string, boolean>;
  onChangeDailySize: (size: number) => void;
  onStartStudy: () => void;
  onReviewTodayWords: () => void;
  onStartQuiz: () => void;
  onOpenCheckin: () => void;
  onOpenWrongBook: () => void;
  onOpenAllWords: () => void;
  onOpenDeckSwitcher: () => void;
  onOpenManageModal: () => void;
}

export function HomeScreen({
  deck,
  dayNumber,
  streak,
  dailySize,
  today,
  todayRecord,
  wrongCount,
  learnedCount,
  masteredCount,
  globalCheckins,
  onChangeDailySize,
  onStartStudy,
  onReviewTodayWords,
  onStartQuiz,
  onOpenCheckin,
  onOpenWrongBook,
  onOpenAllWords,
  onOpenDeckSwitcher,
  onOpenManageModal,
}: HomeScreenProps) {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 520);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const totalToday = todayRecord.queue.length;
  const studiedCount = todayRecord.studiedWords.length;
  const remaining = Math.max(0, totalToday - studiedCount);
  const allStudied = totalToday > 0 && studiedCount >= totalToday;
  const quizDone = Boolean(todayRecord.quiz);
  const checkedToday = Boolean(todayRecord.checked || globalCheckins[today]);

  const progressRatio = totalToday > 0 ? Math.min(1, studiedCount / totalToday) : 0;
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressRatio);

  const weekDays = getWeekDates(today);
  const weekCheckedCount = weekDays.filter((d) => globalCheckins[d.date]).length;

  let ctaLabel = '开始今天的学习';
  let ctaAction = onStartStudy;
  let ctaDisabled = false;

  if (totalToday === 0) {
    ctaLabel = '当前词库为空';
    ctaDisabled = true;
  } else if (!allStudied && studiedCount > 0) {
    ctaLabel = `继续今天的学习（第 ${studiedCount + 1} 个）`;
    ctaAction = onStartStudy;
  } else if (allStudied && !quizDone) {
    ctaLabel = '去做今天的小测';
    ctaAction = onStartQuiz;
  } else if (allStudied && quizDone) {
    ctaLabel = '今天已全部完成';
    ctaDisabled = true;
  }

  const ringStatusText =
    studiedCount === 0
      ? '今天还没开始'
      : allStudied
      ? quizDone
        ? '今日已打卡'
        : '待完成小测'
      : '今日进度';

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between gap-2.5 sm:gap-3.5">
      {/* Top Row */}
      <header className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[17px] sm:text-[19px] font-bold tracking-tight text-[#14161F] truncate">
            {deck.name}
          </span>
          <span className="text-xs font-medium text-[#1E80FF] shrink-0 tabular-nums">
            第 {dayNumber} 天
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs sm:text-[13px] font-medium text-[#6B7385] tabular-nums whitespace-nowrap">
            连续打卡 <strong className="text-[#14161F] font-semibold">{streak}</strong> 天
          </span>
          <SafeButton
            onClick={onOpenCheckin}
            className="btn-secondary px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 min-h-[34px]"
          >
            战绩卡
          </SafeButton>
        </div>
      </header>

      {/* Main Study Status Card — 2 columns on desktop (>=900px) OR short phones (<900px && <=720px height) */}
      <section
        aria-label="今日学习任务"
        className="surface-card p-4 sm:p-6 shrink-0 grid grid-cols-1 min-[900px]:grid-cols-[2fr_1fr] max-[899px]:[@media(max-height:720px)]:grid-cols-[1.5fr_1fr] gap-4 min-[900px]:gap-6 items-center"
      >
        {/* Left Column */}
        <div className="flex flex-col gap-2.5 sm:gap-3 min-w-0">
          <div>
            <h1 className="text-[clamp(22px,3.6vw,32px)] font-bold leading-tight tracking-tight text-[#14161F] tabular-nums">
              {allStudied
                ? quizDone
                  ? '今天的词和小测都完成了'
                  : '今日背词已完成，待做小测'
                : `今天还有 ${remaining} 个词没背`}
            </h1>
            <p className="mt-1 text-xs sm:text-[13px] text-[#6B7385] tabular-nums">
              新词 {todayRecord.newCount} · 复习 {todayRecord.reviewCount} · 词库共 {deck.words.length} 词
            </p>
          </div>

          {/* Daily Word Count Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F3F8FF] border border-[#E6EEF8] w-full max-w-[360px]">
            {DAILY_SIZE_OPTIONS.map((size) => {
              const active = dailySize === size;
              return (
                <SafeButton
                  key={size}
                  onClick={() => onChangeDailySize(size)}
                  aria-pressed={active}
                  className={`flex-1 min-w-0 py-1.5 text-xs sm:text-[13px] font-semibold rounded-lg tabular-nums transition-colors ${
                    active
                      ? 'bg-white text-[#1E80FF] shadow-[0_2px_6px_rgba(30,96,200,.10)]'
                      : 'bg-transparent text-[#6B7385] hover:text-[#14161F]'
                  }`}
                >
                  {size}
                </SafeButton>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-[380px]">
            <div className="h-2 rounded-full bg-[#EAF3FF] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-150 ease-out"
                style={{
                  width: `${Math.round(progressRatio * 100)}%`,
                  background: 'linear-gradient(90deg, #2B7BF5 0%, #38BDF8 100%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Progress Ring + Primary CTA */}
        <div className="flex flex-col items-center gap-2.5 sm:gap-3 w-full">
          <div className="relative flex items-center justify-center w-[96px] h-[96px] sm:w-[112px] sm:h-[112px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112" aria-hidden="true">
              <circle
                cx="56"
                cy="56"
                r={ringRadius}
                fill="none"
                stroke="#EAF3FF"
                strokeWidth="8"
              />
              <circle
                cx="56"
                cy="56"
                r={ringRadius}
                fill="none"
                stroke="url(#ringGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
              />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2B7BF5" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg sm:text-xl font-bold text-[#14161F] tabular-nums leading-none">
                {studiedCount}/{totalToday}
              </span>
              <span className="mt-1 text-[11px] text-[#6B7385] leading-none">
                {ringStatusText}
              </span>
            </div>
          </div>

          <SafeButton
            onClick={ctaAction}
            disabled={ctaDisabled}
            className="btn-primary w-full min-h-[44px] px-4 py-2.5 text-sm sm:text-[15px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>{ctaLabel}</span>
            {!ctaDisabled && <ArrowRight className="w-4 h-4 shrink-0" />}
          </SafeButton>

          {allStudied ? (
            <div className="flex items-center justify-center gap-3 text-xs">
              <SafeButton
                onClick={onReviewTodayWords}
                className="text-[#1E80FF] hover:underline font-medium px-1 py-0.5"
              >
                回看今日词表
              </SafeButton>
              {checkedToday && (
                <>
                  <span className="text-[#9AA3B2]">·</span>
                  <SafeButton
                    onClick={onOpenCheckin}
                    className="text-[#1E80FF] hover:underline font-medium px-1 py-0.5"
                  >
                    查看战绩卡
                  </SafeButton>
                </>
              )}
            </div>
          ) : (
            <p className="text-[11px] sm:text-xs text-[#9AA3B2] text-center whitespace-nowrap">
              背完 → 小测试 → 导出战绩卡
            </p>
          )}
        </div>
      </section>

      {/* Weekly Check-in Strip */}
      <section aria-label="本周打卡" className="surface-card px-4 py-3 sm:px-5 sm:py-4 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-semibold text-[#14161F] whitespace-nowrap">本周打卡</h2>
            <span className="text-xs text-[#6B7385] tabular-nums whitespace-nowrap">
              已打卡 {weekCheckedCount} 天
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <SafeButton
              onClick={onOpenDeckSwitcher}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#1E80FF] hover:underline whitespace-nowrap py-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>切换词库</span>
            </SafeButton>
            <SafeButton
              onClick={onOpenManageModal}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#6B7385] hover:text-[#14161F] whitespace-nowrap py-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>管理与备份</span>
            </SafeButton>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {weekDays.map((day) => {
            const isChecked = Boolean(globalCheckins[day.date]);
            const isToday = day.date === today;
            return (
              <div
                key={day.date}
                className={`flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl border text-center ${
                  isToday
                    ? 'border-[#1E80FF] bg-[#F3F8FF]'
                    : isChecked
                    ? 'border-[#E6EEF8] bg-[#F8FBFF]'
                    : 'border-transparent bg-transparent'
                }`}
              >
                <span
                  className={`text-[11px] font-medium ${
                    isToday ? 'text-[#1E80FF]' : 'text-[#6B7385]'
                  }`}
                >
                  {day.label}
                </span>
                <div className="my-1 flex items-center justify-center h-5 w-5">
                  {isChecked ? (
                    <span className="w-5 h-5 rounded-full bg-[#1E80FF] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </span>
                  ) : isToday ? (
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-[#1E80FF]"
                      aria-label="今天未打卡"
                    />
                  ) : (
                    <span className="w-3 h-[2px] rounded bg-[#D5DFEE]" aria-hidden="true" />
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] text-[#9AA3B2] tabular-nums">
                  {day.shortDate}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-2 text-[11px] text-[#9AA3B2]">
          学完当天的词并且做完小测才算打卡
        </p>
      </section>

      {/* Bottom 3-Entry Card + Deck Footer Summary */}
      <footer className="shrink-0 flex flex-col gap-1.5">
        <div className="surface-card flex items-stretch divide-x divide-[#E6EEF8] overflow-hidden">
          <SafeButton
            onClick={onReviewTodayWords}
            className="flex-1 min-w-0 min-h-[44px] px-2 py-2.5 text-xs sm:text-sm font-medium text-[#14161F] hover:bg-[#F3F8FF] transition-colors whitespace-nowrap truncate"
          >
            {isNarrow ? `今日 ${totalToday}` : `今日词表（${totalToday} 个）`}
          </SafeButton>
          <SafeButton
            onClick={onOpenWrongBook}
            className="flex-1 min-w-0 min-h-[44px] px-2 py-2.5 text-xs sm:text-sm font-medium text-[#14161F] hover:bg-[#F3F8FF] transition-colors whitespace-nowrap truncate"
          >
            {isNarrow ? `错题本 ${wrongCount}` : `错题本（${wrongCount} 个）`}
          </SafeButton>
          <SafeButton
            onClick={onOpenAllWords}
            className="flex-1 min-w-0 min-h-[44px] px-2 py-2.5 text-xs sm:text-sm font-medium text-[#14161F] hover:bg-[#F3F8FF] transition-colors whitespace-nowrap truncate"
          >
            {isNarrow ? `全部 ${deck.words.length} 词` : `浏览全部 ${deck.words.length} 词`}
          </SafeButton>
        </div>
        <div className="text-center text-[11px] sm:text-xs text-[#6B7385] tabular-nums">
          当前词库：{deck.words.length} 词 · 已接触 {learnedCount} · 已掌握 {masteredCount}
        </div>
      </footer>
    </div>
  );
}
