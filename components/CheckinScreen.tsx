'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Download } from 'lucide-react';
import { SafeButton } from './SafeButton';
import { renderPosterCanvas, type PosterPayload } from '../lib/poster-canvas';
import {
  buildCheckinCopyText,
  getDailyQuote,
  getDayNumber,
  pickKeyWordForPoster,
} from '../lib/vocab-engine';
import type { DeckDefinition, DeckProgress } from '../lib/types';

interface CheckinScreenProps {
  deck: DeckDefinition;
  progress: DeckProgress;
  today: string;
  streak: number;
  nickname: string;
  dailySize: number;
  globalCheckins: Record<string, boolean>;
  onChangeNickname: (name: string) => void;
  onBackHome: () => void;
}

export function CheckinScreen({
  deck,
  progress,
  today,
  streak,
  nickname,
  dailySize,
  globalCheckins,
  onChangeNickname,
  onBackHome,
}: CheckinScreenProps) {
  const [selectedDate, setSelectedDate] = useState(today);
  const [calMonth, setCalMonth] = useState(() => {
    const [y, m] = today.split('-').map(Number);
    return { year: y, month: m }; // 1-12
  });
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Aggregate stats across all time
  const totalCheckinDays = useMemo(
    () => Object.values(globalCheckins).filter(Boolean).length,
    [globalCheckins]
  );

  const selectedRecord = progress.daily[selectedDate];
  const isSelectedChecked = Boolean(
    selectedRecord?.checked || globalCheckins[selectedDate]
  );

  const posterData: PosterPayload = useMemo(() => {
    const rec = progress.daily[selectedDate];
    const dayNum = getDayNumber(progress.firstDate, selectedDate);
    const keyWord = pickKeyWordForPoster(rec, deck.words);
    return {
      dateStr: selectedDate,
      nickname: nickname || 'TCAMP 同学',
      deckName: deck.name,
      dayNumber: dayNum,
      streak,
      newCount: rec ? rec.newCount : 0,
      reviewCount: rec ? rec.reviewCount : 0,
      keyWord,
      learnedCount: progress.learned.length,
      totalWords: deck.words.length,
      dailyTarget: rec ? rec.targetSize : dailySize,
      quote: getDailyQuote(selectedDate),
    };
  }, [selectedDate, progress, deck, nickname, streak, dailySize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderPosterCanvas(canvas, posterData);
  }, [posterData]);

  const handleDownloadPoster = () => {
    if (!isSelectedChecked) {
      setNotice('今天还没测完，测完才能生成战绩卡');
      return;
    }
    setNotice(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    const safeNick = (nickname || 'TCAMP同学').trim().slice(0, 12).replace(/[\\/:*?"<>|]/g, '');
    a.href = dataUrl;
    a.download = `TCAMP打卡-${selectedDate}-${safeNick}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyText = async () => {
    if (!isSelectedChecked) {
      setNotice('今天还没测完，测完才能生成战绩卡');
      return;
    }
    setNotice(null);
    const text = buildCheckinCopyText({
      day: posterData.dayNumber,
      date: selectedDate,
      deckName: deck.name,
      newCount: posterData.newCount,
      reviewCount: posterData.reviewCount,
      streak,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('已复制打卡文案');
    } catch {
      setCopyStatus('已生成文案，请手动长按复制');
    }
    setTimeout(() => setCopyStatus(null), 2200);
  };

  // Monthly calendar cells (Monday first)
  const calendarCells = useMemo(() => {
    const first = new Date(calMonth.year, calMonth.month - 1, 1);
    const jsDay = first.getDay(); // 0=Sun..6=Sat
    const leadingBlanks = jsDay === 0 ? 6 : jsDay - 1;
    const daysInMonth = new Date(calMonth.year, calMonth.month, 0).getDate();
    const cells: { day: number | null; iso: string | null }[] = [];
    for (let i = 0; i < leadingBlanks; i++) {
      cells.push({ day: null, iso: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${calMonth.year}-${String(calMonth.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, iso });
    }
    return cells;
  }, [calMonth]);

  const shiftMonth = (delta: number) => {
    const dt = new Date(calMonth.year, calMonth.month - 1 + delta, 1);
    setCalMonth({ year: dt.getFullYear(), month: dt.getMonth() + 1 });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between gap-2.5 sm:gap-3">
      {/* Header + 3-Box Summary */}
      <header className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <SafeButton
            onClick={onBackHome}
            aria-label="返回首页"
            className="btn-secondary min-w-[44px] min-h-[44px] px-3 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回</span>
          </SafeButton>
          <h1 className="text-base sm:text-lg font-bold text-[#14161F]">打卡与战绩卡</h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm tabular-nums">
          <div>
            <span className="text-[#6B7385] mr-1">连续打卡</span>
            <strong className="text-[#1E80FF] font-bold">{streak}</strong> 天
          </div>
          <div>
            <span className="text-[#6B7385] mr-1">累计打卡</span>
            <strong className="text-[#14161F] font-bold">{totalCheckinDays}</strong> 天
          </div>
          <div>
            <span className="text-[#6B7385] mr-1">累计背词</span>
            <strong className="text-[#14161F] font-bold">{progress.learned.length}</strong> 词
          </div>
        </div>
      </header>

      {/* Main Content Split */}
      <main className="surface-card flex-1 min-h-0 grid grid-cols-1 min-[900px]:grid-cols-[0.95fr_1.15fr] overflow-hidden">
        {/* Left: Canvas Preview (1080x1440 scaled cleanly) */}
        <div className="bg-[#F3F8FF] p-3 sm:p-4 flex flex-col items-center justify-center border-b min-[900px]:border-b-0 min-[900px]:border-r border-[#E6EEF8] min-h-0">
          <div className="relative h-full max-h-[260px] min-[900px]:max-h-[470px] aspect-[3/4] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              data-testid="poster-canvas"
              className="w-full h-full object-contain rounded-xl shadow-[0_8px_24px_rgba(30,96,200,.14)]"
            />
          </div>
          {!isSelectedChecked && (
            <p className="mt-2 text-[11px] sm:text-xs text-[#D97706] text-center">
              {selectedDate === today
                ? '今天还没测完，测完才能生成今日战绩卡'
                : `${selectedDate} 当天未完成打卡记录`}
            </p>
          )}
        </div>

        {/* Right: Controls + Monthly Calendar (internal scroll if tight) */}
        <div className="scroll-inner p-4 sm:p-5 flex flex-col justify-center gap-5 min-h-0">
          {/* Nickname + Export Buttons */}
          <div className="flex flex-col gap-2.5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="nickname-input" className="text-xs font-semibold text-[#6B7385] shrink-0">
                战绩卡昵称（最多 12 字）
              </label>
              <input
                id="nickname-input"
                type="text"
                maxLength={12}
                value={nickname}
                onChange={(e) => onChangeNickname(e.target.value)}
                placeholder="TCAMP 同学"
                className="w-44 sm:w-52 px-3 py-1.5 rounded-lg border border-[#DCE5F2] bg-[#F8FBFF] text-sm text-[#14161F] focus:bg-white focus:border-[#1E80FF]"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full">
              <SafeButton
                onClick={handleDownloadPoster}
                className="btn-primary flex-1 min-w-0 min-h-[44px] px-3 py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>保存战绩卡</span>
              </SafeButton>
              <SafeButton
                onClick={handleCopyText}
                className="btn-secondary flex-1 min-w-0 min-h-[44px] px-3 py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Copy className="w-4 h-4 shrink-0" />
                <span>复制打卡文案</span>
              </SafeButton>
            </div>

            {(notice || copyStatus) && (
              <p
                className={`text-xs font-medium ${
                  notice ? 'text-[#D97706]' : 'text-[#12A672]'
                }`}
              >
                {notice || copyStatus}
              </p>
            )}
          </div>

          {/* Monthly Calendar (Monday first) */}
          <div className="pt-2.5 border-t border-[#E6EEF8] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-semibold text-[#14161F] tabular-nums">
                {calMonth.year} 年 {calMonth.month} 月打卡日历
              </h2>
              <div className="flex items-center gap-1">
                <SafeButton
                  onClick={() => shiftMonth(-1)}
                  aria-label="上个月"
                  className="btn-secondary w-8 h-8 flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </SafeButton>
                <SafeButton
                  onClick={() => shiftMonth(1)}
                  aria-label="下个月"
                  className="btn-secondary w-8 h-8 flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </SafeButton>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#9AA3B2]">
              {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
                <div key={w} className="py-0.5">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center tabular-nums">
              {calendarCells.map((cell, idx) => {
                if (!cell.day || !cell.iso) {
                  return <div key={`blank-${idx}`} className="h-8" />;
                }
                const checked = Boolean(globalCheckins[cell.iso]);
                const isSelected = cell.iso === selectedDate;
                const isToday = cell.iso === today;
                return (
                  <SafeButton
                    key={cell.iso}
                    onClick={() => {
                      setSelectedDate(cell.iso!);
                      setNotice(null);
                    }}
                    className={`h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-colors ${
                      checked
                        ? isSelected
                          ? 'bg-[#1459C2] text-white ring-2 ring-[#38BDF8]'
                          : 'bg-[#1E80FF] text-white hover:bg-[#196EE0]'
                        : isSelected
                        ? 'bg-[#EAF3FF] text-[#1E80FF] border border-[#1E80FF]'
                        : isToday
                        ? 'bg-[#F3F8FF] text-[#1E80FF] font-bold'
                        : 'text-[#6B7385] hover:bg-[#F8FBFF]'
                    }`}
                  >
                    {cell.day}
                  </SafeButton>
                );
              })}
            </div>
            <p className="text-[11px] text-[#9AA3B2]">
              蓝底日期代表已完成打卡，点击可切换预览当天战绩卡
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
