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
  /** true si une session compte est active (cookie magic-link / achat). */
  authenticated: boolean;
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

/** Union ordonnée, sans doublon — base de la fusion local ↔ serveur. */
function mergeIds(server: string[], local: string[]): string[] {
  return Array.from(new Set([...server, ...local]));
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
  const [authenticated, setAuthenticated] = useState(false);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const syncFromServer = useCallback(async () => {
    const localOnly = (): AccountPreferences => ({
      watchlist: readLocal(LOCAL_WATCH),
      compareIds: readLocal(LOCAL_COMPARE),
      blacklistUais: [],
    });

    try {
      const res = await fetch('/api/account/preferences');
      if (!res.ok) {
        setAuthenticated(false);
        setPrefs(localOnly());
        return;
      }

      const data = (await res.json()) as AccountPreferences & {
        authenticated?: boolean;
        removedWatchlist?: string[];
      };
      setAuthenticated(Boolean(data.authenticated));

      // Visiteur anonyme : aucune source serveur, on préserve le localStorage
      // (sinon les favoris collectés avant connexion seraient écrasés).
      if (!data.authenticated) {
        setPrefs(localOnly());
        return;
      }

      // Connecté : on fusionne ce qui a été collecté en local (avant login,
      // ou sur cet appareil) avec le compte serveur → persistance cross-device.
      // Les tombstones (retraits explicites sur un autre appareil) empêchent la
      // "résurrection" d'un favori supprimé par un localStorage périmé.
      const tombstones = new Set(data.removedWatchlist ?? []);
      const localWatch = readLocal(LOCAL_WATCH);
      const localCompare = readLocal(LOCAL_COMPARE);
      const mergedWatch = mergeIds(data.watchlist ?? [], localWatch).filter(
        (id) => !tombstones.has(id),
      );
      const mergedCompare = mergeIds(data.compareIds ?? [], localCompare).slice(-3);
      const merged: AccountPreferences = {
        watchlist: mergedWatch,
        compareIds: mergedCompare,
        blacklistUais: data.blacklistUais ?? [],
        onboarding: data.onboarding ?? null,
      };

      setPrefs(merged);
      writeLocal(LOCAL_WATCH, mergedWatch);
      writeLocal(LOCAL_COMPARE, mergedCompare);

      // Le local apportait des éléments absents du compte → on les rattache
      // au compte une bonne fois (claim), pour qu'ils suivent sur tout appareil.
      const claimedNew =
        mergedWatch.length > (data.watchlist?.length ?? 0) ||
        mergedCompare.length > (data.compareIds?.length ?? 0);
      if (claimedNew) {
        fetch('/api/account/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged),
        }).catch(() => {
          /* best-effort — l'état local reste correct */
        });
      }
    } catch {
      setAuthenticated(false);
      setPrefs(localOnly());
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  // Synchro multi-onglets + reprise de focus : un retrait/ajout fait ailleurs
  // (autre onglet ou autre appareil) se propage sans rechargement manuel.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_WATCH || e.key === LOCAL_COMPARE) syncFromServer();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncFromServer();
    };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
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
    authenticated,
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
  authenticated: false,
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
