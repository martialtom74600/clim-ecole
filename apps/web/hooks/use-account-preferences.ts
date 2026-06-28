'use client';

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface AccountPreferences {
  watchlist: string[];
  compareIds: string[];
  blacklistUais: string[];
  onboarding?: { persona?: string; minCapex?: number; completedAt?: string } | null;
}

export interface AccountPreferencesValue {
  prefs: AccountPreferences;
  loaded: boolean;
  toggleWatchlist: (packId: string) => string[];
  toggleCompare: (packId: string, max?: number) => string[];
  toggleBlacklist: (codeUai: string) => string[];
  completeOnboarding: (onboarding: NonNullable<AccountPreferences['onboarding']>) => void;
  refresh: () => Promise<void>;
}

const LOCAL_WATCH = 'clim-radar-watchlist';
const LOCAL_COMPARE = 'clim-radar-compare';

const EMPTY_PREFS: AccountPreferences = {
  watchlist: [],
  compareIds: [],
  blacklistUais: [],
};

function readLocal(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function writeLocal(key: string, ids: string[]) {
  localStorage.setItem(key, JSON.stringify(ids));
}

/**
 * Singleton state shared across the whole app. Without this, every
 * `WatchlistButton` (rendered once per pack) was firing its own
 * `GET /api/account/preferences`, flooding the server with hundreds of
 * identical requests. The provider fetches once and broadcasts.
 */
function useAccountPreferencesState(): AccountPreferencesValue {
  const [prefs, setPrefs] = useState<AccountPreferences>(EMPTY_PREFS);
  const [loaded, setLoaded] = useState(false);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const syncFromServer = useCallback(async () => {
    try {
      const res = await fetch('/api/account/preferences');
      if (res.ok) {
        const data = (await res.json()) as AccountPreferences;
        setPrefs(data);
        writeLocal(LOCAL_WATCH, data.watchlist ?? []);
        writeLocal(LOCAL_COMPARE, data.compareIds ?? []);
      } else {
        setPrefs({
          watchlist: readLocal(LOCAL_WATCH),
          compareIds: readLocal(LOCAL_COMPARE),
          blacklistUais: [],
        });
      }
    } catch {
      setPrefs({
        watchlist: readLocal(LOCAL_WATCH),
        compareIds: readLocal(LOCAL_COMPARE),
        blacklistUais: [],
      });
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  const persist = useCallback((next: AccountPreferences) => {
    setPrefs(next);
    writeLocal(LOCAL_WATCH, next.watchlist);
    writeLocal(LOCAL_COMPARE, next.compareIds);
    fetch('/api/account/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => {
      /* offline fallback — localStorage already updated */
    });
  }, []);

  const toggleWatchlist = useCallback(
    (packId: string) => {
      const current = prefsRef.current;
      const next = current.watchlist.includes(packId)
        ? current.watchlist.filter((id) => id !== packId)
        : [...current.watchlist, packId];
      persist({ ...current, watchlist: next });
      return next;
    },
    [persist],
  );

  const toggleCompare = useCallback(
    (packId: string, max = 3) => {
      const current = prefsRef.current;
      let next = current.compareIds;
      if (next.includes(packId)) {
        next = next.filter((id) => id !== packId);
      } else {
        next = [...next, packId].slice(-max);
      }
      persist({ ...current, compareIds: next });
      return next;
    },
    [persist],
  );

  const toggleBlacklist = useCallback(
    (codeUai: string) => {
      const current = prefsRef.current;
      const next = current.blacklistUais.includes(codeUai)
        ? current.blacklistUais.filter((u) => u !== codeUai)
        : [...current.blacklistUais, codeUai];
      persist({ ...current, blacklistUais: next });
      return next;
    },
    [persist],
  );

  const completeOnboarding = useCallback(
    (onboarding: NonNullable<AccountPreferences['onboarding']>) => {
      persist({
        ...prefsRef.current,
        onboarding: { ...onboarding, completedAt: new Date().toISOString() },
      });
    },
    [persist],
  );

  return {
    prefs,
    loaded,
    toggleWatchlist,
    toggleCompare,
    toggleBlacklist,
    completeOnboarding,
    refresh: syncFromServer,
  };
}

const AccountPreferencesContext = createContext<AccountPreferencesValue | null>(null);

export function AccountPreferencesProvider({ children }: { children: ReactNode }) {
  const value = useAccountPreferencesState();
  return createElement(AccountPreferencesContext.Provider, { value }, children);
}

const NOOP_VALUE: AccountPreferencesValue = {
  prefs: EMPTY_PREFS,
  loaded: true,
  toggleWatchlist: () => [],
  toggleCompare: () => [],
  toggleBlacklist: () => [],
  completeOnboarding: () => {},
  refresh: async () => {},
};

/**
 * Reads from the shared provider mounted at the app root. If no provider is
 * present (should not happen in practice), returns a static no-op value
 * instead of spinning up another fetching instance.
 */
export function useAccountPreferences(): AccountPreferencesValue {
  return useContext(AccountPreferencesContext) ?? NOOP_VALUE;
}
