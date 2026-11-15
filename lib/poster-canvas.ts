import type { DailyQuote, WordEntry } from './types';

export interface PosterPayload {
  dateStr: string;
  nickname: string;
  deckName: string;
  dayNumber: number;
  streak: number;
  newCount: number;
  reviewCount: number;
  keyWord: WordEntry | null;
  learnedCount: number;
  totalWords: number;
  dailyTarget: number;
  quote: DailyQuote;
}

const SYS_FONT = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif';

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.includes(' ') ? text.split(' ') : text.split('');
  const joiner = text.includes(' ') ? ' ' : '';
  const lines: string[] = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const piece = words[i];
    const candidate = current ? current + joiner + piece : piece;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = piece;
      if (lines.length === maxLines - 1) {
        // Fill remaining words and truncate if needed
        const rest = words.slice(i).join(joiner);
        let clipped = rest;
        while (ctx.measureText(clipped + '...').width > maxWidth && clipped.length > 1) {
          clipped = clipped.slice(0, -1);
        }
        lines.push(clipped === rest ? clipped : clipped + '...');
        return lines;
      }
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function formatChineseDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y} 年 ${m} 月 ${d} 日`;
}

// Block 1: Header (h = 44)
function cardHeader(ctx: CanvasRenderingContext2D, y: number, h: number, data: PosterPayload) {
  ctx.fillStyle = '#6B7385';
  ctx.font = `600 18px ${SYS_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatChineseDate(data.dateStr), 60, y + h / 2);

  ctx.fillStyle = '#1E80FF';
  ctx.font = `700 15px ${SYS_FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText('TCAMP 每日词汇', 660, y + h / 2);

  // Thin bottom rule
  ctx.strokeStyle = '#E6EEF8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, y + h - 2);
  ctx.lineTo(660, y + h - 2);
  ctx.stroke();
}

// Block 2: HERO (remaining space = 166)
function cardHero(ctx: CanvasRenderingContext2D, y: number, h: number, data: PosterPayload) {
  // Left: large streak number (>= 80px) + 连续打卡
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#1E80FF';
  ctx.font = `800 92px ${SYS_FONT}`;
  const streakStr = String(data.streak);
  ctx.fillText(streakStr, 60, y + 102);

  const numW = ctx.measureText(streakStr).width;
  ctx.fillStyle = '#14161F';
  ctx.font = `600 22px ${SYS_FONT}`;
  ctx.fillText('天', 60 + numW + 8, y + 100);

  ctx.fillStyle = '#6B7385';
  ctx.font = `500 17px ${SYS_FONT}`;
  ctx.fillText('连续打卡天数', 60, y + 138);

  // Right: Nickname + Deck · Day N
  ctx.textAlign = 'right';
  ctx.fillStyle = '#14161F';
  ctx.font = `700 30px ${SYS_FONT}`;
  const safeName = (data.nickname || 'TCAMP 同学').trim().slice(0, 12);
  ctx.fillText(safeName, 660, y + 66);

  // Subtle tag box on right
  const tagText = `${data.deckName} · 第 ${data.dayNumber} 天`;
  ctx.font = `600 16px ${SYS_FONT}`;
  const tagW = Math.min(300, ctx.measureText(tagText).width + 28);
  roundRectPath(ctx, 660 - tagW, y + 88, tagW, 34, 17);
  ctx.fillStyle = '#EAF3FF';
  ctx.fill();

  ctx.fillStyle = '#1E80FF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagText, 660 - tagW / 2, y + 105);
}

// Block 3: Stats (h = 84)
function cardStats(ctx: CanvasRenderingContext2D, y: number, h: number, data: PosterPayload) {
  const boxW = 290;
  const gap = 20;

  // Box 1: New words
  roundRectPath(ctx, 60, y, boxW, h, 16);
  ctx.fillStyle = '#F3F8FF';
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#6B7385';
  ctx.font = `500 15px ${SYS_FONT}`;
  ctx.fillText('今日新学', 84, y + 26);

  ctx.fillStyle = '#14161F';
  ctx.font = `700 30px ${SYS_FONT}`;
  ctx.fillText(`${data.newCount} 词`, 84, y + 58);

  // Box 2: Review words
  const x2 = 60 + boxW + gap;
  roundRectPath(ctx, x2, y, boxW, h, 16);
  ctx.fillStyle = '#F3F8FF';
  ctx.fill();

  ctx.fillStyle = '#6B7385';
  ctx.font = `500 15px ${SYS_FONT}`;
  ctx.fillText('记忆复习', x2 + 24, y + 26);

  ctx.fillStyle = '#14161F';
  ctx.font = `700 30px ${SYS_FONT}`;
  ctx.fillText(`${data.reviewCount} 词`, x2 + 24, y + 58);
}

// Block 4: Key word (h = 150)
function cardKey(ctx: CanvasRenderingContext2D, y: number, h: number, data: PosterPayload) {
  roundRectPath(ctx, 60, y, 600, h, 16);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#E6EEF8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#1E80FF';
  ctx.font = `600 13px ${SYS_FONT}`;
  ctx.fillText('今日重点词', 84, y + 18);

  const kw = data.keyWord;
  if (kw) {
    ctx.fillStyle = '#14161F';
    ctx.font = `700 32px ${SYS_FONT}`;
    ctx.fillText(kw.word, 84, y + 44);

    const wWidth = ctx.measureText(kw.word).width;
    ctx.fillStyle = '#6B7385';
    ctx.font = `400 17px ${SYS_FONT}`;
    ctx.fillText(kw.phonetic, 84 + wWidth + 14, y + 54);

    ctx.fillStyle = '#14161F';
    ctx.font = `500 19px ${SYS_FONT}`;
    const meaningText = `${kw.pos} ${kw.meaning}`;
    const lines = wrapTextLines(ctx, meaningText, 552, 2);
    lines.forEach((line, idx) => {
      ctx.fillText(line, 84, y + 92 + idx * 24);
    });
  } else {
    ctx.fillStyle = '#6B7385';
    ctx.font = `500 18px ${SYS_FONT}`;
    ctx.fillText('已完成今日全部词条学习与测验', 84, y + 62);
  }
}

// Block 5: Deck progress bar (h = 48)
function cardProgress(ctx: CanvasRenderingContext2D, y: number, h: number, data: PosterPayload) {
  const total = Math.max(1, data.totalWords);
  const learned = Math.min(total, data.learnedCount);
  const ratio = learned / total;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#14161F';
  ctx.font = `600 15px ${SYS_FONT}`;
  ctx.fillText(`词库累计进度：已学 ${learned} / ${total} 词`, 60, y + 12);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#1E80FF';
  ctx.font = `700 15px ${SYS_FONT}`;
  ctx.fillText(`${Math.round(ratio * 100)}%`, 660, y + 12);

  // Track
  roundRectPath(ctx, 60, y + 32, 600, 10, 5);
  ctx.fillStyle = '#EAF3FF';
  ctx.fill();

  // Bar
  if (ratio > 0) {
    const barW = Math.max(12, Math.round(600 * ratio));
    const grad = ctx.createLinearGradient(60, 0, 60 + barW, 0);
    grad.addColorStop(0, '#2B7BF5');
    grad.addColorStop(1, '#38BDF8');
    roundRectPath(ctx, 60, y + 32, barW, 10, 5);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

// Block 6: Daily quote (h = 154)
function cardQuote(ctx: CanvasRenderingContext2D, y: number, h: number, data: PosterPayload) {
  roundRectPath(ctx, 60, y, 600, h, 16);
  ctx.fillStyle = '#F8FBFF';
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#14161F';
  ctx.font = `600 17px ${SYS_FONT}`;
  const enLines = wrapTextLines(ctx, data.quote.en, 552, 2);
  enLines.forEach((line, idx) => {
    ctx.fillText(line, 84, y + 22 + idx * 24);
  });

  ctx.fillStyle = '#6B7385';
  ctx.font = `400 16px ${SYS_FONT}`;
  const zhLines = wrapTextLines(ctx, data.quote.zh, 552, 2);
  zhLines.forEach((line, idx) => {
    ctx.fillText(line, 84, y + 78 + idx * 22);
  });

  ctx.fillStyle = '#9AA3B2';
  ctx.font = `500 12px ${SYS_FONT}`;
  ctx.fillText(`— ${data.quote.source}`, 84, y + 126);
}

// Block 7: Footer (h = 40)
function cardFooter(ctx: CanvasRenderingContext2D, y: number, h: number, data: PosterPayload) {
  ctx.strokeStyle = '#E6EEF8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, y + 2);
  ctx.lineTo(660, y + 2);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#6B7385';
  ctx.font = `500 15px ${SYS_FONT}`;
  ctx.fillText(`今天 ${data.dailyTarget} 个词 · 坚持比速度重要`, 60, y + 24);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9AA3B2';
  ctx.font = `500 13px ${SYS_FONT}`;
  ctx.fillText('1080 × 1440 · 离线生成', 660, y + 24);
}

export function renderPosterCanvas(canvas: HTMLCanvasElement, data: PosterPayload): void {
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(1.5, 1.5); // Logical coordinate system: 720 x 960

  // Diagonal background gradient: #DCEBFF -> #EEF6FF -> #F8FBFF
  const bgGrad = ctx.createLinearGradient(0, 0, 720, 960);
  bgGrad.addColorStop(0, '#DCEBFF');
  bgGrad.addColorStop(0.5, '#EEF6FF');
  bgGrad.addColorStop(1, '#F8FBFF');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 720, 960);

  // Outer white card with shadow (save/restore strictly around shadow)
  ctx.save();
  ctx.shadowColor = 'rgba(30,96,200,.16)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  roundRectPath(ctx, 26, 26, 720 - 52, 960 - 52, 30);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.restore();

  // Vertical layout y=66..884:
  // 1 Header (44) + 24 + 2 Hero (166) + 18 + 3 Stats (84) + 18 + 4 Key (150) + 26 + 5 Progress (48) + 26 + 6 Quote (154) + 20 + 7 Footer (40) = 884
  let y = 66;
  cardHeader(ctx, y, 44, data);
  y += 44 + 24;

  const heroH = 166;
  cardHero(ctx, y, heroH, data);
  y += heroH + 18;

  cardStats(ctx, y, 84, data);
  y += 84 + 18;

  cardKey(ctx, y, 150, data);
  y += 150 + 26;

  cardProgress(ctx, y, 48, data);
  y += 48 + 26;

  cardQuote(ctx, y, 154, data);
  y += 154 + 20;

  cardFooter(ctx, y, 40, data);

  ctx.restore();
}
