import fs from 'node:fs';
import path from 'node:path';
import { BUILTIN_DECKS, DAILY_QUOTES } from '../lib/decks';

const outPathPublic = path.resolve(process.cwd(), 'public', 'vocab-booster.html');
const outPathRoot = path.resolve(process.cwd(), 'index.html');

const css = `
:root {
  --p1: #1E80FF;
  --p2: #38BDF8;
  --ink: #14161F;
  --grey: #6B7385;
  --grey2: #9AA3B2;
  --line: #E6EEF8;
  --soft: #F3F8FF;
  --soft2: #EAF3FF;
  --green: #12A672;
  --amber: #D97706;
  --danger: #E5484D;
  --radius: 20px;
  --shadow: 0 12px 32px rgba(30, 96, 200, .07), 0 2px 6px rgba(30, 96, 200, .04);
}
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0; height: 100dvh; overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #EAF3FF 100%);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
}
button, input, textarea { font-family: inherit; }
.tabular-nums { font-variant-numeric: tabular-nums; }
.hidden { display: none !important; }
.app-shell {
  height: 100dvh; max-width: 960px; margin: 0 auto; padding: 18px 20px;
  display: flex; flex-direction: column; gap: 14px; overflow: hidden;
}
.screen {
  display: none; flex-direction: column; flex: 1; min-height: 0; justify-content: space-between; gap: 12px;
}
.screen.active { display: flex; }
.surface-card {
  background: #ffffff; border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow);
}
.btn-primary {
  background: linear-gradient(90deg, #2B7BF5 0%, #38BDF8 100%);
  color: #ffffff; border: none; border-radius: 14px;
  box-shadow: 0 8px 20px rgba(30, 128, 255, .24);
  cursor: pointer; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  transition: opacity 120ms ease-out, transform 120ms ease-out;
}
.btn-primary:hover:not(:disabled) { opacity: 0.94; }
.btn-primary:active:not(:disabled) { transform: translateY(1px); }
.btn-primary:disabled { background: #DCE5F2; color: #7D889C; box-shadow: none; cursor: not-allowed; }
.btn-secondary {
  background: #ffffff; color: var(--grey); border: 1px solid var(--line); border-radius: 999px;
  cursor: pointer; font-weight: 500;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  transition: border-color 120ms ease-out, color 120ms ease-out, background-color 120ms ease-out;
}
.btn-secondary:hover:not(:disabled) { border-color: #C7DAF5; color: var(--ink); background: var(--soft); }
.btn-secondary:disabled { opacity: 0.55; cursor: not-allowed; }
.kbd-hint {
  display: none; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px; line-height: 1; padding: 3px 6px; border-radius: 5px;
  background: rgba(20, 22, 31, 0.06); color: inherit; opacity: 0.78;
}
.btn-primary .kbd-hint { background: rgba(255, 255, 255, 0.22); color: #ffffff; opacity: 0.92; }
@media (hover: hover) and (pointer: fine) {
  .kbd-hint { display: inline-flex; align-items: center; justify-content: center; }
}
mark.word-hl {
  background: var(--soft2); color: var(--p1); padding: 1px 5px; border-radius: 5px; font-weight: 600;
}
.line-clamp-2 {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.scroll-inner { overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid var(--p1); outline-offset: 2px; }

/* Home Layout */
.top-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0; }
.home-card {
  padding: 22px; flex-shrink: 0;
  display: grid; grid-template-columns: 2fr 1fr; gap: 24px; align-items: center;
}
.size-bar {
  display: flex; align-items: center; gap: 4px; padding: 4px; border-radius: 12px;
  background: var(--soft); border: 1px solid var(--line); max-width: 360px; width: 100%;
}
.size-btn {
  flex: 1; min-width: 0; padding: 6px 0; border-radius: 8px; border: none;
  font-size: 13px; font-weight: 600; cursor: pointer; background: transparent; color: var(--grey);
}
.size-btn.active { background: #fff; color: var(--p1); box-shadow: 0 2px 6px rgba(30,96,200,.10); }
.progress-track { height: 8px; border-radius: 999px; background: var(--soft2); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #2B7BF5 0%, #38BDF8 100%); transition: width 150ms ease-out; }
.ring-wrap { position: relative; width: 108px; height: 108px; display: flex; align-items: center; justify-content: center; }
.ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
.week-cell {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 7px 4px; border-radius: 12px; border: 1px solid transparent; text-align: center;
}
.week-cell.today { border-color: var(--p1); background: var(--soft); }
.week-cell.checked:not(.today) { border-color: var(--line); background: #F8FBFF; }
.entry-strip { display: flex; align-items: stretch; overflow: hidden; }
.entry-btn {
  flex: 1; min-width: 0; min-height: 44px; padding: 10px 8px; border: none; border-right: 1px solid var(--line);
  background: #fff; font-size: 13px; font-weight: 500; color: var(--ink); cursor: pointer; white-space: nowrap;
}
.entry-btn:last-child { border-right: none; }
.entry-btn:hover { background: var(--soft); }

/* Study Screen */
.study-card {
  flex: 1; min-height: 0; display: grid; grid-template-columns: 1.25fr 1fr; overflow: hidden;
}
.study-left {
  padding: 22px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; min-height: 0;
}
.study-right {
  border-left: 1px solid var(--line); background: rgba(248, 251, 255, 0.65); padding: 20px;
  display: flex; flex-direction: column; justify-content: center;
}
.mnemonic-block { padding: 11px 0; border-bottom: 1px solid var(--line); }
.mnemonic-block:first-child { padding-top: 0; }
.mnemonic-block:last-child { border-bottom: none; padding-bottom: 0; }
.mobile-tabs { display: none; border-top: 1px solid var(--line); padding-top: 8px; }

/* Quiz Screen */
.quiz-card {
  flex: 1; min-height: 0; padding: 22px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; overflow: hidden;
}
.options-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: auto 0; }
.opt-btn {
  min-height: 52px; padding: 10px 14px; border-radius: 14px; border: 1px solid var(--line); background: #fff;
  display: flex; align-items: center; justify-content: space-between; gap: 8px; text-align: left; cursor: pointer;
}
.opt-btn:hover:not(:disabled) { border-color: var(--p1); background: #F8FBFF; }
.opt-btn.correct { background: #ECFDF5; border-color: #12A672; color: #0E7B54; }
.opt-btn.wrong { background: #FEF2F2; border-color: #E5484D; color: #B91C1C; }
.opt-btn.muted { background: #F8FAFC; color: var(--grey2); opacity: 0.75; }
.spell-slots { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; margin: auto 0; }
.spell-slot {
  width: 30px; height: 38px; border-bottom: 2px solid #DCE5F2;
  display: flex; align-items: center; justify-content: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 20px; font-weight: 700;
}

/* Result & Checkin */
.split-card { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1.25fr; overflow: hidden; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
.cal-day {
  height: 30px; border-radius: 8px; border: 1px solid transparent; background: transparent;
  font-size: 12px; font-weight: 500; cursor: pointer; color: var(--grey);
  display: flex; align-items: center; justify-content: center;
}
.cal-day.checked { background: var(--p1); color: #fff; }
.cal-day.selected:not(.checked) { background: var(--soft2); border-color: var(--p1); color: var(--p1); }
.cal-day.checked.selected { background: #1459C2; box-shadow: 0 0 0 2px #38BDF8; }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 60; background: rgba(20, 22, 31, 0.4);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.modal-card {
  width: 100%; max-width: 720px; max-height: 86dvh; display: flex; flex-direction: column; overflow: hidden;
}

@media (max-width: 899px) {
  .app-shell { padding: 12px 16px; gap: 10px; }
  .home-card { grid-template-columns: 1fr; padding: 16px; gap: 14px; }
  .study-card { grid-template-columns: 1fr; }
  .study-left { padding: 16px; }
  .study-right { display: none; }
  .mobile-tabs { display: block; }
  .options-grid { grid-template-columns: 1fr; }
  .split-card { grid-template-columns: 1fr; }
}
@media (max-width: 899px) and (max-height: 720px) {
  .home-card { grid-template-columns: 1.5fr 1fr; gap: 12px; padding: 14px; }
  .ring-wrap { width: 88px; height: 88px; }
}
@media (max-height: 800px) { .app-shell { padding-top: 12px; padding-bottom: 12px; gap: 10px; } }
@media (max-height: 720px) { .app-shell { padding-top: 10px; padding-bottom: 10px; gap: 8px; } }
@media (max-height: 660px) { .app-shell { padding-top: 8px; padding-bottom: 8px; gap: 6px; } }
@media (max-height: 600px) { .app-shell { padding-top: 6px; padding-bottom: 6px; gap: 4px; } }
`;

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>词刻 · 英语背词与记忆训练（离线单文件版）</title>
  <style>${css}</style>
