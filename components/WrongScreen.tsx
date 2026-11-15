'use client';

import React from 'react';
import { ArrowLeft, Check, Play, Volume2 } from 'lucide-react';
import { SafeButton } from './SafeButton';
import { speakWord } from '../lib/speech';
import { getSrsStageLabel } from '../lib/vocab-engine';
import type { WordEntry, WrongRecord } from '../lib/types';

export interface WrongItemView {
  entry: WordEntry;
  record: WrongRecord;
}

interface WrongScreenProps {
  items: WrongItemView[];
  onMarkMastered: (word: string) => void;
  onPracticeWrong: (words: WordEntry[]) => void;
  onBackHome: () => void;
}

export function WrongScreen({
  items,
  onMarkMastered,
  onPracticeWrong,
  onBackHome,
}: WrongScreenProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between gap-2.5 sm:gap-3">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <SafeButton
            onClick={onBackHome}
            aria-label="返回首页"
            className="btn-secondary min-w-[44px] min-h-[44px] px-3 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回</span>
          </SafeButton>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-[#14161F] tabular-nums truncate">
              错题本（{items.length} 个）
            </h1>
            <p className="text-[11px] sm:text-xs text-[#6B7385] truncate">
              按记忆曲线第 1、2、4、7、15 天再复习，5 次都对就移出
            </p>
          </div>
        </div>
      </header>

      {/* Scrollable List Card (only this card scrolls) */}
      <main className="surface-card flex-1 min-h-0 flex flex-col overflow-hidden">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
            <p className="text-sm sm:text-base font-semibold text-[#14161F]">
              错题本暂时为空
            </p>
            <p className="text-xs sm:text-sm text-[#6B7385] max-w-[380px] leading-relaxed">
              背词时点击「不认识」或小测答错的词，会自动收进这里并按 1 / 2 / 4 / 7 / 15 天记忆曲线安排复习。
            </p>
          </div>
        ) : (
          <div className="scroll-inner flex-1 min-h-0 divide-y divide-[#E6EEF8] px-4 sm:px-5">
            {items.map(({ entry, record }) => (
              <article
                key={entry.word}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1 flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-[#14161F]">
                      {entry.word}
                    </span>
                    <span className="text-xs font-mono text-[#9AA3B2]">{entry.phonetic}</span>
                    <SafeButton
                      onClick={() => speakWord(entry.word)}
                      skipDebounce
                      aria-label={`朗读 ${entry.word}`}
                      className="min-w-[32px] min-h-[32px] rounded-full bg-[#F3F8FF] hover:bg-[#EAF3FF] text-[#1E80FF] inline-flex items-center justify-center"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </SafeButton>
                    <span className="text-xs text-[#E5484D] font-medium tabular-nums">
                      错 {record.n} 次
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#14161F]">
                    <span className="text-[#1E80FF] font-semibold mr-1">{entry.pos}</span>
                    {entry.meaning}
                  </p>

                  <p className="text-xs text-[#6B7385] leading-relaxed">
                    <strong className="font-medium text-[#14161F]">怎么记：</strong>
                    {entry.memo}
                    <span className="mx-1.5 text-[#DCE5F2]">·</span>
                    <strong className="font-medium text-[#14161F]">同族：</strong>
                    {entry.family}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B7385] tabular-nums pt-0.5">
                    <span className="flex items-center gap-1" aria-label={`记忆进度 ${record.streak}/5`}>
                      {[0, 1, 2, 3, 4].map((dot) => (
                        <span
                          key={dot}
                          className={`w-1.5 h-1.5 rounded-full ${
                            dot < record.streak ? 'bg-[#1E80FF]' : 'bg-[#DCE5F2]'
                          }`}
                        />
                      ))}
                    </span>
                    <span>{getSrsStageLabel(record)}</span>
                    <span>·</span>
                    <span>加入于 {record.added}</span>
                    <span>·</span>
                    <span>下次复习 {record.next}</span>
                  </div>
                </div>

                <SafeButton
                  onClick={() => onMarkMastered(entry.word)}
                  className="btn-secondary min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-[#12A672] border-[#BCEAD8] hover:bg-[#ECFDF5] shrink-0 self-start sm:self-center flex items-center gap-1 whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>记住了</span>
                </SafeButton>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="shrink-0 flex items-center gap-3 w-full">
        <SafeButton
          onClick={onBackHome}
          className="btn-secondary flex-1 min-w-0 min-h-[46px] px-4 py-2 text-sm font-semibold"
        >
          回首页
        </SafeButton>
        <SafeButton
          onClick={() => onPracticeWrong(items.map((i) => i.entry))}
          disabled={items.length === 0}
          className="btn-primary flex-[1.4] min-w-0 min-h-[46px] px-4 py-2 text-sm font-semibold flex items-center justify-center gap-1.5"
        >
          <Play className="w-4 h-4" />
          <span>只练这些错词</span>
        </SafeButton>
      </footer>
    </div>
  );
}
