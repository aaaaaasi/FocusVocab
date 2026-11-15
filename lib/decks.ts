import type { DailyQuote, DeckDefinition, WordEntry } from './types';
import { CET4_WORDS, CET6_WORDS } from './decks-part1';
import { KAOYAN_WORDS, IELTS_WORDS } from './decks-part2';
import { WORKPLACE_WORDS, AITECH_WORDS } from './decks-part3';

export const BUILTIN_DECKS: DeckDefinition[] = [
  {
    id: 'cet4',
    name: '四级高频',
    subtitle: '大学英语四级高频核心词',
    builtin: true,
    words: CET4_WORDS,
  },
  {
    id: 'cet6',
    name: '六级进阶',
    subtitle: '大学英语六级进阶常考词',
    builtin: true,
    words: CET6_WORDS,
  },
  {
    id: 'kaoyan',
    name: '考研核心',
    subtitle: '考研英语阅读与翻译核心词',
    builtin: true,
    words: KAOYAN_WORDS,
  },
  {
    id: 'ielts',
    name: '雅思 / 托福',
    subtitle: '留学学术阅读与写作高频词',
    builtin: true,
    words: IELTS_WORDS,
  },
  {
    id: 'workplace',
    name: '口语 & 职场',
    subtitle: '会议、邮件、出差与项目沟通词',
    builtin: true,
    words: WORKPLACE_WORDS,
  },
  {
    id: 'aitech',
    name: 'AI 与科技',
    subtitle: '人工智能、模型训练与工程词汇',
    builtin: true,
    words: AITECH_WORDS,
  },
];

// Build unified offline MASTER_DICT across all 6 decks for batch auto-completion
export const MASTER_DICT: Record<string, WordEntry> = (() => {
  const dict: Record<string, WordEntry> = {};
  for (const deck of BUILTIN_DECKS) {
    for (const entry of deck.words) {
      const key = entry.word.trim().toLowerCase();
      if (!dict[key]) {
        dict[key] = entry;
      }
    }
  }
  return dict;
})();

export const DAILY_QUOTES: DailyQuote[] = [
  {
    en: 'Retrieval is not merely a readout of memory; it is a powerful modifier of memory.',
    zh: '主动提取不只是检验记忆，它本身就在重塑记忆。',
    source: 'Roediger & Karpicke, Cognitive Science',
  },
  {
    en: 'Small daily increments rarely feel dramatic in a week, yet compound sharply across a season.',
    zh: '每天的一小步一周内难见波澜，跨越一季却会拉开显著差距。',
    source: 'Behavioral Accumulation Notes',
  },
  {
    en: 'What feels slightly effortful to recall today is precisely what lasts into next month.',
    zh: '今天回忆时略感吃力的词，恰恰是能留到下个月的词。',
    source: 'Desirable Difficulties Principle',
  },
  {
    en: 'Consistency beats intensity because attention works best in short, repeatable intervals.',
    zh: '稳定复现胜过突击硬背，注意力在可重复的短周期内最有效。',
    source: 'Spaced Practice Research',
  },
  {
    en: 'Knowing a word in isolation is recognition; meeting it inside a sentence is command.',
    zh: '孤立认出词义只是识别，在句子里反应过来才算掌握。',
    source: 'Lexical Context Studies',
  },
  {
    en: 'Errors made during honest self-testing guide subsequent study far better than passive review.',
    zh: '自测时暴露出的错漏，比反复浏览笔记更能校准接下来的学习。',
    source: 'Testing Effect Review',
  },
  {
    en: 'Fluency is built less from rare breakthroughs than from keeping a modest schedule intact.',
    zh: '流利很少来自偶发的顿悟，更多源于守住一个温和可行的日程。',
    source: 'Habit Formation Literature',
  },
  {
    en: 'Forgetting is not failure; it is the baseline curve against which spacing schedules work.',
    zh: '遗忘不是失败，它是间隔复习曲线得以发挥作用的基线。',
    source: 'Ebbinghaus Curve Notes',
  },
  {
    en: 'A reliable vocabulary grows one clear context at a time, not through marathon cramming.',
    zh: '可靠的词汇量靠一次次清晰语境积累而成，而非熬夜突击。',
    source: 'The Economist Style Notes',
  },
  {
    en: 'Pause before peeking at the answer: that brief search is where long-term encoding begins.',
    zh: '看释义前先停顿回想两秒，长时记忆的编码正发生在那一刻。',
    source: 'Active Recall Practice',
  },
  {
    en: 'Ten focused minutes kept daily outlast ambitious two-hour plans abandoned on day four.',
    zh: '每天守住的专注十分钟，远胜第四天就放弃的两小时宏大计划。',
    source: 'Applied Learning Design',
  },
  {
    en: 'Measuring what you missed today prevents repeating the same blind spot next week.',
    zh: '记录今天卡住的词，才能避免下周在同一处盲区反复跌倒。',
    source: 'Metacognitive Learning',
  },
];
