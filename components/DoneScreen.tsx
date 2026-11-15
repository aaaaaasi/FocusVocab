'use client';

import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { SafeButton } from './SafeButton';

interface DoneScreenProps {
  todayCount: number;
  unknownCount: number;
  onStartQuiz: () => void;
  onBackHome: () => void;
}

export function DoneScreen({
  todayCount,
  unknownCount,
  onStartQuiz,
  onBackHome,
}: DoneScreenProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 items-center justify-center">
      <div className="surface-card w-full max-w-[540px] p-6 sm:p-8 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#EAF3FF] text-[#1E80FF] flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[clamp(22px,3.6vw,28px)] font-bold text-[#14161F] tabular-nums">
            今日 {todayCount} 个词已学完
          </h1>
          <p className="text-sm sm:text-base text-[#6B7385]">
            接下来做 {todayCount} 道题，做完就算今天打卡
          </p>
          <p className="text-xs text-[#9AA3B2] tabular-nums">
            选择题（同词性干扰）与听音拼写题交替 · 本轮标记不认识 {unknownCount} 个
          </p>
        </div>

        <div className="w-full flex flex-col sm:flex-row items-center gap-3 pt-2">
          <SafeButton
            onClick={onBackHome}
            className="btn-secondary w-full sm:flex-1 min-w-0 min-h-[46px] px-4 py-2.5 text-sm font-semibold"
          >
            回首页
          </SafeButton>
          <SafeButton
            onClick={onStartQuiz}
            className="btn-primary w-full sm:flex-[1.5] min-w-0 min-h-[46px] px-4 py-2.5 text-sm sm:text-base font-semibold flex items-center justify-center gap-1.5"
          >
            <span>去做今天的小测</span>
            <ArrowRight className="w-4 h-4" />
          </SafeButton>
        </div>
      </div>
    </div>
  );
}