</head>
<body>
  <div class="app-shell">
    <div id="storage-alert" class="hidden" role="alert" style="flex-shrink:0;border-radius:12px;background:#FFFBEB;border:1px solid #FDE68A;padding:8px 12px;font-size:12px;color:#92400E;display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <span id="storage-alert-text"></span>
      <button type="button" id="storage-alert-close" style="background:none;border:none;color:#92400E;font-weight:600;text-decoration:underline;cursor:pointer;">知道了</button>
    </div>

    <!-- 1. HOME -->
    <section id="screen-home" class="screen active" aria-label="首页">
      <header class="top-bar">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;">
          <span id="home-deck-name" style="font-size:18px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></span>
          <span id="home-day-num" class="tabular-nums" style="font-size:12px;font-weight:600;color:var(--p1);flex-shrink:0;"></span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
          <span class="tabular-nums" style="font-size:13px;color:var(--grey);">连续打卡 <strong id="home-streak" style="color:var(--ink);">0</strong> 天</span>
          <button type="button" class="btn-secondary" id="btn-home-checkin" style="padding:6px 12px;font-size:12px;min-height:34px;">战绩卡</button>
        </div>
      </header>

      <div class="surface-card home-card">
        <div style="display:flex;flex-direction:column;gap:12px;min-width:0;">
          <div>
            <h1 id="home-headline" class="tabular-nums" style="margin:0;font-size:clamp(22px,3.5vw,30px);line-height:1.2;"></h1>
            <p id="home-sub" class="tabular-nums" style="margin:4px 0 0;font-size:13px;color:var(--grey);"></p>
          </div>
          <div class="size-bar" id="size-bar"></div>
          <div class="progress-track" style="max-width:380px;">
            <div class="progress-fill" id="home-progress-bar" style="width:0%;"></div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;">
          <div class="ring-wrap">
            <svg width="108" height="108" viewBox="0 0 112 112" style="transform:rotate(-90deg);" aria-hidden="true">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#2B7BF5" />
                  <stop offset="100%" stop-color="#38BDF8" />
                </linearGradient>
              </defs>
              <circle cx="56" cy="56" r="46" fill="none" stroke="#EAF3FF" stroke-width="8" />
              <circle id="home-ring-fg" cx="56" cy="56" r="46" fill="none" stroke="url(#ringGrad)" stroke-width="8" stroke-linecap="round" stroke-dasharray="289.03" stroke-dashoffset="289.03" />
            </svg>
            <div class="ring-center">
              <span id="home-ring-num" class="tabular-nums" style="font-size:19px;font-weight:700;line-height:1;">0/7</span>
              <span id="home-ring-label" style="font-size:11px;color:var(--grey);margin-top:4px;">今天还没开始</span>
            </div>
          </div>
          <button type="button" id="btn-home-cta" class="btn-primary" style="width:100%;min-height:44px;padding:10px 14px;font-size:14px;"></button>
          <div id="home-cta-sub" style="font-size:11px;color:var(--grey2);text-align:center;">背完 → 小测试 → 导出战绩卡</div>
        </div>
      </div>

      <section class="surface-card" style="padding:14px 18px;flex-shrink:0;" aria-label="本周打卡">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <strong style="font-size:14px;">本周打卡</strong>
            <span id="week-checked-count" class="tabular-nums" style="font-size:12px;color:var(--grey);"></span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <button type="button" id="btn-open-deck-switcher" style="background:none;border:none;color:var(--p1);font-size:12px;font-weight:600;cursor:pointer;padding:4px 0;">切换词库</button>
            <button type="button" id="btn-open-manage" style="background:none;border:none;color:var(--grey);font-size:12px;font-weight:500;cursor:pointer;padding:4px 0;">管理与备份</button>
          </div>
        </div>
        <div class="week-grid" id="home-week-grid"></div>
        <p style="margin:8px 0 0;font-size:11px;color:var(--grey2);">学完当天的词并且做完小测才算打卡</p>
      </section>

      <footer style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;">
        <div class="surface-card entry-strip">
          <button type="button" class="entry-btn" id="btn-entry-today"></button>
          <button type="button" class="entry-btn" id="btn-entry-wrong"></button>
          <button type="button" class="entry-btn" id="btn-entry-all"></button>
        </div>
        <div id="home-deck-footer" class="tabular-nums" style="text-align:center;font-size:12px;color:var(--grey);"></div>
      </footer>
    </section>

    <!-- 2. STUDY -->
    <section id="screen-study" class="screen" aria-label="背词界面">
      <header class="top-bar">
        <button type="button" class="btn-secondary" id="btn-study-back" style="min-width:44px;min-height:44px;padding:0 12px;font-size:13px;">返回</button>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;">
          <div class="tabular-nums" style="display:flex;justify-content:space-between;font-size:12px;color:var(--grey);">
            <span id="study-progress-text"></span>
            <span id="study-progress-pct">0%</span>
          </div>
          <div class="progress-track" style="height:6px;">
            <div class="progress-fill" id="study-progress-bar" style="width:0%;"></div>
          </div>
        </div>
        <button type="button" class="btn-secondary" id="btn-toggle-mask" style="min-height:44px;padding:0 12px;font-size:12px;white-space:nowrap;"></button>
      </header>

      <main class="surface-card study-card">
        <div class="study-left">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;flex-shrink:0;">
            <span id="study-status-tag" style="font-weight:600;"></span>
            <div id="study-srs-wrap" class="tabular-nums" style="display:flex;align-items:center;gap:6px;color:var(--grey);"></div>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;margin:auto 0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <button type="button" id="btn-study-word-speak" style="background:none;border:none;padding:0;text-align:left;cursor:pointer;min-height:44px;">
                <span id="study-word" style="font-size:clamp(28px,5vw,44px);font-weight:700;color:var(--ink);line-height:1;"></span>
              </button>
              <button type="button" id="btn-study-speak" style="min-width:44px;min-height:44px;border-radius:999px;background:var(--soft);border:1px solid var(--line);color:var(--p1);padding:0 12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;flex-shrink:0;">
                <span>朗读</span><kbd class="kbd-hint">Space</kbd>
              </button>
            </div>

            <div style="display:flex;align-items:center;gap:10px;font-size:15px;color:var(--grey);">
              <span id="study-phonetic" style="font-family:ui-monospace,monospace;"></span>
              <span style="color:#DCE5F2;">|</span>
              <span id="study-pos" style="font-weight:600;color:var(--p1);"></span>
            </div>

            <div style="padding-top:8px;border-top:1px solid var(--line);">
              <div id="study-example-box" role="button" tabindex="0" style="padding:6px 10px;margin:0 -10px;border-radius:12px;cursor:pointer;transition:background-color 150ms ease;">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:2px;">
                  <span style="color:var(--grey);font-weight:500;">语境原声例句</span>
                  <span id="study-example-status" style="color:var(--p1);font-weight:600;">点击例句即时揭开高亮词汇</span>
                </div>
                <p id="study-example" class="line-clamp-2" style="margin:0;font-size:15px;line-height:1.55;color:var(--ink);"></p>
              </div>
            </div>

            <div style="padding-top:8px;border-top:1px solid var(--line);">
              <div id="study-meaning-blur-wrap" style="position:relative;border-radius:12px;overflow:hidden;min-height:54px;padding:8px 12px;background:#F8FBFF;border:1px solid var(--line);">
                <div id="study-revealed-meaning" style="transition:filter 280ms ease,opacity 280ms ease,transform 280ms ease;">
                  <p id="study-meaning" style="margin:0;font-size:17px;font-weight:700;color:var(--ink);"></p>
                  <p id="study-example-zh" class="line-clamp-2" style="margin:3px 0 0;font-size:13px;color:var(--grey);"></p>
                </div>
                <button type="button" id="btn-study-reveal" style="position:absolute;inset:0;width:100%;height:100%;padding:8px 12px;border-radius:12px;background:rgba(243,248,255,0.82);backdrop-filter:blur(5px);border:1px dashed #B8D4F8;color:var(--ink);font-size:13px;font-weight:500;display:flex;align-items:center;justify-content:space-between;cursor:pointer;text-align:left;transition:opacity 220ms ease,transform 220ms ease;">
                  <span>点击解锁中文释义与助记 · 先在脑中回想再判分</span>
                  <kbd class="kbd-hint">↓</kbd>
                </button>
              </div>
            </div>
          </div>

          <div class="mobile-tabs">
            <div id="study-mobile-mask-note" style="font-size:12px;color:var(--grey2);padding:4px 0;">揭晓释义后查看构词助记、真题搭配与易混辨析</div>
            <div id="study-mobile-tabs-inner" class="hidden">
              <div id="study-tab-buttons" style="display:flex;gap:4px;border-bottom:1px solid var(--line);padding-bottom:6px;margin-bottom:6px;"></div>
              <p id="study-mobile-tab-content" class="line-clamp-2" style="margin:0;font-size:12px;line-height:1.5;min-height:34px;"></p>
            </div>
          </div>
        </div>

        <aside class="study-right" aria-label="四维助记拆解">
          <div id="study-right-masked" style="text-align:center;padding:16px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:var(--grey);">四维记忆解析已遮罩</p>
            <p style="margin:8px 0 0;font-size:12px;color:var(--grey2);line-height:1.6;">先结合左侧英文例句回想词义。点击「显露释义」或「不认识」后展开构词、搭配、同族词与易混辨析。</p>
          </div>
          <div id="study-right-content" class="hidden">
            <div class="mnemonic-block">
              <div style="font-size:11px;font-weight:600;color:var(--p1);margin-bottom:3px;">怎么记 · 词根拆解</div>
              <div id="m-memo" style="font-size:13px;line-height:1.55;"></div>
            </div>
            <div class="mnemonic-block">
              <div style="font-size:11px;font-weight:600;color:var(--p1);margin-bottom:3px;">常用搭配</div>
              <div id="m-coll" style="font-size:13px;line-height:1.55;"></div>
            </div>
            <div class="mnemonic-block">
              <div style="font-size:11px;font-weight:600;color:var(--p1);margin-bottom:3px;">同族与派生</div>
              <div id="m-fam" style="font-size:13px;line-height:1.55;"></div>
            </div>
            <div class="mnemonic-block">
              <div style="font-size:11px;font-weight:600;color:var(--amber);margin-bottom:3px;">最容易错 / 近义易混</div>
              <div id="m-conf" style="font-size:13px;line-height:1.55;"></div>
            </div>
          </div>
        </aside>
      </main>

      <footer style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;">
        <div id="study-actions-normal" style="display:flex;gap:12px;width:100%;">
          <button type="button" id="btn-study-unknown" class="btn-secondary" style="flex:1;min-width:0;min-height:48px;font-size:15px;font-weight:600;color:var(--danger);border-color:#F6D0D2;">
            <span>不认识</span><kbd class="kbd-hint">←</kbd>
          </button>
          <button type="button" id="btn-study-known" class="btn-primary" style="flex:1.4;min-width:0;min-height:48px;font-size:15px;">
            <span>认识</span><kbd class="kbd-hint">→</kbd>
          </button>
        </div>
        <div id="study-actions-requeue" class="hidden" style="display:flex;width:100%;">
          <button type="button" id="btn-study-next-after-unknown" class="btn-primary" style="flex:1;min-width:0;min-height:48px;font-size:15px;">
            <span>记住了，下一个（稍后重现）</span><kbd class="kbd-hint">→</kbd>
          </button>
        </div>
        <div style="min-height:22px;display:flex;justify-content:center;align-items:center;">
          <button type="button" id="btn-study-undo" class="hidden" style="background:none;border:none;color:var(--grey);font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
            <span id="study-undo-text"></span><kbd class="kbd-hint">Backspace</kbd>
          </button>
          <span id="study-undo-hint" style="font-size:11px;color:var(--grey2);">不认识的词将记入错题本并在本轮末尾重现巩固</span>
        </div>
      </footer>
    </section>

    <!-- 3. DONE -->
    <section id="screen-done" class="screen" style="align-items:center;justify-content:center;" aria-label="背词完成">
      <div class="surface-card" style="width:100%;max-width:520px;padding:30px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px;">
        <div style="width:48px;height:48px;border-radius:999px;background:var(--soft2);color:var(--p1);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;">✓</div>
        <h1 id="done-title" class="tabular-nums" style="margin:0;font-size:clamp(22px,3.5vw,28px);"></h1>
        <p id="done-sub" style="margin:0;font-size:15px;color:var(--grey);"></p>
        <p id="done-meta" class="tabular-nums" style="margin:0;font-size:12px;color:var(--grey2);"></p>
        <div style="display:flex;gap:12px;width:100%;margin-top:8px;">
          <button type="button" id="btn-done-home" class="btn-secondary" style="flex:1;min-width:0;min-height:46px;font-size:14px;">回首页</button>
          <button type="button" id="btn-done-quiz" class="btn-primary" style="flex:1.5;min-width:0;min-height:46px;font-size:15px;">去做今天的小测 →</button>
        </div>
      </div>
    </section>

    <!-- 4. QUIZ -->
    <section id="screen-quiz" class="screen" aria-label="小测">
      <header class="top-bar">
        <button type="button" class="btn-secondary" id="btn-quiz-back" style="min-width:44px;min-height:44px;padding:0 12px;font-size:13px;">返回</button>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;">
          <div class="tabular-nums" style="display:flex;justify-content:space-between;font-size:12px;color:var(--grey);">
            <span id="quiz-progress-text"></span>
            <span id="quiz-progress-pct">0%</span>
          </div>
          <div class="progress-track" style="height:6px;">
            <div class="progress-fill" id="quiz-progress-bar" style="width:0%;"></div>
          </div>
        </div>
      </header>

      <main class="surface-card quiz-card" id="quiz-body"></main>
    </section>

    <!-- 5. RESULT -->
    <section id="screen-result" class="screen" aria-label="小测成绩">
      <main class="surface-card split-card">
        <div style="padding:22px;border-right:1px solid var(--line);display:flex;flex-direction:column;justify-content:space-between;gap:14px;">
          <div>
            <span id="result-badge" style="font-size:12px;font-weight:600;color:var(--p1);"></span>
            <div style="margin-top:8px;display:flex;align-items:baseline;gap:8px;">
              <span id="result-score" class="tabular-nums" style="font-size:clamp(34px,5vw,52px);font-weight:700;line-height:1;"></span>
              <span id="result-acc" class="tabular-nums" style="font-size:14px;color:var(--grey);"></span>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div style="border-radius:12px;background:#ECFDF5;padding:10px 14px;">
              <div style="font-size:12px;color:#0E7B54;">答对题数</div>
              <div id="result-right-num" class="tabular-nums" style="font-size:20px;font-weight:700;color:var(--green);"></div>
            </div>
            <div style="border-radius:12px;background:#FEF2F2;padding:10px 14px;">
              <div style="font-size:12px;color:#B91C1C;">答错题数</div>
              <div id="result-wrong-num" class="tabular-nums" style="font-size:20px;font-weight:700;color:var(--danger);"></div>
            </div>
          </div>
          <p id="result-note" style="margin:0;font-size:12px;color:var(--grey);line-height:1.55;"></p>
        </div>

        <div style="display:flex;flex-direction:column;min-height:0;">
          <div style="padding:12px 18px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <strong id="result-list-title" style="font-size:14px;"></strong>
            <span style="font-size:12px;color:var(--grey2);">点击朗读</span>
          </div>
          <div id="result-list" class="scroll-inner" style="flex:1;min-height:0;padding:0 18px;"></div>
        </div>
      </main>

      <footer style="flex-shrink:0;display:flex;gap:10px;width:100%;">
        <button type="button" id="btn-result-home" class="btn-secondary" style="flex:1;min-width:0;min-height:46px;font-size:13px;">回首页</button>
        <button type="button" id="btn-result-retry" class="btn-secondary hidden" style="flex:1;min-width:0;min-height:46px;font-size:13px;color:var(--danger);border-color:#F6D0D2;"></button>
        <button type="button" id="btn-result-checkin" class="btn-primary" style="flex:1.4;min-width:0;min-height:46px;font-size:13px;">去打卡 · 生成战绩卡</button>
      </footer>
    </section>

    <!-- 6. WRONG -->
    <section id="screen-wrong" class="screen" aria-label="错题本">
      <header class="top-bar">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;">
          <button type="button" class="btn-secondary" id="btn-wrong-back" style="min-width:44px;min-height:44px;padding:0 12px;font-size:13px;">返回</button>
          <div style="min-width:0;">
            <h1 id="wrong-title" class="tabular-nums" style="margin:0;font-size:17px;"></h1>
            <p style="margin:2px 0 0;font-size:12px;color:var(--grey);">按记忆曲线第 1、2、4、7、15 天再复习，5 次都对就移出</p>
          </div>
        </div>
      </header>

      <main class="surface-card" style="flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;">
        <div id="wrong-list" class="scroll-inner" style="flex:1;min-height:0;padding:0 18px;"></div>
      </main>

      <footer style="flex-shrink:0;display:flex;gap:12px;width:100%;">
        <button type="button" id="btn-wrong-home" class="btn-secondary" style="flex:1;min-width:0;min-height:46px;font-size:14px;">回首页</button>
        <button type="button" id="btn-wrong-practice" class="btn-primary" style="flex:1.4;min-width:0;min-height:46px;font-size:14px;">只练这些错词</button>
      </footer>
    </section>

    <!-- 7. CHECKIN -->
    <section id="screen-checkin" class="screen" aria-label="打卡与战绩卡">
      <header class="top-bar" style="flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:8px;">
          <button type="button" class="btn-secondary" id="btn-checkin-back" style="min-width:44px;min-height:44px;padding:0 12px;font-size:13px;">返回</button>
          <h1 style="margin:0;font-size:17px;">打卡与战绩卡</h1>
        </div>
        <div class="tabular-nums" style="display:flex;gap:14px;font-size:13px;">
          <span>连续打卡 <strong id="ck-streak" style="color:var(--p1);">0</strong> 天</span>
          <span>累计打卡 <strong id="ck-total-days">0</strong> 天</span>
          <span>累计背词 <strong id="ck-learned">0</strong> 词</span>
        </div>
      </header>

      <main class="surface-card split-card">
        <div style="background:var(--soft);padding:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--line);min-height:0;">
          <div style="position:relative;height:100%;max-height:450px;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;">
            <canvas id="poster-canvas" width="1080" height="1440" style="width:100%;height:100%;object-fit:contain;border-radius:12px;box-shadow:0 8px 24px rgba(30,96,200,.14);"></canvas>
          </div>
          <p id="ck-preview-note" class="hidden" style="margin:8px 0 0;font-size:12px;color:var(--amber);text-align:center;"></p>
        </div>

        <div class="scroll-inner" style="padding:18px;display:flex;flex-direction:column;justify-content:space-between;gap:12px;min-height:0;">
          <div style="display:flex;flex-direction:column;gap:10px;flex-shrink:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <label for="ck-nickname" style="font-size:12px;font-weight:600;color:var(--grey);">战绩卡昵称（最多 12 字）</label>
              <input id="ck-nickname" type="text" maxlength="12" style="width:180px;padding:6px 10px;border-radius:8px;border:1px solid #DCE5F2;background:#F8FBFF;font-size:13px;" />
            </div>
            <div style="display:flex;gap:10px;width:100%;">
              <button type="button" id="btn-save-poster" class="btn-primary" style="flex:1;min-width:0;min-height:44px;font-size:13px;">保存战绩卡</button>
              <button type="button" id="btn-copy-checkin" class="btn-secondary" style="flex:1;min-width:0;min-height:44px;font-size:13px;">复制打卡文案</button>
            </div>
            <p id="ck-action-msg" class="hidden" style="margin:0;font-size:12px;font-weight:500;"></p>
          </div>

          <div style="padding-top:10px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <strong id="cal-month-title" class="tabular-nums" style="font-size:13px;"></strong>
              <div style="display:flex;gap:6px;">
                <button type="button" id="btn-cal-prev" class="btn-secondary" style="width:30px;height:30px;font-size:12px;">&lt;</button>
                <button type="button" id="btn-cal-next" class="btn-secondary" style="width:30px;height:30px;font-size:12px;">&gt;</button>
              </div>
            </div>
            <div class="cal-grid" style="font-size:11px;color:var(--grey2);">
              <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div><div>日</div>
            </div>
            <div class="cal-grid tabular-nums" id="cal-days-grid"></div>
            <p style="margin:0;font-size:11px;color:var(--grey2);">蓝底日期代表已完成打卡，点击可切换预览当天战绩卡</p>
          </div>
        </div>
      </main>
    </section>
  </div>

  <!-- MODAL ROOT -->
  <div id="modal-root" class="modal-backdrop hidden" role="dialog" aria-modal="true">
    <div class="surface-card modal-card" id="modal-card"></div>
  </div>

  <script>
    (function () {
      'use strict';

      var STORAGE_KEY = 'vocab-booster-pro.v1';
      var SRS_INTERVALS = [1, 2, 4, 7, 15];
      var DAILY_SIZE_OPTIONS = [5, 7, 10, 15, 20, 30];
      var BUILTIN_DECKS = ${JSON.stringify(BUILTIN_DECKS)};
      var DAILY_QUOTES = ${JSON.stringify(DAILY_QUOTES)};

      var MASTER_DICT = {};
      BUILTIN_DECKS.forEach(function (d) {
        d.words.forEach(function (w) {
          var k = w.word.toLowerCase();
          if (!MASTER_DICT[k]) MASTER_DICT[k] = w;
        });
      });

      var lastActionClickTime = 0;
      function guardClick(btn, fn, skipDebounce) {
        if (btn) btn.blur();
        if (!skipDebounce) {
          var now = Date.now();
          if (now - lastActionClickTime < 150) return;
          lastActionClickTime = now;
        }
        fn();
      }

      function esc(str) {
        return String(str || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      function formatLocalDate(dt) {
        var d = dt || new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      }
      function parseLocalDate(str) {
        var p = str.split('-').map(Number);
        return new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
      }
      function addDays(str, delta) {
        var d = parseLocalDate(str);
        d.setDate(d.getDate() + delta);
        return formatLocalDate(d);
      }
      function getDayNumber(firstDate, today) {
        var ms = parseLocalDate(today).getTime() - parseLocalDate(firstDate).getTime();
        return Math.max(1, Math.round(ms / 86400000) + 1);
      }
      function speakWord(word) {
        if (!window.speechSynthesis || !word) return;
        try {
          window.speechSynthesis.cancel();
          var u = new SpeechSynthesisUtterance(word);
          u.lang = 'en-US';
          u.rate = 0.95;
          window.speechSynthesis.speak(u);
        } catch (e) {}
      }

      function createEmptyDeckProgress(today) {
        return { firstDate: today, cursor: 0, daily: {}, wrong: {}, srs: {}, learned: [] };
      }

      function createInitialState(today) {
        var decks = {};
        BUILTIN_DECKS.forEach(function (d) { decks[d.id] = createEmptyDeckProgress(today); });
        return {
          version: 1,
          activeDeckId: 'cet4',
          dailySize: 7,
          maskEnabled: true,
          nickname: 'TCAMP 同学',
          decks: decks,
          customDecks: [],
          globalCheckins: {},
          deckOverrides: {}
        };
      }

      var TODAY = formatLocalDate();
      var state = createInitialState(TODAY);

      function showStorageAlert(msg) {
        var box = document.getElementById('storage-alert');
        document.getElementById('storage-alert-text').textContent = msg;
        box.classList.remove('hidden');
      }
      document.getElementById('storage-alert-close').addEventListener('click', function () {
        document.getElementById('storage-alert').classList.add('hidden');
      });

      function loadState() {
        try {
          var raw = window.localStorage.getItem(STORAGE_KEY);
          if (!raw) return;
          var parsed = JSON.parse(raw);
          if (!parsed || typeof parsed !== 'object') return;
          var base = createInitialState(TODAY);
          var mergedDecks = Object.assign({}, base.decks, parsed.decks || {});
          BUILTIN_DECKS.forEach(function (bd) {
            if (!mergedDecks[bd.id]) mergedDecks[bd.id] = createEmptyDeckProgress(TODAY);
          });
          state = {
            version: 1,
            activeDeckId: parsed.activeDeckId || base.activeDeckId,
            dailySize: parsed.dailySize > 0 ? parsed.dailySize : 7,
            maskEnabled: typeof parsed.maskEnabled === 'boolean' ? parsed.maskEnabled : true,
            nickname: parsed.nickname ? String(parsed.nickname).slice(0, 12) : 'TCAMP 同学',
            decks: mergedDecks,
            customDecks: Array.isArray(parsed.customDecks) ? parsed.customDecks : [],
            globalCheckins: parsed.globalCheckins || {},
            deckOverrides: parsed.deckOverrides || {}
          };
        } catch (e) {
          showStorageAlert('当前浏览器限制了本地缓存读取，进度可能无法长期保存。');
        }
      }

      function saveState() {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          showStorageAlert('当前浏览器限制了本地缓存写入（如无痕模式），关闭页面后数据会丢失。');
        }
      }

      function getAllDecks() {
        var ovs = state.deckOverrides || {};
        var builtins = BUILTIN_DECKS.map(function (bd) {
          var ov = ovs[bd.id];
          return ov ? Object.assign({}, bd, { name: ov.name || bd.name, words: ov.words || bd.words }) : bd;
        });
        var custom = state.customDecks.map(function (cd) {
          return { id: cd.id, name: cd.name, subtitle: cd.subtitle || '自定义词库', builtin: false, words: cd.words || [] };
        });
        return builtins.concat(custom);
      }

      function getActiveDeck() {
        var all = getAllDecks();
        return all.find(function (d) { return d.id === state.activeDeckId; }) || all[0];
      }

      function getDeckProgress(deckId) {
        if (!state.decks[deckId]) state.decks[deckId] = createEmptyDeckProgress(TODAY);
        return state.decks[deckId];
      }

      function ensureTodayRecord(deck, dailySize) {
        var prog = getDeckProgress(deck.id);
        var words = deck.words;
        var existing = prog.daily[TODAY];
        if (words.length === 0) {
          prog.daily[TODAY] = { targetSize: dailySize, queue: [], studiedWords: [], unknownWords: [], checked: false, newCount: 0, reviewCount: 0 };
          return prog.daily[TODAY];
        }
        var targetCount = Math.max(1, Math.min(dailySize, words.length));
        if (existing && existing.targetSize === targetCount && existing.queue.length > 0) return existing;

        var wordSet = new Set(words.map(function (w) { return w.word; }));
        var learnedSet = new Set(prog.learned);
        var studiedWords = existing ? existing.studiedWords.filter(function (w) { return wordSet.has(w); }) : [];
        var studiedSet = new Set(studiedWords);

        var nextQueue = [];
        if (existing && existing.queue.length > 0) {
          var keptStudied = existing.queue.filter(function (q) { return studiedSet.has(q.word); });
          var keptPending = existing.queue.filter(function (q) { return !studiedSet.has(q.word) && wordSet.has(q.word); });
          if (keptStudied.length >= targetCount) nextQueue = keptStudied;
          else nextQueue = keptStudied.concat(keptPending.slice(0, targetCount - keptStudied.length));
        }

        if (nextQueue.length < targetCount) {
          var inQ = new Set(nextQueue.map(function (q) { return q.word; }));
          var rem = targetCount - nextQueue.length;
          var due = [];
          words.forEach(function (w) {
            if (inQ.has(w.word)) return;
            var sr = prog.srs[w.word];
            var wr = prog.wrong[w.word];
            if ((wr && wr.next <= TODAY) || (sr && !sr.mastered && sr.next <= TODAY)) due.push(w.word);
          });
          var hasNew = nextQueue.some(function (q) { return q.kind === 'new'; });
          var maxRev = !hasNew && rem >= 1 ? Math.max(0, rem - 1) : rem;
          due.slice(0, maxRev).forEach(function (rw) { nextQueue.push({ word: rw, kind: 'review' }); inQ.add(rw); });

          var cursor = prog.cursor % words.length;
          var safety = 0;
          while (nextQueue.length < targetCount && safety < words.length) {
            var cand = words[cursor].word;
            cursor = (cursor + 1) % words.length;
            safety++;
            if (!inQ.has(cand) && !learnedSet.has(cand)) { nextQueue.push({ word: cand, kind: 'new' }); inQ.add(cand); }
          }
          safety = 0;
          while (nextQueue.length < targetCount && safety < words.length) {
            var cand2 = words[cursor].word;
            cursor = (cursor + 1) % words.length;
            safety++;
            if (!inQ.has(cand2)) { nextQueue.push({ word: cand2, kind: 'new' }); inQ.add(cand2); }
          }
        }

        var rec = {
          targetSize: targetCount,
          queue: nextQueue,
          studiedWords: studiedWords,
          unknownWords: existing ? existing.unknownWords : [],
          quiz: existing ? existing.quiz : undefined,
          checked: existing ? existing.checked : false,
          newCount: nextQueue.filter(function (q) { return q.kind === 'new'; }).length,
          reviewCount: nextQueue.filter(function (q) { return q.kind === 'review'; }).length
        };
        prog.daily[TODAY] = rec;
        return rec;
      }

      function applyWordOutcome(prog, word, isCorrect) {
        var prevSrs = prog.srs[word];
        var prevWrong = prog.wrong[word];
        if (prog.learned.indexOf(word) === -1) prog.learned.push(word);

        if (isCorrect) {
          var nextStreak = Math.min(5, (prevSrs ? prevSrs.streak : 0) + 1);
          if (nextStreak >= 5) {
            prog.srs[word] = { stage: 5, streak: 5, next: addDays(TODAY, 15), last: TODAY, mastered: true };
            delete prog.wrong[word];
          } else {
            var idx = Math.min(SRS_INTERVALS.length - 1, nextStreak);
            var nextDate = addDays(TODAY, SRS_INTERVALS[idx]);
            prog.srs[word] = { stage: nextStreak, streak: nextStreak, next: nextDate, last: TODAY, mastered: false };
            if (prog.wrong[word]) {
              prog.wrong[word].stage = nextStreak;
              prog.wrong[word].streak = nextStreak;
              prog.wrong[word].next = nextDate;
              prog.wrong[word].last = TODAY;
            }
          }
        } else {
          var nextD = addDays(TODAY, SRS_INTERVALS[0]);
          prog.srs[word] = { stage: 0, streak: 0, next: nextD, last: TODAY, mastered: false };
          prog.wrong[word] = {
            n: (prevWrong ? prevWrong.n : 0) + 1,
            added: prevWrong ? prevWrong.added : TODAY,
            last: TODAY, stage: 0, streak: 0, next: nextD
          };
        }
      }

      function computeStreak() {
        var cur = state.globalCheckins[TODAY] ? TODAY : addDays(TODAY, -1);
        var s = 0;
        while (state.globalCheckins[cur]) { s++; cur = addDays(cur, -1); }
        return s;
      }

      function splitExampleWithTarget(example, target) {
        var clean = target.trim();
        var escT = clean.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
        var lower = clean.toLowerCase();
        var stems = [escT];
        if (lower.endsWith('e') && lower.length > 3) stems.push(lower.slice(0, -1).replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'));
        if (lower.endsWith('y') && lower.length > 3) stems.push((lower.slice(0, -1) + 'i').replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'));
        var re = new RegExp('\\\\b(' + stems.join('|') + ')(?:s|es|ed|d|ing|ies|ied|ly|er|est)?\\\\b', 'gi');
        var parts = [];
        var last = 0;
        var m;
        while ((m = re.exec(example)) !== null) {
          if (m.index > last) parts.push({ text: example.slice(last, m.index), isTarget: false });
          parts.push({ text: m[0], isTarget: true });
          last = m.index + m[0].length;
        }
        if (last < example.length) parts.push({ text: example.slice(last), isTarget: false });
        return parts.length ? parts : [{ text: example, isTarget: false }];
      }

      function resolveEntry(deck, word) {
        return deck.words.find(function (w) { return w.word === word || w.word.toLowerCase() === word.toLowerCase(); }) || MASTER_DICT[word.toLowerCase()] || null;
      }

      // Screen Router
      var currentScreen = 'home';
      function show(name) {
        currentScreen = name;
        document.querySelectorAll('.screen').forEach(function (el) { el.classList.remove('active'); });
        var target = document.getElementById('screen-' + name);
        if (target) target.classList.add('active');
        if (name === 'home') renderHome();
        if (name === 'wrong') renderWrong();
        if (name === 'checkin') renderCheckin();
      }
      window.show = show;

      // HOME
      function renderHome() {
        var deck = getActiveDeck();
        var prog = getDeckProgress(deck.id);
        var rec = ensureTodayRecord(deck, state.dailySize);
        saveState();

        var dayNum = getDayNumber(prog.firstDate, TODAY);
        var streak = computeStreak();
        var totalToday = rec.queue.length;
        var studied = rec.studiedWords.length;
        var rem = Math.max(0, totalToday - studied);
        var allDone = totalToday > 0 && studied >= totalToday;
        var quizDone = !!rec.quiz;

        document.getElementById('home-deck-name').textContent = deck.name;
        document.getElementById('home-day-num').textContent = '第 ' + dayNum + ' 天';
        document.getElementById('home-streak').textContent = streak;
        document.getElementById('home-headline').textContent = allDone ? (quizDone ? '今天的词和小测都完成了' : '今日背词已完成，待做小测') : ('今天还有 ' + rem + ' 个词没背');
        document.getElementById('home-sub').textContent = '新词 ' + rec.newCount + ' · 复习 ' + rec.reviewCount + ' · 词库共 ' + deck.words.length + ' 词';

        var sizeBar = document.getElementById('size-bar');
        sizeBar.innerHTML = '';
        DAILY_SIZE_OPTIONS.forEach(function (sz) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'size-btn tabular-nums' + (state.dailySize === sz ? ' active' : '');
          b.textContent = String(sz);
          b.addEventListener('click', function () {
            guardClick(b, function () {
              state.dailySize = sz;
              ensureTodayRecord(deck, sz);
              saveState();
              renderHome();
            });
          });
          sizeBar.appendChild(b);
        });

        var ratio = totalToday > 0 ? Math.min(1, studied / totalToday) : 0;
        document.getElementById('home-progress-bar').style.width = Math.round(ratio * 100) + '%';
        document.getElementById('home-ring-fg').setAttribute('stroke-dashoffset', String(289.03 * (1 - ratio)));
        document.getElementById('home-ring-num').textContent = studied + '/' + totalToday;
        document.getElementById('home-ring-label').textContent = studied === 0 ? '今天还没开始' : (allDone ? (quizDone ? '今日已打卡' : '待完成小测') : '今日进度');

        var cta = document.getElementById('btn-home-cta');
        cta.disabled = totalToday === 0 || (allDone && quizDone);
        if (totalToday === 0) cta.textContent = '当前词库为空';
        else if (!allDone && studied > 0) cta.textContent = '继续今天的学习（第 ' + (studied + 1) + ' 个） →';
        else if (allDone && !quizDone) cta.textContent = '去做今天的小测 →';
        else if (allDone && quizDone) cta.textContent = '今天已全部完成';
        else cta.textContent = '开始今天的学习 →';

        // Week strip
        var dt = parseLocalDate(TODAY);
        var jsDay = dt.getDay();
        var monOff = jsDay === 0 ? -6 : 1 - jsDay;
        var labels = ['一', '二', '三', '四', '五', '六', '日'];
        var weekGrid = document.getElementById('home-week-grid');
        weekGrid.innerHTML = '';
        var checkedWeek = 0;
        for (var i = 0; i < 7; i++) {
          var d = new Date(dt);
          d.setDate(dt.getDate() + monOff + i);
          var iso = formatLocalDate(d);
          var chk = !!state.globalCheckins[iso];
          if (chk) checkedWeek++;
          var isToday = iso === TODAY;
          var cell = document.createElement('div');
          cell.className = 'week-cell' + (isToday ? ' today' : '') + (chk ? ' checked' : '');
          cell.innerHTML =
            '<span style="font-size:11px;font-weight:500;color:' + (isToday ? 'var(--p1)' : 'var(--grey)') + ';">' + labels[i] + '</span>' +
            '<div style="height:20px;margin:4px 0;display:flex;align-items:center;justify-content:center;">' +
            (chk ? '<span style="width:18px;height:18px;border-radius:999px;background:var(--p1);color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;">✓</span>' :
              (isToday ? '<span style="width:9px;height:9px;border-radius:999px;background:var(--p1);"></span>' : '<span style="width:12px;height:2px;background:#D5DFEE;"></span>')) +
            '</div>' +
            '<span class="tabular-nums" style="font-size:10px;color:var(--grey2);">' + (d.getMonth() + 1) + '/' + d.getDate() + '</span>';
          weekGrid.appendChild(cell);
        }
        document.getElementById('week-checked-count').textContent = '已打卡 ' + checkedWeek + ' 天';

        var narrow = window.innerWidth < 520;
        var wrongCount = Object.keys(prog.wrong).length;
        document.getElementById('btn-entry-today').textContent = narrow ? ('今日 ' + totalToday) : ('今日词表（' + totalToday + ' 个）');
        document.getElementById('btn-entry-wrong').textContent = narrow ? ('错题本 ' + wrongCount) : ('错题本（' + wrongCount + ' 个）');
        document.getElementById('btn-entry-all').textContent = narrow ? ('全部 ' + deck.words.length + ' 词') : ('浏览全部 ' + deck.words.length + ' 词');
        var mastered = Object.values(prog.srs).filter(function (s) { return s.mastered; }).length;
        document.getElementById('home-deck-footer').textContent = '当前词库：' + deck.words.length + ' 词 · 已接触 ' + prog.learned.length + ' · 已掌握 ' + mastered;
      }

      // STUDY SESSION
      var studyQueue = [];
      var studyIdx = 0;
      var studyRevealed = false;
      var studyExampleRevealed = false;
      var studyUnknownMode = false;
      var studyTab = 'memo';
      var studyUndoStack = [];
      var advanceTimer = null;

      function startStudy() {
        var deck = getActiveDeck();
        var rec = ensureTodayRecord(deck, state.dailySize);
        var studiedSet = new Set(rec.studiedWords);
        studyQueue = [];
        rec.queue.forEach(function (q) {
          if (!studiedSet.has(q.word)) {
            var entry = resolveEntry(deck, q.word);
            if (entry) studyQueue.push({ entry: entry, kind: q.kind, isRequeued: false });
          }
        });
        if (studyQueue.length === 0) { show('done'); renderDone(); return; }
        studyIdx = 0;
        studyUndoStack = [];
        show('study');
        renderStudyCard();
      }

      function renderStudyCard() {
        if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
        var deck = getActiveDeck();
        var prog = getDeckProgress(deck.id);
        var rec = ensureTodayRecord(deck, state.dailySize);
        var item = studyQueue[studyIdx];
        if (!item) { show('done'); renderDone(); return; }

        studyRevealed = !state.maskEnabled;
        studyExampleRevealed = !state.maskEnabled;
        studyUnknownMode = false;
        studyTab = 'memo';

        var total = rec.queue.length;
        var done = rec.studiedWords.length;
        var rqLeft = studyQueue.slice(studyIdx).filter(function (x) { return x.isRequeued; }).length;
        var pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
        document.getElementById('study-progress-text').textContent = '第 ' + Math.min(total, done + 1) + ' / ' + total + ' 个 · 已掌握 ' + done + (rqLeft > 0 ? (' · 待重现 ' + rqLeft) : '');
        document.getElementById('study-progress-pct').textContent = pct + '%';
        document.getElementById('study-progress-bar').style.width = pct + '%';
        document.getElementById('btn-toggle-mask').textContent = state.maskEnabled ? '遮罩自测：开' : '遮罩自测：关';

        var tagEl = document.getElementById('study-status-tag');
        tagEl.textContent = item.isRequeued ? '重现巩固' : (item.kind === 'review' ? '记忆复习' : '新词');
        tagEl.style.color = item.isRequeued ? 'var(--amber)' : (item.kind === 'review' ? 'var(--green)' : 'var(--p1)');

        var wr = prog.wrong[item.entry.word];
        var sr = prog.srs[item.entry.word];
        var streakLevel = wr ? wr.streak : (sr ? sr.streak : 0);
        var sIdx = Math.min(4, Math.max(0, streakLevel));
        var dots = '';
        for (var i = 0; i < 5; i++) dots += '<span style="display:inline-block;width:6px;height:6px;border-radius:999px;background:' + (i < streakLevel ? 'var(--p1)' : '#DCE5F2') + ';margin-right:3px;"></span>';
        var sLabel = (streakLevel > 0 || wr) ? ('第 ' + (sIdx + 1) + ' 档 · ' + SRS_INTERVALS[sIdx] + ' 天后复习') : '首轮记忆';
        document.getElementById('study-srs-wrap').innerHTML = dots + '<span style="font-size:11px;">' + sLabel + '</span>';

        document.getElementById('study-word').textContent = item.entry.word;
        document.getElementById('study-phonetic').textContent = item.entry.phonetic;
        document.getElementById('study-pos').textContent = item.entry.pos;
        document.getElementById('study-meaning').innerHTML = '<span style="color:var(--p1);margin-right:6px;">' + esc(item.entry.pos) + '</span>' + esc(item.entry.meaning);
        document.getElementById('study-example-zh').textContent = item.entry.exampleZh;
        document.getElementById('m-memo').textContent = item.entry.memo;
        document.getElementById('m-coll').textContent = item.entry.collocations;
        document.getElementById('m-fam').textContent = item.entry.family;
        document.getElementById('m-conf').textContent = item.entry.confusable;

        updateStudyRevealUI();
        updateStudyUndoUI();
        speakWord(item.entry.word);
      }

      function updateStudyRevealUI() {
        var item = studyQueue[studyIdx];
        var hlVisible = !state.maskEnabled || studyRevealed || studyExampleRevealed;
        if (item) {
          document.getElementById('study-example').innerHTML = splitExampleWithTarget(item.entry.example, item.entry.word).map(function (p) {
            if (!p.isTarget) return esc(p.text);
            var blurStyle = hlVisible ? 'filter:blur(0px);transition:filter 220ms ease;' : 'filter:blur(5px);transition:filter 220ms ease;user-select:none;';
            return '<mark class="word-hl" style="' + blurStyle + '">' + esc(p.text) + '</mark>';
          }).join('');
          var stEl = document.getElementById('study-example-status');
          if (stEl) {
            stEl.textContent = hlVisible ? '高亮词汇已揭开 · 点击重听' : '点击例句即时揭开高亮词汇';
            stEl.style.color = hlVisible ? 'var(--green)' : 'var(--p1)';
          }
        }

        document.getElementById('btn-study-reveal').classList.toggle('hidden', studyRevealed);
        var meaningWrap = document.getElementById('study-revealed-meaning');
        if (meaningWrap) {
          meaningWrap.style.filter = studyRevealed ? 'blur(0px)' : 'blur(9px)';
          meaningWrap.style.opacity = studyRevealed ? '1' : '0.45';
          meaningWrap.style.transform = studyRevealed ? 'scale(1)' : 'scale(0.985)';
        }
        document.getElementById('study-right-masked').classList.toggle('hidden', studyRevealed);
        document.getElementById('study-right-content').classList.toggle('hidden', !studyRevealed);
        document.getElementById('study-mobile-mask-note').classList.toggle('hidden', studyRevealed);
        document.getElementById('study-mobile-tabs-inner').classList.toggle('hidden', !studyRevealed);

        document.getElementById('study-actions-normal').classList.toggle('hidden', studyUnknownMode);
        document.getElementById('study-actions-requeue').classList.toggle('hidden', !studyUnknownMode);

        if (studyRevealed && item) {
          var tabs = [
            { k: 'memo', l: '怎么记' }, { k: 'collocations', l: '常用搭配' },
            { k: 'family', l: '同族派生' }, { k: 'confusable', l: '易错辨析' }
          ];
          var tabWrap = document.getElementById('study-tab-buttons');
          tabWrap.innerHTML = '';
          tabs.forEach(function (t) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = t.l;
            b.style.cssText = 'flex:1;padding:4px;font-size:11px;border:none;border-radius:8px;cursor:pointer;' +
              (studyTab === t.k ? 'background:var(--soft2);color:var(--p1);font-weight:600;' : 'background:transparent;color:var(--grey);');
            b.addEventListener('click', function () {
              guardClick(b, function () { studyTab = t.k; updateStudyRevealUI(); });
            });
            tabWrap.appendChild(b);
          });
          document.getElementById('study-mobile-tab-content').textContent = item.entry[studyTab] || '';
        }
      }

      function updateStudyUndoUI() {
        var btn = document.getElementById('btn-study-undo');
        var hint = document.getElementById('study-undo-hint');
        if (studyUndoStack.length > 0) {
          var last = studyUndoStack[studyUndoStack.length - 1];
          document.getElementById('study-undo-text').textContent = '上一词：' + last.word + '（' + last.meaning + '） · 误点撤回';
          btn.classList.remove('hidden');
          hint.classList.add('hidden');
        } else {
          btn.classList.add('hidden');
          hint.classList.remove('hidden');
        }
      }

      function handleStudyUnknown() {
        if (studyUnknownMode || advanceTimer) return;
        var deck = getActiveDeck();
        var prog = getDeckProgress(deck.id);
        var rec = ensureTodayRecord(deck, state.dailySize);
        var item = studyQueue[studyIdx];
        if (!item) return;

        studyRevealed = true;
        studyUnknownMode = true;
        if (rec.unknownWords.indexOf(item.entry.word) === -1) rec.unknownWords.push(item.entry.word);
        applyWordOutcome(prog, item.entry.word, false);
        studyQueue.push({ entry: item.entry, kind: item.kind, isRequeued: true });
        saveState();
        updateStudyRevealUI();
      }

      function commitKnownAndNext() {
        var deck = getActiveDeck();
        var prog = getDeckProgress(deck.id);
        var rec = ensureTodayRecord(deck, state.dailySize);
        var item = studyQueue[studyIdx];
        if (!item) return;

        studyUndoStack.push({
          prevIdx: studyIdx,
          prevQueue: studyQueue.slice(),
          prevProg: JSON.parse(JSON.stringify(prog)),
          word: item.entry.word,
          meaning: item.entry.meaning
        });

        var w = item.entry.word;
        var alreadyStudied = rec.studiedWords.indexOf(w) !== -1;
        var wasUnknown = rec.unknownWords.indexOf(w) !== -1;
        if (!alreadyStudied && (item.isRequeued || !wasUnknown)) {
          rec.studiedWords.push(w);
          if (!wasUnknown) applyWordOutcome(prog, w, true);
          if (item.kind === 'new' && deck.words.length > 0) prog.cursor = (prog.cursor + 1) % deck.words.length;
        }
        saveState();

        if (studyIdx + 1 >= studyQueue.length) { show('done'); renderDone(); }
        else { studyIdx++; renderStudyCard(); }
      }

      function handleStudyKnown() {
        if (advanceTimer) return;
        if (studyUnknownMode) { commitKnownAndNext(); return; }
        if (state.maskEnabled && !studyRevealed) {
          studyRevealed = true;
          updateStudyRevealUI();
          advanceTimer = setTimeout(function () { advanceTimer = null; commitKnownAndNext(); }, 280);
          return;
        }
        commitKnownAndNext();
      }

      function renderDone() {
        var deck = getActiveDeck();
        var rec = ensureTodayRecord(deck, state.dailySize);
        document.getElementById('done-title').textContent = '今日 ' + rec.queue.length + ' 个词已学完';
        document.getElementById('done-sub').textContent = '接下来做 ' + rec.queue.length + ' 道题，做完就算今天打卡';
        document.getElementById('done-meta').textContent = '选择题（同词性干扰）与听音拼写题交替 · 本轮标记不认识 ' + rec.unknownWords.length + ' 个';
      }

      // QUIZ
      var quizQs = [];
      var quizIdx = 0;
      var quizOutcomes = [];
      var quizIsDaily = true;
      var quizChosen = null;
      var spellState = 'idle';
      var spellDiff = null;
      var spellHadErr = false;

      function pickDistractors(target, deckWords, seed) {
        var pool = deckWords.filter(function (w) { return w.word.toLowerCase() !== target.word.toLowerCase() && w.meaning !== target.meaning; });
        if (pool.length < 6) {
          Object.values(MASTER_DICT).forEach(function (w) {
            if (pool.length < 40 && w.word.toLowerCase() !== target.word.toLowerCase() && w.meaning !== target.meaning) pool.push(w);
          });
        }
        var tPos = target.pos.trim().toLowerCase();
        var tCh = target.word.charAt(0).toLowerCase();
        var tLen = target.word.length;
        return pool.map(function (c, idx) {
          var score = (c.pos.trim().toLowerCase() === tPos ? 10 : 0) +
            (c.word.charAt(0).toLowerCase() === tCh ? 4 : 0) +
            (Math.abs(c.word.length - tLen) <= 2 ? 3 : 0) + (((idx * 31 + seed * 17) % 97) / 100);
          return { entry: c, score: score };
        }).sort(function (a, b) { return b.score - a.score; }).slice(0, 3).map(function (s) { return s.entry; });
      }

      function startQuiz(entries, isDaily) {
        var deck = getActiveDeck();
        var labels = ['A', 'B', 'C', 'D'];
        quizIsDaily = isDaily;
        quizOutcomes = [];
        quizIdx = 0;
        quizQs = entries.map(function (entry, idx) {
          var type = idx % 2 === 0 ? 'choice' : 'spell';
          if (type === 'spell') return { type: 'spell', word: entry };
          var dist = pickDistractors(entry, deck.words, idx + 3);
          var raw = [{ meaning: entry.meaning, isCorrect: true }].concat(dist.map(function (d) { return { meaning: d.meaning, isCorrect: false }; }));
          var hash = entry.word.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, idx + 5);
          var opts = raw.map(function (_, i) {
            var item = raw[(i + hash) % raw.length];
            return { label: labels[i], meaning: item.meaning, isCorrect: item.isCorrect };
          });
          return { type: 'choice', word: entry, options: opts };
        });
        show('quiz');
        renderQuizQ();
      }

      function renderQuizQ() {
        var q = quizQs[quizIdx];
        if (!q) return;
        quizChosen = null;
        spellState = 'idle';
        spellDiff = null;
        spellHadErr = false;

        var total = quizQs.length;
        var pct = Math.round((quizIdx / total) * 100);
        document.getElementById('quiz-progress-text').textContent = '小测第 ' + (quizIdx + 1) + ' / ' + total + ' 题 · ' + (q.type === 'choice' ? '看词选义' : '听音拼写');
        document.getElementById('quiz-progress-pct').textContent = pct + '%';
        document.getElementById('quiz-progress-bar').style.width = pct + '%';

        speakWord(q.word.word);
        var body = document.getElementById('quiz-body');

        if (q.type === 'choice') {
          var exHtml = splitExampleWithTarget(q.word.example, q.word.word).map(function (p) {
            if (!p.isTarget) return esc(p.text);
            return '<span class="cloze-blank" data-word="' + esc(p.text) + '" style="display:inline-block;min-width:54px;border-bottom:2px solid var(--p1);text-align:center;color:var(--p1);font-family:monospace;margin:0 2px;">____</span>';
          }).join('');

          body.innerHTML =
            '<div style="display:flex;flex-direction:column;gap:8px;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">' +
                '<div><h1 style="margin:0;font-size:clamp(26px,4.5vw,38px);">' + esc(q.word.word) + '</h1>' +
                '<div style="font-size:13px;color:var(--grey);margin-top:2px;"><span style="font-family:monospace;">' + esc(q.word.phonetic) + '</span> · <strong style="color:var(--p1);">' + esc(q.word.pos) + '</strong></div></div>' +
                '<button type="button" id="q-speak" style="min-width:44px;min-height:44px;border-radius:999px;background:var(--soft);border:1px solid var(--line);color:var(--p1);padding:0 12px;cursor:pointer;font-size:12px;font-weight:600;">朗读 <kbd class="kbd-hint">Space</kbd></button>' +
              '</div>' +
              '<div style="padding-top:8px;border-top:1px solid var(--line);"><p class="line-clamp-2" style="margin:0;font-size:14px;color:var(--grey);">' + exHtml + '</p></div>' +
            '</div>' +
            '<div class="options-grid" id="q-options">' +
              q.options.map(function (o) {
                return '<button type="button" class="opt-btn" data-label="' + o.label + '">' +
                  '<span style="display:flex;align-items:center;gap:10px;min-width:0;">' +
                    '<span style="width:24px;height:24px;border-radius:6px;background:var(--soft);color:var(--p1);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + o.label + '</span>' +
                    '<span class="line-clamp-2" style="font-size:14px;font-weight:500;">' + esc(o.meaning) + '</span>' +
                  '</span><kbd class="kbd-hint">' + o.label + '</kbd></button>';
              }).join('') +
            '</div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;">' +
              '<span id="q-foot-hint" style="font-size:12px;color:var(--grey);">选择最匹配的中文释义</span>' +
              '<button type="button" id="q-next-btn" class="btn-primary hidden" style="min-height:44px;padding:8px 18px;font-size:14px;">' + (quizIdx + 1 >= total ? '查看成绩' : '下一题') + ' →</button>' +
            '</div>';

          document.getElementById('q-speak').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { speakWord(q.word.word); }, true); });
          document.querySelectorAll('#q-options .opt-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { guardClick(btn, function () { selectChoice(btn.getAttribute('data-label')); }); });
          });
          document.getElementById('q-next-btn').addEventListener('click', function (e) {
            guardClick(e.currentTarget, function () {
              var picked = q.options.find(function (o) { return o.label === quizChosen; });
              advanceQuiz(!!(picked && picked.isCorrect));
            });
          });
        } else {
          var targetClean = q.word.word.trim();
          body.innerHTML =
            '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;">' +
              '<div style="display:flex;gap:8px;">' +
                '<button type="button" id="q-speak" style="min-height:46px;padding:0 18px;border-radius:999px;background:var(--soft);border:1px solid var(--line);color:var(--p1);font-weight:600;font-size:14px;cursor:pointer;">点击听发音 <kbd class="kbd-hint">Space</kbd></button>' +
                '<button type="button" id="q-hint-toggle" class="btn-secondary" style="min-height:44px;padding:0 14px;font-size:12px;">看中文提示</button>' +
              '</div>' +
              '<div id="q-spell-hint" class="tabular-nums" style="font-size:12px;color:var(--grey);">首字母 <strong>' + esc(targetClean.charAt(0)) + '</strong> · 共 ' + targetClean.length + ' 个字符</div>' +
            '</div>' +
            '<div class="spell-slots" id="q-spell-slots"></div>' +
            '<div id="q-spell-feedback" class="hidden"></div>' +
            '<form id="q-spell-form" style="display:flex;gap:10px;flex-shrink:0;">' +
              '<input id="q-spell-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="输入完整英文单词，按回车提交" style="flex:1;min-width:0;min-height:46px;padding:8px 14px;border-radius:12px;border:1px solid #DCE5F2;background:#F8FBFF;font-size:16px;font-family:monospace;" />' +
              '<button type="button" id="q-spell-submit" class="btn-primary" style="min-height:46px;padding:0 18px;font-size:14px;">提交</button>' +
            '</form>';

          renderSpellSlots('');
          var inp = document.getElementById('q-spell-input');
          var showHint = false;
          setTimeout(function () { inp.focus(); }, 50);

          document.getElementById('q-speak').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { speakWord(targetClean); }, true); });
          document.getElementById('q-hint-toggle').addEventListener('click', function (e) {
            guardClick(e.currentTarget, function () {
              showHint = !showHint;
              e.currentTarget.textContent = showHint ? '隐藏中文' : '看中文提示';
              document.getElementById('q-spell-hint').innerHTML = showHint
                ? '<strong style="color:var(--p1);">' + esc(q.word.pos) + '</strong> ' + esc(q.word.meaning)
                : '首字母 <strong>' + esc(targetClean.charAt(0)) + '</strong> · 共 ' + targetClean.length + ' 个字符';
            });
          });
          inp.addEventListener('input', function () { renderSpellSlots(inp.value); });
          document.getElementById('q-spell-form').addEventListener('submit', function (ev) { ev.preventDefault(); submitSpell(); });
          document.getElementById('q-spell-submit').addEventListener('click', function (e) { guardClick(e.currentTarget, submitSpell); });
        }
      }

      function selectChoice(label) {
        if (quizChosen !== null) return;
        quizChosen = label;
        var q = quizQs[quizIdx];
        document.querySelectorAll('#q-options .opt-btn').forEach(function (b) {
          b.disabled = true;
          var l = b.getAttribute('data-label');
          var opt = q.options.find(function (o) { return o.label === l; });
          if (opt.isCorrect) b.classList.add('correct');
          else if (l === label) b.classList.add('wrong');
          else b.classList.add('muted');
        });
        document.querySelectorAll('.cloze-blank').forEach(function (sp) {
          var mark = document.createElement('mark');
          mark.className = 'word-hl';
          mark.textContent = sp.getAttribute('data-word');
          sp.replaceWith(mark);
        });
        document.getElementById('q-foot-hint').textContent = q.word.exampleZh;
        document.getElementById('q-next-btn').classList.remove('hidden');
      }

      function renderSpellSlots(val) {
        var q = quizQs[quizIdx];
        var clean = q.word.word.trim();
        var wrap = document.getElementById('q-spell-slots');
        if (!wrap) return;
        wrap.innerHTML = clean.split('').map(function (ch, i) {
          var typed = val[i] || '';
          var firstHint = i === 0 && !typed && spellState === 'idle';
          var color = spellState === 'passed' ? 'var(--green)' : (typed ? 'var(--ink)' : (firstHint ? 'var(--grey2)' : 'transparent'));
          var border = spellState === 'passed' ? 'var(--green)' : (typed ? 'var(--p1)' : '#DCE5F2');
          return '<span class="spell-slot" style="color:' + color + ';border-bottom-color:' + border + ';margin-left:' + (i > 0 && i % 4 === 0 ? '6px' : '0') + ';">' + esc(typed || (firstHint ? ch : '_')) + '</span>';
        }).join('');
      }

      function submitSpell() {
        var q = quizQs[quizIdx];
        var clean = q.word.word.trim();
        var inp = document.getElementById('q-spell-input');
        if (spellState === 'passed') { advanceQuiz(!spellHadErr); return; }
        var attempt = inp.value.trim().toLowerCase();
        var targetLower = clean.toLowerCase();
        if (attempt === targetLower) {
          spellState = 'passed';
          renderSpellSlots(inp.value);
          if (spellHadErr) { advanceQuiz(false); return; }
          var fb = document.getElementById('q-spell-feedback');
          fb.className = '';
          fb.style.cssText = 'border-radius:12px;background:#ECFDF5;border:1px solid #A7F3D0;padding:8px 12px;text-align:center;font-size:13px;font-weight:600;color:var(--green);';
          fb.textContent = '拼写正确 · ' + clean + '（' + q.word.pos + ' ' + q.word.meaning + '）';
          document.getElementById('q-spell-submit').textContent = quizIdx + 1 >= quizQs.length ? '查看成绩' : '下一题';
        } else {
          spellHadErr = true;
          spellState = 'needs_retype';
          var diffHtml = targetLower.split('').map(function (exp, i) {
            var ok = attempt[i] === exp;
            return '<span style="padding:2px 6px;border-radius:4px;' + (ok ? 'color:var(--green);background:#ECFDF5;' : 'color:var(--danger);background:#fff;text-decoration:underline;') + '">' + esc(exp) + '</span>';
          }).join('');
          var fb2 = document.getElementById('q-spell-feedback');
          fb2.className = '';
          fb2.style.cssText = 'border-radius:12px;background:#FEF2F2;border:1px solid #F6D0D2;padding:10px 12px;text-align:center;';
          fb2.innerHTML = '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px;font-family:monospace;font-size:15px;font-weight:700;">' + diffHtml + '</div>' +
            '<p style="margin:6px 0 0;font-size:12px;color:#B91C1C;">拼写有误，请对照上方正确拼写再敲一遍并按回车继续</p>';
          inp.value = '';
          inp.placeholder = '请再敲一遍 ' + clean + ' 并回车';
          renderSpellSlots('');
          inp.focus();
        }
      }

      function advanceQuiz(isCorrect) {
        var q = quizQs[quizIdx];
        quizOutcomes.push({ entry: q.word, isCorrect: isCorrect });
        if (quizIdx + 1 >= quizQs.length) finishQuiz();
        else { quizIdx++; renderQuizQ(); }
      }

      function finishQuiz() {
        var deck = getActiveDeck();
        var prog = getDeckProgress(deck.id);
        var rec = ensureTodayRecord(deck, state.dailySize);
        quizOutcomes.forEach(function (o) { applyWordOutcome(prog, o.entry.word, o.isCorrect); });
        if (quizIsDaily) {
          var right = quizOutcomes.filter(function (o) { return o.isCorrect; }).length;
          rec.quiz = {
            right: right,
            total: quizOutcomes.length,
            wrongWords: quizOutcomes.filter(function (o) { return !o.isCorrect; }).map(function (o) { return o.entry.word; })
          };
          rec.checked = true;
          state.globalCheckins[TODAY] = true;
        }
        saveState();
        show('result');
        renderResult();
      }

      function renderResult() {
        var total = quizOutcomes.length;
        var right = quizOutcomes.filter(function (o) { return o.isCorrect; }).length;
        var wrong = quizOutcomes.filter(function (o) { return !o.isCorrect; });
        var acc = total > 0 ? Math.round((right / total) * 100) : 0;

        document.getElementById('result-badge').textContent = quizIsDaily ? '今日小测已完成 · 已计入打卡' : '错词专项练习完成';
        document.getElementById('result-score').textContent = right + '/' + total;
        document.getElementById('result-acc').textContent = '正确率 ' + acc + '%';
        document.getElementById('result-right-num').textContent = String(right);
        document.getElementById('result-wrong-num').textContent = String(wrong.length);
        document.getElementById('result-note').textContent = wrong.length > 0
          ? '答错的词已自动记入错题本并重置为第 1 档，明天将优先安排复习。'
          : '本轮全部一次答对，这些词已按记忆曲线推进到下一复习档位。';
        document.getElementById('result-list-title').textContent = '本轮词条明细（' + total + ' 词）';

        var list = document.getElementById('result-list');
        list.innerHTML = quizOutcomes.map(function (o) {
          return '<div style="padding:10px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:10px;">' +
            '<div style="min-width:0;flex:1;">' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<strong style="color:' + (o.isCorrect ? 'var(--ink)' : 'var(--danger)') + ';">' + esc(o.entry.word) + '</strong>' +
                '<span style="font-size:12px;font-family:monospace;color:var(--grey2);">' + esc(o.entry.phonetic) + '</span>' +
                '<span style="font-size:11px;font-weight:600;color:' + (o.isCorrect ? 'var(--green)' : 'var(--danger)') + ';">' + (o.isCorrect ? '对' : '错') + '</span>' +
              '</div>' +
              '<div style="font-size:12px;color:var(--grey);margin-top:2px;">' + esc(o.entry.pos + ' ' + o.entry.meaning) + '</div>' +
            '</div>' +
            '<button type="button" class="btn-secondary res-spk" data-w="' + esc(o.entry.word) + '" style="padding:6px 10px;font-size:11px;">朗读</button>' +
          '</div>';
        }).join('');
        list.querySelectorAll('.res-spk').forEach(function (b) {
          b.addEventListener('click', function () { guardClick(b, function () { speakWord(b.getAttribute('data-w')); }, true); });
        });

        var retryBtn = document.getElementById('btn-result-retry');
        retryBtn.classList.toggle('hidden', wrong.length === 0);
        retryBtn.textContent = '再练错词（' + wrong.length + '）';
        document.getElementById('btn-result-checkin').classList.toggle('hidden', !quizIsDaily);
      }

      // WRONG BOOK
      function renderWrong() {
        var deck = getActiveDeck();
        var prog = getDeckProgress(deck.id);
        var entries = Object.keys(prog.wrong).map(function (w) {
          return { entry: resolveEntry(deck, w), rec: prog.wrong[w] };
        }).filter(function (x) { return !!x.entry; }).sort(function (a, b) {
          return a.rec.next !== b.rec.next ? a.rec.next.localeCompare(b.rec.next) : b.rec.n - a.rec.n;
        });

        document.getElementById('wrong-title').textContent = '错题本（' + entries.length + ' 个）';
        document.getElementById('btn-wrong-practice').disabled = entries.length === 0;
        var list = document.getElementById('wrong-list');

        if (entries.length === 0) {
          list.innerHTML = '<div style="padding:48px 16px;text-align:center;"><strong>错题本暂时为空</strong><p style="font-size:13px;color:var(--grey);margin-top:8px;">背词时点击「不认识」或小测答错的词，会自动收进这里并按 1/2/4/7/15 天记忆曲线安排复习。</p></div>';
          return;
        }
        list.innerHTML = entries.map(function (item) {
          var r = item.rec, e = item.entry;
          var sIdx = Math.min(4, Math.max(0, r.stage));
          var dots = '';
          for (var i = 0; i < 5; i++) dots += '<span style="display:inline-block;width:6px;height:6px;border-radius:999px;background:' + (i < r.streak ? 'var(--p1)' : '#DCE5F2') + ';margin-right:3px;"></span>';
          return '<div style="padding:14px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:12px;">' +
            '<div style="min-width:0;flex:1;">' +
              '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;">' +
                '<strong style="font-size:16px;">' + esc(e.word) + '</strong>' +
                '<span style="font-size:12px;font-family:monospace;color:var(--grey2);">' + esc(e.phonetic) + '</span>' +
                '<button type="button" class="btn-secondary wr-spk" data-w="' + esc(e.word) + '" style="padding:3px 8px;font-size:11px;">朗读</button>' +
                '<span class="tabular-nums" style="font-size:12px;color:var(--danger);font-weight:600;">错 ' + r.n + ' 次</span>' +
              '</div>' +
              '<div style="font-size:13px;margin:4px 0;"><strong style="color:var(--p1);">' + esc(e.pos) + '</strong> ' + esc(e.meaning) + '</div>' +
              '<div style="font-size:12px;color:var(--grey);">怎么记：' + esc(e.memo) + ' · 同族：' + esc(e.family) + '</div>' +
              '<div class="tabular-nums" style="font-size:11px;color:var(--grey);margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                '<span>' + dots + '</span><span>第 ' + (sIdx + 1) + ' 档 · ' + SRS_INTERVALS[sIdx] + ' 天后复习</span> · <span>加入于 ' + r.added + '</span> · <span>下次复习 ' + r.next + '</span>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="btn-secondary wr-done" data-w="' + esc(e.word) + '" style="padding:8px 14px;font-size:12px;color:var(--green);border-color:#BCEAD8;flex-shrink:0;">记住了</button>' +
          '</div>';
        }).join('');

        list.querySelectorAll('.wr-spk').forEach(function (b) { b.addEventListener('click', function () { guardClick(b, function () { speakWord(b.getAttribute('data-w')); }, true); }); });
        list.querySelectorAll('.wr-done').forEach(function (b) {
          b.addEventListener('click', function () {
            guardClick(b, function () {
              var w = b.getAttribute('data-w');
              delete prog.wrong[w];
              prog.srs[w] = { stage: 5, streak: 5, next: addDays(TODAY, 15), last: TODAY, mastered: true };
              saveState();
              renderWrong();
            });
          });
        });
      }

      // CHECKIN & CANVAS POSTER
      var selectedDate = TODAY;
      var calYear = parseLocalDate(TODAY).getFullYear();
      var calMonth = parseLocalDate(TODAY).getMonth() + 1;

      function getQuoteForDate(dStr) {
        var h = 0;
        for (var i = 0; i < dStr.length; i++) h = (h * 31 + dStr.charCodeAt(i)) >>> 0;
        return DAILY_QUOTES[h % DAILY_QUOTES.length];
      }

      function drawRoundRect(ctx, x, y, w, h, r) {
        var rad = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rad, y);
        ctx.arcTo(x + w, y, x + w, y + h, rad);
        ctx.arcTo(x + w, y + h, x, y + h, rad);
        ctx.arcTo(x, y + h, x, y, rad);
        ctx.arcTo(x, y, x + w, y, rad);
        ctx.closePath();
      }

      function wrapLines(ctx, text, maxW, maxLines) {
        var words = text.indexOf(' ') >= 0 ? text.split(' ') : text.split('');
        var joiner = text.indexOf(' ') >= 0 ? ' ' : '';
        var lines = [], cur = '';
        for (var i = 0; i < words.length; i++) {
          var cand = cur ? cur + joiner + words[i] : words[i];
          if (ctx.measureText(cand).width <= maxW) cur = cand;
          else {
            if (cur) lines.push(cur);
            cur = words[i];
            if (lines.length === maxLines - 1) {
              var rest = words.slice(i).join(joiner);
              while (ctx.measureText(rest + '...').width > maxW && rest.length > 1) rest = rest.slice(0, -1);
              lines.push(rest);
              return lines;
            }
          }
        }
        if (cur) lines.push(cur);
        return lines.slice(0, maxLines);
      }

      function drawPoster(data) {
        var canvas = document.getElementById('poster-canvas');
        var ctx = canvas.getContext('2d');
        var FONT = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.save();
        ctx.scale(1.5, 1.5);
        var bg = ctx.createLinearGradient(0, 0, 720, 960);
        bg.addColorStop(0, '#DCEBFF'); bg.addColorStop(0.5, '#EEF6FF'); bg.addColorStop(1, '#F8FBFF');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, 720, 960);

        ctx.save();
        ctx.shadowColor = 'rgba(30,96,200,.16)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
        drawRoundRect(ctx, 26, 26, 668, 908, 30); ctx.fillStyle = '#FFFFFF'; ctx.fill();
        ctx.restore();

        var y = 66;
        // 1. Header
        var dp = data.dateStr.split('-').map(Number);
        ctx.fillStyle = '#6B7385'; ctx.font = '600 18px ' + FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(dp[0] + ' 年 ' + dp[1] + ' 月 ' + dp[2] + ' 日', 60, y + 22);
        ctx.fillStyle = '#1E80FF'; ctx.font = '700 15px ' + FONT; ctx.textAlign = 'right';
        ctx.fillText('TCAMP 每日词汇', 660, y + 22);
        ctx.strokeStyle = '#E6EEF8'; ctx.beginPath(); ctx.moveTo(60, y + 42); ctx.lineTo(660, y + 42); ctx.stroke();
        y += 44 + 24;

        // 2. Hero
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#1E80FF'; ctx.font = '800 92px ' + FONT;
        ctx.fillText(String(data.streak), 60, y + 102);
        var nw = ctx.measureText(String(data.streak)).width;
        ctx.fillStyle = '#14161F'; ctx.font = '600 22px ' + FONT; ctx.fillText('天', 60 + nw + 8, y + 100);
        ctx.fillStyle = '#6B7385'; ctx.font = '500 17px ' + FONT; ctx.fillText('连续打卡天数', 60, y + 138);

        ctx.textAlign = 'right'; ctx.fillStyle = '#14161F'; ctx.font = '700 30px ' + FONT;
        ctx.fillText(data.nickname, 660, y + 66);
        var tagText = data.deckName + ' · 第 ' + data.dayNum + ' 天';
        ctx.font = '600 16px ' + FONT;
        var tw = Math.min(300, ctx.measureText(tagText).width + 28);
        drawRoundRect(ctx, 660 - tw, y + 88, tw, 34, 17); ctx.fillStyle = '#EAF3FF'; ctx.fill();
        ctx.fillStyle = '#1E80FF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(tagText, 660 - tw / 2, y + 105);
        y += 166 + 18;

        // 3. Stats
        drawRoundRect(ctx, 60, y, 290, 84, 16); ctx.fillStyle = '#F3F8FF'; ctx.fill();
        ctx.textAlign = 'left'; ctx.fillStyle = '#6B7385'; ctx.font = '500 15px ' + FONT; ctx.fillText('今日新学', 84, y + 26);
        ctx.fillStyle = '#14161F'; ctx.font = '700 30px ' + FONT; ctx.fillText(data.newCount + ' 词', 84, y + 58);

        drawRoundRect(ctx, 370, y, 290, 84, 16); ctx.fillStyle = '#F3F8FF'; ctx.fill();
        ctx.fillStyle = '#6B7385'; ctx.font = '500 15px ' + FONT; ctx.fillText('记忆复习', 394, y + 26);
        ctx.fillStyle = '#14161F'; ctx.font = '700 30px ' + FONT; ctx.fillText(data.reviewCount + ' 词', 394, y + 58);
        y += 84 + 18;

        // 4. Key Word
        drawRoundRect(ctx, 60, y, 600, 150, 16); ctx.fillStyle = '#FFFFFF'; ctx.fill();
        ctx.strokeStyle = '#E6EEF8'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.textBaseline = 'top'; ctx.fillStyle = '#1E80FF'; ctx.font = '600 13px ' + FONT; ctx.fillText('今日重点词', 84, y + 18);
        if (data.keyWord) {
          ctx.fillStyle = '#14161F'; ctx.font = '700 32px ' + FONT; ctx.fillText(data.keyWord.word, 84, y + 44);
          var ww = ctx.measureText(data.keyWord.word).width;
          ctx.fillStyle = '#6B7385'; ctx.font = '400 17px ' + FONT; ctx.fillText(data.keyWord.phonetic, 84 + ww + 14, y + 54);
          ctx.fillStyle = '#14161F'; ctx.font = '500 19px ' + FONT;
          wrapLines(ctx, data.keyWord.pos + ' ' + data.keyWord.meaning, 552, 2).forEach(function (ln, idx) {
            ctx.fillText(ln, 84, y + 92 + idx * 24);
          });
        }
        y += 150 + 26;

        // 5. Progress
        var ratio = Math.min(1, data.learned / Math.max(1, data.total));
        ctx.textBaseline = 'middle'; ctx.fillStyle = '#14161F'; ctx.font = '600 15px ' + FONT;
        ctx.fillText('词库累计进度：已学 ' + data.learned + ' / ' + data.total + ' 词', 60, y + 12);
        ctx.textAlign = 'right'; ctx.fillStyle = '#1E80FF'; ctx.font = '700 15px ' + FONT;
        ctx.fillText(Math.round(ratio * 100) + '%', 660, y + 12);
        drawRoundRect(ctx, 60, y + 32, 600, 10, 5); ctx.fillStyle = '#EAF3FF'; ctx.fill();
        if (ratio > 0) {
          var bw = Math.max(12, Math.round(600 * ratio));
          var g = ctx.createLinearGradient(60, 0, 60 + bw, 0);
          g.addColorStop(0, '#2B7BF5'); g.addColorStop(1, '#38BDF8');
          drawRoundRect(ctx, 60, y + 32, bw, 10, 5); ctx.fillStyle = g; ctx.fill();
        }
        y += 48 + 26;

        // 6. Quote
        drawRoundRect(ctx, 60, y, 600, 154, 16); ctx.fillStyle = '#F8FBFF'; ctx.fill();
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#14161F'; ctx.font = '600 17px ' + FONT;
        wrapLines(ctx, data.quote.en, 552, 2).forEach(function (ln, idx) { ctx.fillText(ln, 84, y + 22 + idx * 24); });
        ctx.fillStyle = '#6B7385'; ctx.font = '400 16px ' + FONT;
        wrapLines(ctx, data.quote.zh, 552, 2).forEach(function (ln, idx) { ctx.fillText(ln, 84, y + 78 + idx * 22); });
        ctx.fillStyle = '#9AA3B2'; ctx.font = '500 12px ' + FONT; ctx.fillText('— ' + data.quote.source, 84, y + 126);
        y += 154 + 20;

        // 7. Footer
        ctx.strokeStyle = '#E6EEF8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(60, y + 2); ctx.lineTo(660, y + 2); ctx.stroke();
        ctx.textBaseline = 'middle'; ctx.fillStyle = '#6B7385'; ctx.font = '500 15px ' + FONT;
        ctx.fillText('今天 ' + data.target + ' 个词 · 坚持比速度重要', 60, y + 24);
        ctx.textAlign = 'right'; ctx.fillStyle = '#9AA3B2'; ctx.font = '500 13px ' + FONT;
        ctx.fillText('1080 × 1440 · 离线生成', 660, y + 24);
        ctx.restore();
      }

      function renderCheckin() {
        var deck = getActiveDeck();
        var prog = getDeckProgress(deck.id);
        var streak = computeStreak();
        var totalDays = Object.values(state.globalCheckins).filter(Boolean).length;
        document.getElementById('ck-streak').textContent = streak;
        document.getElementById('ck-total-days').textContent = totalDays;
        document.getElementById('ck-learned').textContent = prog.learned.length;

        var nickInp = document.getElementById('ck-nickname');
        if (nickInp.value !== state.nickname) nickInp.value = state.nickname;

        var rec = prog.daily[selectedDate];
        var checked = !!((rec && rec.checked) || state.globalCheckins[selectedDate]);
        var note = document.getElementById('ck-preview-note');
        note.classList.toggle('hidden', checked);
        note.textContent = selectedDate === TODAY ? '今天还没测完，测完才能生成今日战绩卡' : (selectedDate + ' 当天未完成打卡记录');

        var kwWord = (rec && rec.quiz && rec.quiz.wrongWords && rec.quiz.wrongWords[0]) || (rec && rec.unknownWords && rec.unknownWords[0]) || (rec && rec.queue && rec.queue[0] && rec.queue[0].word) || '';
        var kw = kwWord ? resolveEntry(deck, kwWord) : deck.words[0];

        drawPoster({
          dateStr: selectedDate,
          nickname: state.nickname || 'TCAMP 同学',
          deckName: deck.name,
          dayNum: getDayNumber(prog.firstDate, selectedDate),
          streak: streak,
          newCount: rec ? rec.newCount : 0,
          reviewCount: rec ? rec.reviewCount : 0,
          keyWord: kw,
          learned: prog.learned.length,
          total: deck.words.length,
          target: rec ? rec.targetSize : state.dailySize,
          quote: getQuoteForDate(selectedDate)
        });

        // Calendar
        document.getElementById('cal-month-title').textContent = calYear + ' 年 ' + calMonth + ' 月打卡日历';
        var first = new Date(calYear, calMonth - 1, 1);
        var lead = first.getDay() === 0 ? 6 : first.getDay() - 1;
        var daysInM = new Date(calYear, calMonth, 0).getDate();
        var grid = document.getElementById('cal-days-grid');
        grid.innerHTML = '';
        for (var i = 0; i < lead; i++) grid.appendChild(document.createElement('div'));
        for (var d = 1; d <= daysInM; d++) {
          (function (dayNum) {
            var iso = calYear + '-' + String(calMonth).padStart(2, '0') + '-' + String(dayNum).padStart(2, '0');
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = String(dayNum);
            btn.className = 'cal-day' + (state.globalCheckins[iso] ? ' checked' : '') + (iso === selectedDate ? ' selected' : '');
            btn.addEventListener('click', function () {
              guardClick(btn, function () { selectedDate = iso; document.getElementById('ck-action-msg').classList.add('hidden'); renderCheckin(); });
            });
            grid.appendChild(btn);
          })(d);
        }
      }

      // MODALS (WordList, DeckSwitcher, Manage)
      var modalRoot = document.getElementById('modal-root');
      var modalCard = document.getElementById('modal-card');
      function closeModal() { modalRoot.classList.add('hidden'); modalCard.innerHTML = ''; }

      function openWordListModal(mode) {
        var deck = getActiveDeck();
        var rec = ensureTodayRecord(deck, state.dailySize);
        var words = mode === 'today' ? rec.queue.map(function (q) { return resolveEntry(deck, q.word); }).filter(Boolean) : deck.words;
        var title = mode === 'today' ? ('今日词表（' + words.length + ' 个）') : (deck.name + '（共 ' + words.length + ' 词）');
        modalCard.innerHTML =
          '<div style="padding:14px 18px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;">' +
            '<strong style="font-size:16px;">' + esc(title) + '</strong>' +
            '<button type="button" id="m-close" class="btn-secondary" style="width:34px;height:34px;">×</button>' +
          '</div>' +
          '<div style="padding:10px 18px;border-bottom:1px solid var(--line);background:#F8FBFF;">' +
            '<input id="m-search" type="text" placeholder="搜索英文单词或中文释义..." style="width:100%;padding:7px 12px;border-radius:8px;border:1px solid #DCE5F2;font-size:13px;" />' +
          '</div>' +
          '<div id="m-word-list" class="scroll-inner" style="flex:1;min-height:0;padding:0 18px;"></div>';
        modalRoot.classList.remove('hidden');

        function drawList(q) {
          var ql = (q || '').trim().toLowerCase();
          var list = words.filter(function (w) { return !ql || w.word.toLowerCase().includes(ql) || w.meaning.toLowerCase().includes(ql); });
          var box = document.getElementById('m-word-list');
          box.innerHTML = list.length === 0 ? '<p style="text-align:center;color:var(--grey);padding:32px 0;">没有匹配的词条</p>' :
            list.map(function (w) {
              return '<div style="padding:10px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:10px;">' +
                '<div style="min-width:0;flex:1;"><div><strong>' + esc(w.word) + '</strong> <span style="font-size:12px;font-family:monospace;color:var(--grey2);">' + esc(w.phonetic) + '</span></div>' +
                '<div style="font-size:12px;color:var(--grey);"><strong style="color:var(--p1);">' + esc(w.pos) + '</strong> ' + esc(w.meaning) + '</div></div>' +
                '<button type="button" class="btn-secondary m-spk" data-w="' + esc(w.word) + '" style="padding:5px 10px;font-size:11px;">朗读</button>' +
              '</div>';
            }).join('');
          box.querySelectorAll('.m-spk').forEach(function (b) { b.addEventListener('click', function () { guardClick(b, function () { speakWord(b.getAttribute('data-w')); }, true); }); });
        }
        drawList('');
        document.getElementById('m-search').addEventListener('input', function (e) { drawList(e.target.value); });
        document.getElementById('m-close').addEventListener('click', function (e) { guardClick(e.currentTarget, closeModal); });
      }

      function openDeckSwitcher() {
        var all = getAllDecks();
        modalCard.innerHTML =
          '<div style="padding:14px 18px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;">' +
            '<div><strong style="font-size:16px;">切换词库</strong><div style="font-size:12px;color:var(--grey);">每套词库单独记录第几天与词条进度，连续打卡天数跨词库共用</div></div>' +
            '<button type="button" id="m-close" class="btn-secondary" style="width:34px;height:34px;">×</button>' +
          '</div>' +
          '<div class="scroll-inner" style="flex:1;min-height:0;padding:14px 18px;display:flex;flex-direction:column;gap:10px;">' +
            all.map(function (d) {
              var p = getDeckProgress(d.id);
              var act = d.id === state.activeDeckId;
              var mast = Object.values(p.srs).filter(function (s) { return s.mastered; }).length;
              return '<div style="padding:12px 14px;border-radius:14px;border:1px solid ' + (act ? 'var(--p1)' : 'var(--line)') + ';background:' + (act ? 'var(--soft)' : '#fff') + ';display:flex;justify-content:space-between;align-items:center;gap:10px;">' +
                '<div style="min-width:0;flex:1;">' +
                  '<div><strong>' + esc(d.name) + '</strong> <span style="font-size:11px;color:var(--grey);">' + (d.builtin ? '内置' : '自定义') + ' · ' + d.words.length + ' 词</span></div>' +
                  '<div style="font-size:12px;color:var(--grey);">' + esc(d.subtitle) + '</div>' +
                  '<div class="tabular-nums" style="font-size:11px;color:var(--grey2);margin-top:2px;">第 ' + getDayNumber(p.firstDate, TODAY) + ' 天 · 已接触 ' + p.learned.length + ' · 已掌握 ' + mast + '</div>' +
                '</div>' +
                (act ? '<span style="padding:5px 12px;border-radius:999px;background:var(--p1);color:#fff;font-size:12px;font-weight:600;">当前</span>' :
                  '<button type="button" class="btn-secondary dk-pick" data-id="' + esc(d.id) + '" style="padding:6px 14px;font-size:12px;color:var(--p1);">切换</button>') +
              '</div>';
            }).join('') +
          '</div>';
        modalRoot.classList.remove('hidden');
        document.getElementById('m-close').addEventListener('click', function (e) { guardClick(e.currentTarget, closeModal); });
        modalCard.querySelectorAll('.dk-pick').forEach(function (b) {
          b.addEventListener('click', function () {
            guardClick(b, function () {
              state.activeDeckId = b.getAttribute('data-id');
              ensureTodayRecord(getActiveDeck(), state.dailySize);
              saveState();
              closeModal();
              renderHome();
            });
          });
        });
      }

      function openManageModal() {
        var deck = getActiveDeck();
        modalCard.innerHTML =
          '<div style="padding:14px 18px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;">' +
            '<strong style="font-size:16px;">管理与备份</strong>' +
            '<button type="button" id="m-close" class="btn-secondary" style="width:34px;height:34px;">×</button>' +
          '</div>' +
          '<div class="scroll-inner" style="flex:1;min-height:0;padding:18px;display:flex;flex-direction:column;gap:16px;">' +
            '<div style="border-radius:12px;background:#FFFBEB;border:1px solid #FDE68A;padding:10px 14px;font-size:12px;color:#92400E;line-height:1.55;">学习进度仅保存在当前浏览器的本地缓存（localStorage）中。清理浏览器数据、使用无痕模式或更换手机/电脑会导致进度永久丢失，请定期点击「导出备份」保存文件。</div>' +
            '<div id="mg-feedback" class="hidden" style="border-radius:10px;padding:8px 12px;font-size:12px;"></div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:8px;padding-bottom:14px;border-bottom:1px solid var(--line);">' +
              '<button type="button" id="mg-export-bk" class="btn-primary" style="min-height:38px;padding:0 14px;font-size:12px;">导出备份</button>' +
              '<button type="button" id="mg-import-bk" class="btn-secondary" style="min-height:38px;padding:0 14px;font-size:12px;">导入备份</button>' +
              '<input id="mg-bk-file" type="file" accept=".json,application/json" class="hidden" />' +
              '<button type="button" id="mg-reset" class="btn-secondary" style="min-height:38px;padding:0 14px;font-size:12px;color:var(--danger);border-color:#F6D0D2;">重置全部进度</button>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--line);">' +
              '<strong style="font-size:14px;">词库管理（当前：' + esc(deck.name) + ' · ' + deck.words.length + ' 词）</strong>' +
              '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
                '<input id="mg-new-name" type="text" placeholder="新词库名称" style="flex:1;min-width:140px;padding:6px 10px;border-radius:8px;border:1px solid #DCE5F2;font-size:12px;" />' +
                '<button type="button" id="mg-create-dk" class="btn-secondary" style="min-height:34px;padding:0 12px;font-size:12px;color:var(--p1);">新建空白词库</button>' +
                '<input id="mg-rename-val" type="text" value="' + esc(deck.name) + '" style="flex:1;min-width:140px;padding:6px 10px;border-radius:8px;border:1px solid #DCE5F2;font-size:12px;" />' +
                '<button type="button" id="mg-rename-dk" class="btn-secondary" style="min-height:34px;padding:0 12px;font-size:12px;">重命名</button>' +
              '</div>' +
              '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
                '<button type="button" id="mg-import-dk" class="btn-secondary" style="min-height:36px;padding:0 12px;font-size:12px;color:var(--p1);">导入 JSON 词库</button>' +
                '<input id="mg-dk-file" type="file" accept=".json,application/json" class="hidden" />' +
                '<button type="button" id="mg-export-dk" class="btn-secondary" style="min-height:36px;padding:0 12px;font-size:12px;">导出当前词库</button>' +
                '<button type="button" id="mg-restore-dk" class="btn-secondary" style="min-height:36px;padding:0 12px;font-size:12px;">恢复内置词库</button>' +
                '<button type="button" id="mg-delete-dk" class="btn-secondary" style="min-height:36px;padding:0 12px;font-size:12px;color:var(--danger);border-color:#F6D0D2;">删除当前词库</button>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:8px;">' +
              '<strong style="font-size:14px;">批量粘贴英文单词并解析补全</strong>' +
              '<textarea id="mg-paste" rows="3" placeholder="粘贴英文单词（空格、逗号或换行分隔）" style="width:100%;padding:10px;border-radius:10px;border:1px solid #DCE5F2;font-size:13px;"></textarea>' +
              '<div style="display:flex;gap:8px;">' +
                '<button type="button" id="mg-parse-btn" class="btn-secondary" style="min-height:36px;padding:0 14px;font-size:12px;color:var(--p1);">解析并补全</button>' +
                '<button type="button" id="mg-save-parsed" class="btn-primary hidden" style="min-height:36px;padding:0 14px;font-size:12px;">保存到当前词库</button>' +
              '</div>' +
              '<div id="mg-parsed-preview"></div>' +
            '</div>' +
          '</div>';
        modalRoot.classList.remove('hidden');

        function setFb(ok, msg) {
          var f = document.getElementById('mg-feedback');
          f.classList.remove('hidden');
          f.style.cssText = 'border-radius:10px;padding:8px 12px;font-size:12px;' +
            (ok ? 'background:#ECFDF5;border:1px solid #A7F3D0;color:#0E7B54;' : 'background:#FEF2F2;border:1px solid #F6D0D2;color:#B91C1C;');
          f.textContent = msg;
        }
        function dlJson(fname, data) {
          var b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          var u = URL.createObjectURL(b);
          var a = document.createElement('a'); a.href = u; a.download = fname;
          document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
        }

        document.getElementById('m-close').addEventListener('click', function (e) { guardClick(e.currentTarget, closeModal); });
        document.getElementById('mg-export-bk').addEventListener('click', function (e) {
          guardClick(e.currentTarget, function () { dlJson('vocab-booster-backup-' + TODAY + '.json', state); setFb(true, '已导出备份文件。'); });
        });
        document.getElementById('mg-import-bk').addEventListener('click', function (e) {
          guardClick(e.currentTarget, function () { document.getElementById('mg-bk-file').click(); });
        });
        document.getElementById('mg-bk-file').addEventListener('change', function (e) {
          var file = e.target.files[0]; e.target.value = ''; if (!file) return;
          file.text().then(function (txt) {
            var p = JSON.parse(txt);
            if (!p || !p.decks) { setFb(false, '备份文件格式不正确。'); return; }
            state = Object.assign(createInitialState(TODAY), p);
            saveState(); renderHome(); setFb(true, '已恢复备份进度。');
          }).catch(function () { setFb(false, '读取备份 JSON 失败。'); });
        });

        var resetArmed = false;
        document.getElementById('mg-reset').addEventListener('click', function (e) {
          var b = e.currentTarget;
          guardClick(b, function () {
            if (!resetArmed) { resetArmed = true; b.textContent = '再次点击确认重置'; return; }
            getAllDecks().forEach(function (d) { state.decks[d.id] = createEmptyDeckProgress(TODAY); });
            state.globalCheckins = {};
            saveState(); renderHome(); setFb(true, '已重置全部学习进度。'); resetArmed = false; b.textContent = '重置全部进度';
          });
        });

        document.getElementById('mg-create-dk').addEventListener('click', function (e) {
          guardClick(e.currentTarget, function () {
            var nm = document.getElementById('mg-new-name').value.trim();
            if (!nm) { setFb(false, '请输入新词库名称。'); return; }
            var id = 'custom-' + Date.now();
            state.customDecks.push({ id: id, name: nm, subtitle: '自定义新建词库', words: [] });
            state.decks[id] = createEmptyDeckProgress(TODAY);
            state.activeDeckId = id;
            saveState(); renderHome(); openManageModal();
          });
        });

        document.getElementById('mg-rename-dk').addEventListener('click', function (e) {
          guardClick(e.currentTarget, function () {
            var nm = document.getElementById('mg-rename-val').value.trim();
            if (!nm) { setFb(false, '名称不能为空。'); return; }
            if (deck.builtin) {
              state.deckOverrides[deck.id] = Object.assign({}, state.deckOverrides[deck.id] || {}, { name: nm });
            } else {
              state.customDecks.forEach(function (cd) { if (cd.id === deck.id) cd.name = nm; });
            }
            saveState(); renderHome(); setFb(true, '已重命名为「' + nm + '」。');
          });
        });

        document.getElementById('mg-export-dk').addEventListener('click', function (e) {
          guardClick(e.currentTarget, function () { dlJson(deck.name + '-' + TODAY + '.json', { name: deck.name, words: deck.words }); setFb(true, '已导出词库 JSON。'); });
        });
        document.getElementById('mg-restore-dk').addEventListener('click', function (e) {
          guardClick(e.currentTarget, function () { state.deckOverrides = {}; saveState(); renderHome(); openManageModal(); });
        });
        document.getElementById('mg-delete-dk').addEventListener('click', function (e) {
          guardClick(e.currentTarget, function () {
            if (deck.builtin) { setFb(false, '内置词库不可删除。'); return; }
            state.customDecks = state.customDecks.filter(function (cd) { return cd.id !== deck.id; });
            delete state.decks[deck.id];
            state.activeDeckId = 'cet4';
            saveState(); renderHome(); openManageModal();
          });
        });

        document.getElementById('mg-import-dk').addEventListener('click', function (e) {
          guardClick(e.currentTarget, function () { document.getElementById('mg-dk-file').click(); });
        });
        document.getElementById('mg-dk-file').addEventListener('change', function (e) {
          var file = e.target.files[0]; e.target.value = ''; if (!file) return;
          file.text().then(function (txt) {
            var parsed = JSON.parse(txt);
            var arr = Array.isArray(parsed) ? parsed : (parsed && parsed.words);
            if (!Array.isArray(arr) || !arr.length) { setFb(false, 'JSON 中未识别到词条。'); return; }
            var norm = arr.map(function (it) {
              var w = String(it.word || it.name || '').trim();
              if (!w) return null;
              var fb = MASTER_DICT[w.toLowerCase()];
              var m = it.meaning || (Array.isArray(it.translations) && it.translations[0] ? it.translations.slice(0, 2).map(function (t) { return t.translation; }).join('；') : '') || (fb && fb.meaning) || '待补充';
              var ph = it.phonetic || (it.usphone ? '/' + it.usphone + '/' : '') || (fb && fb.phonetic) || '/—/';
              var ex = it.example || (Array.isArray(it.sentences) && it.sentences[0] ? it.sentences[0].sentence : '') || (fb && fb.example) || ('We practiced ' + w + ' today.');
              var exZh = it.exampleZh || (Array.isArray(it.sentences) && it.sentences[0] ? it.sentences[0].sentence_trans : '') || (fb && fb.exampleZh) || '我们在今天练习了这个词。';
              return {
                word: w, phonetic: ph, pos: it.pos || (fb && fb.pos) || 'n.', meaning: m,
                example: ex, exampleZh: exZh, memo: it.memo || (fb && fb.memo) || '结合例句语境记忆',
                collocations: it.collocations || (fb && fb.collocations) || w, family: it.family || (fb && fb.family) || '暂无派生词',
                confusable: it.confusable || (fb && fb.confusable) || '注意辨析词性'
              };
            }).filter(Boolean);
            if (deck.builtin) state.deckOverrides[deck.id] = Object.assign({}, state.deckOverrides[deck.id] || {}, { words: norm });
            else state.customDecks.forEach(function (cd) { if (cd.id === deck.id) cd.words = norm; });
            var prog = getDeckProgress(deck.id); prog.cursor = 0; delete prog.daily[TODAY];
            ensureTodayRecord(getActiveDeck(), state.dailySize);
            saveState(); renderHome(); setFb(true, '已导入 ' + norm.length + ' 词并保留历史打卡天数。');
          }).catch(function () { setFb(false, '解析 JSON 词库失败。'); });
        });

        var pendingMatched = [], pendingUnmatched = [];
        document.getElementById('mg-parse-btn').addEventListener('click', function (e) {
          guardClick(e.currentTarget, function () {
            var raw = document.getElementById('mg-paste').value;
            var tokens = raw.split(/[\\s,;，；\\n\\r\\t]+/).map(function (s) { return s.trim().toLowerCase(); }).filter(function (s) { return /^[a-z][a-z-]*$/i.test(s); });
            var seen = new Set(); pendingMatched = []; pendingUnmatched = [];
            tokens.forEach(function (tk) {
              if (seen.has(tk)) return; seen.add(tk);
              if (MASTER_DICT[tk]) pendingMatched.push(MASTER_DICT[tk]);
              else pendingUnmatched.push(tk);
            });
            var box = document.getElementById('mg-parsed-preview');
            var saveBtn = document.getElementById('mg-save-parsed');
            if (!pendingMatched.length && !pendingUnmatched.length) { setFb(false, '未检测到有效的英文单词。'); saveBtn.classList.add('hidden'); return; }
            saveBtn.classList.remove('hidden');
            box.innerHTML =
              (pendingMatched.length ? '<div style="padding:8px 10px;background:#F8FBFF;border:1px solid var(--line);border-radius:10px;font-size:12px;margin-bottom:8px;"><strong>离线词库已补全（' + pendingMatched.length + ' 词）：</strong>' + pendingMatched.map(function (m) { return esc(m.word + ' ' + m.meaning); }).join(' · ') + '</div>' : '') +
              (pendingUnmatched.length ? '<div style="border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:12px;"><strong>未命中词条（请填写中文释义）：</strong>' +
                pendingUnmatched.map(function (u, i) {
                  return '<div style="display:flex;gap:6px;margin-top:6px;align-items:center;"><strong style="width:90px;">' + esc(u) + '</strong><input class="mg-unm-ph" data-i="' + i + '" placeholder="/音标/" style="width:80px;padding:4px;border:1px solid #DCE5F2;border-radius:6px;font-size:12px;" /><input class="mg-unm-m" data-i="' + i + '" placeholder="必填：中文释义" style="flex:1;padding:4px;border:1px solid #DCE5F2;border-radius:6px;font-size:12px;" /></div>';
                }).join('') + '</div>' : '');
            setFb(true, '命中 ' + pendingMatched.length + ' 词，未命中 ' + pendingUnmatched.length + ' 词。');
          });
        });

        document.getElementById('mg-save-parsed').addEventListener('click', function (e) {
          guardClick(e.currentTarget, function () {
            var manual = [];
            var missing = false;
            pendingUnmatched.forEach(function (w, i) {
              var mEl = modalCard.querySelector('.mg-unm-m[data-i="' + i + '"]');
              var phEl = modalCard.querySelector('.mg-unm-ph[data-i="' + i + '"]');
              var mv = mEl ? mEl.value.trim() : '';
              if (!mv) missing = true;
              manual.push({
                word: w, phonetic: (phEl && phEl.value.trim()) || '/—/', pos: 'n.', meaning: mv,
                example: 'We practiced using ' + w + ' in daily reading.', exampleZh: '我们在日常阅读中练习了这个单词。',
                memo: '自定义补充词条', collocations: w, family: '暂无派生词', confusable: '注意核对拼写'
              });
            });
            if (missing) { setFb(false, '请先为所有未命中词条填写中文释义。'); return; }
            var combined = pendingMatched.concat(manual);
            var curDeck = getActiveDeck();
            var exist = new Set(curDeck.words.map(function (w) { return w.word.toLowerCase(); }));
            var merged = curDeck.words.concat(combined.filter(function (w) { return !exist.has(w.word.toLowerCase()); }));
            if (curDeck.builtin) state.deckOverrides[curDeck.id] = Object.assign({}, state.deckOverrides[curDeck.id] || {}, { words: merged });
            else state.customDecks.forEach(function (cd) { if (cd.id === curDeck.id) cd.words = merged; });
            ensureTodayRecord(getActiveDeck(), state.dailySize);
            saveState(); renderHome(); setFb(true, '已追加 ' + combined.length + ' 词到当前词库。');
          });
        });
      }

      // Wire events
      document.getElementById('btn-home-cta').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () {
          var deck = getActiveDeck();
          var rec = ensureTodayRecord(deck, state.dailySize);
          if (rec.studiedWords.length < rec.queue.length) startStudy();
          else if (!rec.quiz) startQuiz(rec.queue.map(function (q) { return resolveEntry(deck, q.word); }).filter(Boolean), true);
        });
      });
      document.getElementById('btn-home-checkin').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { show('checkin'); }); });
      document.getElementById('btn-open-deck-switcher').addEventListener('click', function (e) { guardClick(e.currentTarget, openDeckSwitcher); });
      document.getElementById('btn-open-manage').addEventListener('click', function (e) { guardClick(e.currentTarget, openManageModal); });
      document.getElementById('btn-entry-today').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { openWordListModal('today'); }); });
      document.getElementById('btn-entry-wrong').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { show('wrong'); }); });
      document.getElementById('btn-entry-all').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { openWordListModal('all'); }); });

      document.getElementById('btn-study-back').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { show('home'); }); });
      document.getElementById('btn-toggle-mask').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () {
          state.maskEnabled = !state.maskEnabled;
          studyRevealed = !state.maskEnabled;
          saveState();
          document.getElementById('btn-toggle-mask').textContent = state.maskEnabled ? '遮罩自测：开' : '遮罩自测：关';
          updateStudyRevealUI();
        });
      });
      document.getElementById('btn-study-word-speak').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () { if (studyQueue[studyIdx]) speakWord(studyQueue[studyIdx].entry.word); }, true);
      });
      document.getElementById('btn-study-speak').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () { if (studyQueue[studyIdx]) speakWord(studyQueue[studyIdx].entry.word); }, true);
      });
      document.getElementById('study-example-box').addEventListener('click', function () {
        studyExampleRevealed = true;
        if (studyQueue[studyIdx]) speakWord(studyQueue[studyIdx].entry.word);
        updateStudyRevealUI();
      });
      document.getElementById('btn-study-reveal').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () { studyRevealed = true; studyExampleRevealed = true; updateStudyRevealUI(); });
      });
      document.getElementById('btn-study-unknown').addEventListener('click', function (e) { guardClick(e.currentTarget, handleStudyUnknown); });
      document.getElementById('btn-study-known').addEventListener('click', function (e) { guardClick(e.currentTarget, handleStudyKnown); });
      document.getElementById('btn-study-next-after-unknown').addEventListener('click', function (e) { guardClick(e.currentTarget, handleStudyKnown); });
      document.getElementById('btn-study-undo').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () {
          var last = studyUndoStack.pop();
          if (!last) return;
          state.decks[getActiveDeck().id] = last.prevProg;
          studyQueue = last.prevQueue;
          studyIdx = last.prevIdx;
          saveState();
          renderStudyCard();
        });
      });

      document.getElementById('btn-done-home').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { show('home'); }); });
      document.getElementById('btn-done-quiz').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () {
          var deck = getActiveDeck();
          var rec = ensureTodayRecord(deck, state.dailySize);
          startQuiz(rec.queue.map(function (q) { return resolveEntry(deck, q.word); }).filter(Boolean), true);
        });
      });

      document.getElementById('btn-quiz-back').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { show('home'); }); });
      document.getElementById('btn-result-home').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { show('home'); }); });
      document.getElementById('btn-result-retry').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () {
          var w = quizOutcomes.filter(function (o) { return !o.isCorrect; }).map(function (o) { return o.entry; });
          if (w.length) startQuiz(w, false);
        });
      });
      document.getElementById('btn-result-checkin').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { show('checkin'); }); });

      document.getElementById('btn-wrong-back').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { show('home'); }); });
      document.getElementById('btn-wrong-home').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { show('home'); }); });
      document.getElementById('btn-wrong-practice').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () {
          var deck = getActiveDeck();
          var prog = getDeckProgress(deck.id);
          var wList = Object.keys(prog.wrong).map(function (w) { return resolveEntry(deck, w); }).filter(Boolean);
          if (wList.length) startQuiz(wList, false);
        });
      });

      document.getElementById('btn-checkin-back').addEventListener('click', function (e) { guardClick(e.currentTarget, function () { show('home'); }); });
      document.getElementById('ck-nickname').addEventListener('input', function (e) {
        state.nickname = e.target.value.slice(0, 12);
        saveState();
        renderCheckin();
      });
      document.getElementById('btn-cal-prev').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () {
          calMonth--; if (calMonth < 1) { calMonth = 12; calYear--; }
          renderCheckin();
        });
      });
      document.getElementById('btn-cal-next').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () {
          calMonth++; if (calMonth > 12) { calMonth = 1; calYear++; }
          renderCheckin();
        });
      });
      document.getElementById('btn-save-poster').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () {
          var deck = getActiveDeck(), prog = getDeckProgress(deck.id), rec = prog.daily[selectedDate];
          var msg = document.getElementById('ck-action-msg');
          if (!((rec && rec.checked) || state.globalCheckins[selectedDate])) {
            msg.classList.remove('hidden'); msg.style.color = 'var(--amber)';
            msg.textContent = '今天还没测完，测完才能生成战绩卡'; return;
          }
          msg.classList.add('hidden');
          var a = document.createElement('a');
          a.href = document.getElementById('poster-canvas').toDataURL('image/png');
          a.download = 'TCAMP打卡-' + selectedDate + '-' + (state.nickname || 'TCAMP同学').replace(/[\\\\/:*?"<>|]/g, '') + '.png';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        });
      });
      document.getElementById('btn-copy-checkin').addEventListener('click', function (e) {
        guardClick(e.currentTarget, function () {
          var deck = getActiveDeck(), prog = getDeckProgress(deck.id), rec = prog.daily[selectedDate];
          var msg = document.getElementById('ck-action-msg');
          if (!((rec && rec.checked) || state.globalCheckins[selectedDate])) {
            msg.classList.remove('hidden'); msg.style.color = 'var(--amber)';
            msg.textContent = '今天还没测完，测完才能生成战绩卡'; return;
          }
          var dayN = getDayNumber(prog.firstDate, selectedDate);
          var txt = '【TCAMP 每日背单词】打卡第 ' + dayN + ' 天 / ' + selectedDate + ' · ' + deck.name + ' 第 ' + dayN + ' 天 / 今天新学 ' + (rec ? rec.newCount : 0) + ' 复习 ' + (rec ? rec.reviewCount : 0) + ' / 已连续打卡 ' + computeStreak() + ' 天';
          if (navigator.clipboard) {
            navigator.clipboard.writeText(txt).then(function () {
              msg.classList.remove('hidden'); msg.style.color = 'var(--green)'; msg.textContent = '已复制打卡文案';
            });
          }
        });
      });

      // Global keyboard shortcuts
      window.addEventListener('keydown', function (e) {
        if (!modalRoot.classList.contains('hidden')) {
          if (e.key === 'Escape') closeModal();
          return;
        }
        var tag = e.target && e.target.tagName;
        var inInput = tag === 'INPUT' || tag === 'TEXTAREA';
        if (currentScreen === 'study' && !inInput && studyQueue[studyIdx]) {
          if (e.code === 'Space') { e.preventDefault(); speakWord(studyQueue[studyIdx].entry.word); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); studyRevealed = true; updateStudyRevealUI(); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); handleStudyUnknown(); }
          else if (e.key === 'ArrowRight') { e.preventDefault(); handleStudyKnown(); }
          else if (e.key === 'Backspace' && studyUndoStack.length > 0) {
            e.preventDefault();
            document.getElementById('btn-study-undo').click();
          }
        } else if (currentScreen === 'quiz' && quizQs[quizIdx]) {
          var q = quizQs[quizIdx];
          if (e.code === 'Space' && !inInput) { e.preventDefault(); speakWord(q.word.word); }
          if (q.type === 'choice') {
            var map = { a: 'A', b: 'B', c: 'C', d: 'D', '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
            var mapped = map[e.key.toLowerCase()];
            if (mapped && quizChosen === null) { e.preventDefault(); selectChoice(mapped); }
            else if ((e.key === 'Enter' || e.key === 'ArrowRight') && quizChosen !== null) {
              e.preventDefault();
              document.getElementById('q-next-btn').click();
            }
          }
        }
      });

      window.addEventListener('resize', function () {
        if (currentScreen === 'home') renderHome();
      });

      loadState();
      renderHome();
    })();
  </script>
</body>
</html>`;

fs.mkdirSync(path.dirname(outPathPublic), { recursive: true });
fs.writeFileSync(outPathPublic, html, 'utf8');
fs.writeFileSync(outPathRoot, html, 'utf8');
console.log(`Generated ${outPathRoot} and ${outPathPublic} (${Buffer.byteLength(html, 'utf8')} bytes)`);

