'use client';

import React from 'react';
import { Award, Check, RotateCcw, Volume2, X } from 'lucide-react';
import { SafeButton } from './SafeButton';
import { speakWord } from '../lib/speech';
import type { WordEntry } from '../lib/types';

interface ResultScreenProps {
  results: { entry: WordEntry; isCorrect: boolean }[];
  isDailyQuiz: boolean;
  onGoCheckin: () => void;
  onRetryWrong: (wrongWords: WordEntry[]) => void;
  onBackHome: () => void;
}

export function ResultScreen({
  results,
  isDailyQuiz,
  onGoCheckin,
  onRetryWrong,
  onBackHome,
}: ResultScreenProps) {
  const total = results.length;
  const rightCount = results.filter((r) => r.isCorrect).length;
  const wrongItems = results.filter((r) => !r.isCorrect);
  const accuracy = total > 0 ? Math.round((rightCount / total) * 100) : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between gap-3">
      {/* Main Split Card */}
      <main className="surface-card flex-1 min-h-0 flex flex-col min-[900px]:grid min-[900px]:grid-cols-[1fr_1.35fr] overflow-hidden">
        {/* Left Score Summary */}
        <div className="p-5 sm:p-6 flex flex-col justify-center gap-5 border-b min-[900px]:border-b-0 min-[900px]:border-r border-[#E6EEF8] shrink-0">
          <div>
            <span className="text-xs font-semibold text-[#1E80FF]">
              {isDailyQuiz ? '今日小测已完成 · 已计入打卡' : '错词专项练习完成'}
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[clamp(36px,5vw,54px)] font-bold text-[#14161F] leading-none tabular-nums">
                {rightCount}/{total}
              </span>
              <span className="text-sm font-medium text-[#6B7385] tabular-nums">
                正确率 {accuracy}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#ECFDF5] px-3.5 py-2.5">
              <div className="text-xs text-[#0E7B54]">答对题数</div>
              <div className="text-xl font-bold text-[#12A672] tabular-nums mt-0.5">
                {rightCount}
              </div>
            </div>
            <div className="rounded-xl bg-[#FEF2F2] px-3.5 py-2.5">
              <div className="text-xs text-[#B91C1C]">答错题数</div>
              <div className="text-xl font-bold text-[#E5484D] tabular-nums mt-0.5">
                {wrongItems.length}
              </div>
            </div>
          </div>

          <p className="text-xs text-[#6B7385] leading-relaxed">
            {wrongItems.length > 0
              ? '答错的词已自动记入错题本并重置为第 1 档，明天将优先安排复习。'
              : '本轮全部一次答对，这些词已按记忆曲线推进到下一复习档位。'}
          </p>
        </div>

        {/* Right Word Breakdown (scroll-inner only!) */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-4 sm:px-5 py-3 border-b border-[#E6EEF8] flex items-center justify-between shrink-0">
            <h2 className="text-sm font-semibold text-[#14161F]">
              本轮词条明细（{total} 词）
            </h2>
            <span className="text-xs text-[#9AA3B2]">点击喇叭可复听</span>
          </div>

          <div className="scroll-inner flex-1 min-h-0 divide-y divide-[#E6EEF8] px-4 sm:px-5">
            {results.map(({ entry, isCorrect }) => (
              <div
                key={entry.word}
                className={`py-2 flex items-center justify-between gap-3 ${
                  isCorrect ? '' : 'bg-[#FFF5F5]/70 -mx-2 px-2 rounded-lg'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-bold text-sm sm:text-[15px] ${
                        isCorrect ? 'text-[#14161F]' : 'text-[#E5484D]'
                      }`}
                    >
                      {entry.word}
                    </span>
                    <span className="text-xs font-mono text-[#9AA3B2]">{entry.phonetic}</span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                        isCorrect ? 'text-[#12A672]' : 'text-[#E5484D]'
                      }`}
                    >
                      {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {isCorrect ? '对' : '错 · 已入错题本'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7385] truncate mt-0.5">
                    {entry.pos} {entry.meaning}
                  </p>
                </div>

                <SafeButton
                  onClick={() => speakWord(entry.word)}
                  skipDebounce
                  aria-label={`朗读 ${entry.word}`}
                  className={`min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center shrink-0 ${
                    isCorrect
                      ? 'bg-[#F3F8FF] hover:bg-[#EAF3FF] text-[#1E80FF]'
                      : 'bg-[#FEE2E2] hover:bg-[#FECACA] text-[#E5484D]'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                </SafeButton>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <footer className="shrink-0 flex items-center gap-2.5 w-full">
        <SafeButton
          onClick={onBackHome}
          className="btn-secondary flex-1 min-w-0 min-h-[46px] px-3 py-2 text-xs sm:text-sm font-semibold"
        >
          回首页
        </SafeButton>

        {wrongItems.length > 0 && (
          <SafeButton
            onClick={() => onRetryWrong(wrongItems.map((w) => w.entry))}
            className="btn-secondary flex-1 min-w-0 min-h-[46px] px-3 py-2 text-xs sm:text-sm font-semibold text-[#E5484D] border-[#F6D0D2] flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>再练错词（{wrongItems.length}）</span>
          </SafeButton>
        )}

        {isDailyQuiz && (
          <SafeButton
            onClick={onGoCheckin}
            className="btn-primary flex-[1.4] min-w-0 min-h-[46px] px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            <span>去打卡 · 生成战绩卡</span>
          </SafeButton>
        )}
      </footer>
    </div>
  );
}
