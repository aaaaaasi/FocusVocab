import type { AppStorageState } from './types';
import { createInitialState, formatLocalDate } from './vocab-engine';
import { BUILTIN_DECKS } from './decks';

export const STORAGE_KEY = 'vocab-booster-pro.v1';

export function loadStorageState(): { state: AppStorageState; storageError: string | null } {
  const today = formatLocalDate();
  const base = createInitialState(today);
  if (typeof window === 'undefined') {
    return { state: base, storageError: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: base, storageError: null };
    }
    const parsed = JSON.parse(raw) as Partial<AppStorageState>;
    const mergedDecks = { ...base.decks, ...(parsed.decks || {}) };
    for (const bd of BUILTIN_DECKS) {
      if (!mergedDecks[bd.id]) {
        mergedDecks[bd.id] = base.decks[bd.id];
      }
    }
    const merged: AppStorageState = {
      version: 1,
      activeDeckId: typeof parsed.activeDeckId === 'string' ? parsed.activeDeckId : base.activeDeckId,
      dailySize: typeof parsed.dailySize === 'number' && parsed.dailySize > 0 ? parsed.dailySize : 7,
      maskEnabled: typeof parsed.maskEnabled === 'boolean' ? parsed.maskEnabled : true,
      nickname: typeof parsed.nickname === 'string' && parsed.nickname.trim() ? parsed.nickname.slice(0, 12) : 'TCAMP 同学',
      decks: mergedDecks,
      customDecks: Array.isArray(parsed.customDecks) ? parsed.customDecks : [],
      globalCheckins: parsed.globalCheckins && typeof parsed.globalCheckins === 'object' ? parsed.globalCheckins : {},
      deckOverrides: parsed.deckOverrides && typeof parsed.deckOverrides === 'object' ? parsed.deckOverrides : undefined,
    };
    return { state: merged, storageError: null };
  } catch {
    return {
      state: base,
      storageError: '当前浏览器限制了本地缓存读取，进度可能无法长期保存。',
    };
  }
}

export function saveStorageState(state: AppStorageState): { ok: boolean; error: string | null } {
  if (typeof window === 'undefined') {
    return { ok: true, error: null };
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true, error: null };
  } catch {
    return {
      ok: false,
      error: '这个浏览器当前不允许保存本地进度（无痕模式或存储受限），关闭页面后数据将会丢失。',
    };
  }
}
