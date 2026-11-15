'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  FileDown,
  FolderPlus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { SafeButton } from './SafeButton';
import { speakWord } from '../lib/speech';
import {
  getDayNumber,
  normalizeImportedWords,
  parseAndLookupWords,
} from '../lib/vocab-engine';
import type {
  AppStorageState,
  DeckDefinition,
  DeckProgress,
  WordEntry,
} from '../lib/types';

interface WordListModalProps {
  title: string;
  words: WordEntry[];
  onClose: () => void;
}

export function WordListModal({ title, words, onClose }: WordListModalProps) {
  const [query, setQuery] = useState('');

  const filtered = words.filter((w) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      w.word.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q) ||
      w.pos.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-[#14161F]/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="surface-card w-full max-w-[680px] max-h-[84dvh] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6EEF8] flex items-center justify-between gap-3 shrink-0">
          <h2 className="text-base font-bold text-[#14161F] tabular-nums">{title}</h2>
          <SafeButton
            onClick={onClose}
            aria-label="关闭窗口"
            className="btn-secondary w-9 h-9 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </SafeButton>
        </div>

        <div className="px-5 py-2.5 border-b border-[#E6EEF8] bg-[#F8FBFF] shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#9AA3B2] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索英文单词或中文释义..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#DCE5F2] bg-white text-sm text-[#14161F] focus:border-[#1E80FF]"
            />
          </div>
        </div>

        <div className="scroll-inner flex-1 min-h-0 divide-y divide-[#E6EEF8] px-5">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#6B7385]">没有找到匹配的词条</p>
          ) : (
            filtered.map((w) => (
              <div key={w.word} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-[#14161F]">{w.word}</span>
                    <span className="text-xs font-mono text-[#9AA3B2]">{w.phonetic}</span>
                  </div>
                  <p className="text-xs text-[#6B7385] truncate mt-0.5">
                    <span className="text-[#1E80FF] font-semibold mr-1">{w.pos}</span>
                    {w.meaning}
                  </p>
                </div>
                <SafeButton
                  onClick={() => speakWord(w.word)}
                  skipDebounce
                  aria-label={`朗读 ${w.word}`}
                  className="w-9 h-9 rounded-full bg-[#F3F8FF] hover:bg-[#EAF3FF] text-[#1E80FF] flex items-center justify-center shrink-0"
                >
                  <Volume2 className="w-4 h-4" />
                </SafeButton>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface DeckSwitcherModalProps {
  decks: DeckDefinition[];
  activeDeckId: string;
  deckProgressMap: Record<string, DeckProgress>;
  today: string;
  onSelectDeck: (deckId: string) => void;
  onClose: () => void;
}

export function DeckSwitcherModal({
  decks,
  activeDeckId,
  deckProgressMap,
  today,
  onSelectDeck,
  onClose,
}: DeckSwitcherModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#14161F]/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="切换词库"
    >
      <div className="surface-card w-full max-w-[680px] max-h-[84dvh] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6EEF8] flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#14161F]">切换词库</h2>
            <p className="text-xs text-[#6B7385]">
              每套词库单独记录第几天与词条进度，连续打卡天数跨词库共用
            </p>
          </div>
          <SafeButton
            onClick={onClose}
            aria-label="关闭切换词库弹窗"
            className="btn-secondary w-9 h-9 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </SafeButton>
        </div>

        <div className="scroll-inner flex-1 min-h-0 p-4 flex flex-col gap-2.5">
          {decks.map((d) => {
            const prog = deckProgressMap[d.id];
            const isActive = d.id === activeDeckId;
            const dayNum = prog ? getDayNumber(prog.firstDate, today) : 1;
            const learnedCount = prog ? prog.learned.length : 0;
            const masteredCount = prog
              ? Object.values(prog.srs).filter((s) => s.mastered).length
              : 0;

            return (
              <div
                key={d.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isActive
                    ? 'border-[#1E80FF] bg-[#F3F8FF]'
                    : 'border-[#E6EEF8] bg-white'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-[#14161F] truncate">
                      {d.name}
                    </span>
                    <span className="text-[11px] font-medium text-[#6B7385] tabular-nums shrink-0">
                      {d.builtin ? '内置' : '自定义'} · {d.words.length} 词
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7385] mt-0.5 truncate">{d.subtitle}</p>
                  <p className="text-[11px] text-[#9AA3B2] mt-1 tabular-nums">
                    第 {dayNum} 天 · 已接触 {learnedCount} · 已掌握 {masteredCount}
                  </p>
                </div>

                {isActive ? (
                  <span className="px-3 py-1.5 rounded-full bg-[#1E80FF] text-white text-xs font-semibold flex items-center gap-1 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    当前
                  </span>
                ) : (
                  <SafeButton
                    onClick={() => {
                      onSelectDeck(d.id);
                      onClose();
                    }}
                    className="btn-secondary min-h-[38px] px-4 py-1.5 text-xs font-semibold text-[#1E80FF] border-[#C7DAF5] shrink-0"
                  >
                    切换
                  </SafeButton>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ManageModalProps {
  state: AppStorageState;
  activeDeck: DeckDefinition;
  today: string;
  onExportBackup: () => void;
  onImportBackup: (parsed: AppStorageState) => void;
  onResetAllProgress: () => void;
  onCreateBlankDeck: (name: string) => void;
  onRenameCurrentDeck: (newName: string) => void;
  onDeleteCurrentDeck: () => void;
  onImportDeckWords: (words: WordEntry[]) => void;
  onExportCurrentDeck: () => void;
  onRestoreBuiltinDecks: () => void;
  onAppendWordsToDeck: (words: WordEntry[]) => void;
  onClose: () => void;
}

interface PendingManualWord {
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  exampleZh: string;
}

export function ManageModal({
  state,
  activeDeck,
  today,
  onExportBackup,
  onImportBackup,
  onResetAllProgress,
  onCreateBlankDeck,
  onRenameCurrentDeck,
  onDeleteCurrentDeck,
  onImportDeckWords,
  onExportCurrentDeck,
  onRestoreBuiltinDecks,
  onAppendWordsToDeck,
  onClose,
}: ManageModalProps) {
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDeleteDeck, setConfirmDeleteDeck] = useState(false);

  const [newDeckName, setNewDeckName] = useState('');
  const [renameDraft, setRenameDraft] = useState<{ deckId: string; text: string }>({
    deckId: activeDeck.id,
    text: activeDeck.name,
  });
  const renameText = renameDraft.deckId === activeDeck.id ? renameDraft.text : activeDeck.name;
  const setRenameText = (text: string) => setRenameDraft({ deckId: activeDeck.id, text });

  // Batch paste & auto-complete
  const [pasteText, setPasteText] = useState('');
  const [matchedPreview, setMatchedPreview] = useState<WordEntry[]>([]);
  const [unmatchedRows, setUnmatchedRows] = useState<PendingManualWord[]>([]);
  const firstEmptyMeaningRef = useRef<HTMLInputElement | null>(null);

  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const deckJsonInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (unmatchedRows.length > 0) {
      setTimeout(() => firstEmptyMeaningRef.current?.focus(), 40);
    }
  }, [unmatchedRows.length]);

  const handleImportBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AppStorageState;
      if (!parsed || typeof parsed !== 'object' || !parsed.decks) {
        setFeedback({ type: 'err', msg: '备份文件格式不正确，缺少词库进度字段。' });
        return;
      }
      onImportBackup(parsed);
      setFeedback({ type: 'ok', msg: '已恢复备份进度。' });
    } catch {
      setFeedback({ type: 'err', msg: '读取备份文件失败，请确认是有效的 JSON 文件。' });
    }
  };

  const handleImportDeckFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const list = Array.isArray(parsed)
        ? parsed
        : (parsed as Record<string, unknown>)?.words;
      const normalized = normalizeImportedWords(list);
      if (normalized.length === 0) {
        setFeedback({ type: 'err', msg: 'JSON 中没有识别到有效的词条数据。' });
        return;
      }
      onImportDeckWords(normalized);
      setFeedback({
        type: 'ok',
        msg: `已导入 ${normalized.length} 个词到「${activeDeck.name}」（打卡天数与历史战绩保留）。`,
      });
    } catch {
      setFeedback({ type: 'err', msg: '解析 JSON 词库失败，请确认文件编码与格式正确。' });
    }
  };

  const handleParsePaste = () => {
    const { matched, unmatched } = parseAndLookupWords(pasteText);
    if (matched.length === 0 && unmatched.length === 0) {
      setFeedback({ type: 'err', msg: '请先输入或粘贴英文单词（用空格、逗号或换行分隔）。' });
      return;
    }
    setMatchedPreview(matched);
    setUnmatchedRows(
      unmatched.map((w) => ({
        word: w,
        phonetic: '',
        pos: 'n.',
        meaning: '',
        example: '',
        exampleZh: '',
      }))
    );
    setFeedback({
      type: 'ok',
      msg: `离线词库命中 ${matched.length} 个词，未命中 ${unmatched.length} 个词${
        unmatched.length > 0 ? '（请在下方表格补充中文释义）' : ''
      }。`,
    });
  };

  const handleSaveParsedWords = () => {
    const invalidManual = unmatchedRows.find((r) => !r.meaning.trim());
    if (invalidManual) {
      setFeedback({
        type: 'err',
        msg: `请先为「${invalidManual.word}」填写中文释义后再保存。`,
      });
      return;
    }
    const manualEntries: WordEntry[] = unmatchedRows.map((r) => {
      const ph = r.phonetic.trim();
      const normalizedPh = ph ? (ph.startsWith('/') ? ph : `/${ph}/`) : '/—/';
      return {
        word: r.word,
        phonetic: normalizedPh,
        pos: r.pos.trim() || 'n.',
        meaning: r.meaning.trim(),
        example:
          r.example.trim() ||
          `Practice using the word ${r.word} inside a short daily sentence.`,
        exampleZh: r.exampleZh.trim() || '试着在简短的日常例句中使用这个单词。',
        memo: '自定义补充词条 · 结合语境例句记忆',
        collocations: r.word,
        family: '暂无派生词',
        confusable: '注意核对词性与拼写',
      };
    });
    const combined = [...matchedPreview, ...manualEntries];
    if (combined.length === 0) return;
    onAppendWordsToDeck(combined);
    setPasteText('');
    setMatchedPreview([]);
    setUnmatchedRows([]);
    setFeedback({
      type: 'ok',
      msg: `已将 ${combined.length} 个词条加入「${activeDeck.name}」。`,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#14161F]/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="管理与备份"
    >
      <div className="surface-card w-full max-w-[740px] max-h-[86dvh] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6EEF8] flex items-center justify-between gap-3 shrink-0">
          <h2 className="text-base font-bold text-[#14161F]">管理与备份</h2>
          <SafeButton
            onClick={onClose}
            aria-label="关闭管理弹窗"
            className="btn-secondary w-9 h-9 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </SafeButton>
        </div>

        <div className="scroll-inner flex-1 min-h-0 p-5 flex flex-col gap-5">
          {/* Browser Storage Disclaimer (Direct Human Language) */}
          <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] px-4 py-3 text-xs text-[#92400E] leading-relaxed">
            学习进度仅保存在当前浏览器的本地缓存（localStorage）中。清理浏览器数据、使用无痕模式或更换手机/电脑会导致进度永久丢失，请定期点击「导出备份」保存文件。
          </div>

          {feedback && (
            <div
              className={`rounded-xl px-4 py-2.5 text-xs font-medium border ${
                feedback.type === 'ok'
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#0E7B54]'
                  : 'bg-[#FEF2F2] border-[#F6D0D2] text-[#B91C1C]'
              }`}
            >
              {feedback.msg}
            </div>
          )}

          {/* Section 1: Progress Backup & Standalone HTML Download */}
          <section className="flex flex-col gap-2.5 pb-4 border-b border-[#E6EEF8]">
            <h3 className="text-sm font-bold text-[#14161F]">进度备份与离线版本</h3>
            <div className="flex flex-wrap items-center gap-2.5">
              <SafeButton
                onClick={() => {
                  onExportBackup();
                  setFeedback({ type: 'ok', msg: `已导出备份文件（${today}）。` });
                }}
                className="btn-primary min-h-[40px] px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出备份</span>
              </SafeButton>

              <SafeButton
                onClick={() => backupInputRef.current?.click()}
                className="btn-secondary min-h-[40px] px-4 py-2 text-xs font-semibold flex items-center gap-1.5 text-[#14161F]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>导入备份</span>
              </SafeButton>
              <input
                ref={backupInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportBackupFile}
                className="hidden"
              />

              <a
                href="/vocab-booster.html"
                download="vocab-booster.html"
                className="btn-secondary min-h-[40px] px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 text-[#1E80FF] border-[#C7DAF5] no-underline"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>下载离线单文件版 (.html)</span>
              </a>

              {!confirmReset ? (
                <SafeButton
                  onClick={() => setConfirmReset(true)}
                  className="btn-secondary min-h-[40px] px-4 py-2 text-xs font-semibold text-[#E5484D] border-[#F6D0D2] flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重置全部进度</span>
                </SafeButton>
              ) : (
                <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#F6D0D2] px-3 py-1.5 rounded-xl">
                  <span className="text-xs text-[#B91C1C]">确认清空所有词库进度与打卡？（词库保留）</span>
                  <SafeButton
                    onClick={() => {
                      onResetAllProgress();
                      setConfirmReset(false);
                      setFeedback({ type: 'ok', msg: '已重置全部学习进度。' });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#E5484D] text-white text-xs font-semibold"
                  >
                    确认重置
                  </SafeButton>
                  <SafeButton
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-1 rounded-lg bg-white text-[#6B7385] text-xs font-medium border border-[#DCE5F2]"
                  >
                    取消
                  </SafeButton>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Deck Management */}
          <section className="flex flex-col gap-3 pb-4 border-b border-[#E6EEF8]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#14161F]">
                词库管理（当前：{activeDeck.name} · {activeDeck.words.length} 词）
              </h3>
            </div>

            {/* Create & Rename */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="新词库名称（如：四级完整版）"
                  maxLength={24}
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-[#DCE5F2] bg-[#F8FBFF] text-xs text-[#14161F]"
                />
                <SafeButton
                  onClick={() => {
                    const name = newDeckName.trim();
                    if (!name) {
                      setFeedback({ type: 'err', msg: '请输入新词库名称。' });
                      return;
                    }
                    onCreateBlankDeck(name);
                    setNewDeckName('');
                    setFeedback({ type: 'ok', msg: `已新建空白词库「${name}」并切换过去。` });
                  }}
                  className="btn-secondary min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#1E80FF] shrink-0 flex items-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>新建空白词库</span>
                </SafeButton>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  placeholder="修改当前词库名"
                  maxLength={24}
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-[#DCE5F2] bg-[#F8FBFF] text-xs text-[#14161F]"
                />
                <SafeButton
                  onClick={() => {
                    const name = renameText.trim();
                    if (!name) {
                      setFeedback({ type: 'err', msg: '词库名称不能为空。' });
                      return;
                    }
                    onRenameCurrentDeck(name);
                    setFeedback({ type: 'ok', msg: `当前词库已重命名为「${name}」。` });
                  }}
                  className="btn-secondary min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#14161F] shrink-0"
                >
                  重命名
                </SafeButton>
              </div>
            </div>

            {/* JSON Import / Export / Restore / Delete */}
            <div className="flex flex-wrap items-center gap-2">
              <SafeButton
                onClick={() => deckJsonInputRef.current?.click()}
                className="btn-secondary min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-[#1E80FF] border-[#C7DAF5]"
              >
                导入 JSON 词库
              </SafeButton>
              <input
                ref={deckJsonInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportDeckFile}
                className="hidden"
              />

              <SafeButton
                onClick={() => {
                  onExportCurrentDeck();
                  setFeedback({ type: 'ok', msg: `已导出「${activeDeck.name}」词库 JSON。` });
                }}
                className="btn-secondary min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-[#14161F]"
              >
                导出当前词库
              </SafeButton>

              <SafeButton
                onClick={() => {
                  onRestoreBuiltinDecks();
                  setFeedback({ type: 'ok', msg: '已恢复内置 6 套精选词库。' });
                }}
                className="btn-secondary min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-[#6B7385]"
              >
                恢复内置词库
              </SafeButton>

              {!confirmDeleteDeck ? (
                <SafeButton
                  onClick={() => {
                    if (activeDeck.builtin) {
                      setFeedback({
                        type: 'err',
                        msg: '内置 6 套核心词库不能删除，只能删除自己新建的词库。',
                      });
                      return;
                    }
                    setConfirmDeleteDeck(true);
                  }}
                  className="btn-secondary min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-[#E5484D] border-[#F6D0D2] flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除当前词库</span>
                </SafeButton>
              ) : (
                <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#F6D0D2] px-3 py-1 rounded-xl">
                  <span className="text-xs text-[#B91C1C]">确认删除「{activeDeck.name}」？</span>
                  <SafeButton
                    onClick={() => {
                      onDeleteCurrentDeck();
                      setConfirmDeleteDeck(false);
                      setFeedback({ type: 'ok', msg: '已删除该自定义词库。' });
                    }}
                    className="px-2.5 py-1 rounded bg-[#E5484D] text-white text-xs font-semibold"
                  >
                    确认删除
                  </SafeButton>
                  <SafeButton
                    onClick={() => setConfirmDeleteDeck(false)}
                    className="px-2 py-1 rounded bg-white text-[#6B7385] text-xs border border-[#DCE5F2]"
                  >
                    取消
                  </SafeButton>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Batch Paste & Offline MASTER_DICT Auto-Complete */}
          <section className="flex flex-col gap-2.5">
            <h3 className="text-sm font-bold text-[#14161F]">
              批量粘贴英文单词并解析补全（添加到「{activeDeck.name}」）
            </h3>
            <textarea
              rows={3}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="粘贴英文单词（空格、逗号或换行分隔），例如：abandon, academic, algorithm, customword"
              className="w-full p-3 rounded-xl border border-[#DCE5F2] bg-[#F8FBFF] text-xs sm:text-sm text-[#14161F] focus:bg-white focus:border-[#1E80FF]"
            />
            <div className="flex items-center gap-2.5">
              <SafeButton
                onClick={handleParsePaste}
                className="btn-secondary min-h-[38px] px-4 py-1.5 text-xs font-semibold text-[#1E80FF] border-[#C7DAF5]"
              >
                解析并补全
              </SafeButton>
              {(matchedPreview.length > 0 || unmatchedRows.length > 0) && (
                <SafeButton
                  onClick={handleSaveParsedWords}
                  className="btn-primary min-h-[38px] px-4 py-1.5 text-xs font-semibold"
                >
                  保存这 {matchedPreview.length + unmatchedRows.length} 个词到词库
                </SafeButton>
              )}
            </div>

            {matchedPreview.length > 0 && (
              <div className="rounded-xl border border-[#E6EEF8] bg-[#F8FBFF] p-3 text-xs text-[#6B7385]">
                <div className="font-semibold text-[#14161F] mb-1">
                  离线词典已自动补全（{matchedPreview.length} 词）
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {matchedPreview.map((m) => (
                    <span key={m.word}>
                      <strong className="text-[#14161F]">{m.word}</strong> {m.phonetic} {m.meaning}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {unmatchedRows.length > 0 && (
              <div className="rounded-xl border border-[#E6EEF8] overflow-hidden">
                <div className="bg-[#F3F8FF] px-3 py-2 text-xs font-semibold text-[#14161F]">
                  未命中词条（请至少填写中文释义）
                </div>
                <div className="divide-y divide-[#E6EEF8]">
                  {unmatchedRows.map((row, idx) => (
                    <div
                      key={row.word}
                      className="p-2.5 grid grid-cols-1 sm:grid-cols-[100px_90px_70px_1fr] gap-2 items-center"
                    >
                      <span className="font-bold text-xs text-[#14161F]">{row.word}</span>
                      <input
                        type="text"
                        value={row.phonetic}
                        onChange={(e) => {
                          const v = e.target.value;
                          setUnmatchedRows((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, phonetic: v } : r))
                          );
                        }}
                        placeholder="/音标/"
                        className="px-2 py-1 rounded border border-[#DCE5F2] text-xs font-mono"
                      />
                      <input
                        type="text"
                        value={row.pos}
                        onChange={(e) => {
                          const v = e.target.value;
                          setUnmatchedRows((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, pos: v } : r))
                          );
                        }}
                        placeholder="n./v."
                        className="px-2 py-1 rounded border border-[#DCE5F2] text-xs"
                      />
                      <input
                        ref={idx === 0 ? firstEmptyMeaningRef : undefined}
                        type="text"
                        value={row.meaning}
                        onChange={(e) => {
                          const v = e.target.value;
                          setUnmatchedRows((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, meaning: v } : r))
                          );
                        }}
                        placeholder="必填：中文释义"
                        className="px-2 py-1 rounded border border-[#DCE5F2] text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
