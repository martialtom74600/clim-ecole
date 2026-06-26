'use client';

const WATCHLIST_KEY = 'clim-radar-watchlist';
const COMPARE_KEY = 'clim-radar-compare';
const FILTER_KEY = 'clim-radar-filter';
const ALERTS_KEY = 'clim-radar-alerts';

export function getWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function toggleWatchlist(packId: string): string[] {
  const list = getWatchlist();
  const next = list.includes(packId)
    ? list.filter((id) => id !== packId)
    : [...list, packId];
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
  return next;
}

export function getCompareList(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(COMPARE_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function toggleCompare(packId: string, max = 3): string[] {
  const list = getCompareList();
  if (list.includes(packId)) {
    const next = list.filter((id) => id !== packId);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
    return next;
  }
  const next = [...list, packId].slice(-max);
  localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  return next;
}

export function savePersonaFilter(filter: string): void {
  localStorage.setItem(FILTER_KEY, filter);
}

export function loadPersonaFilter(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(FILTER_KEY);
}

export interface AlertPreferences {
  minCapex: number;
  personas: string[];
  email: string;
}

export function saveAlertPreferences(prefs: AlertPreferences): void {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(prefs));
}

export function loadAlertPreferences(): AlertPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(ALERTS_KEY) ?? 'null') as AlertPreferences;
  } catch {
    return null;
  }
}
