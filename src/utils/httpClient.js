import axios from 'axios';
import { sleep } from './sleep.js';
import { logger } from './logger.js';

const DEFAULT_USER_AGENT = 'clim-ecole-prospection/1.0';

export function jitter(ms) {
  const spread = Math.floor(ms * 0.2);
  return ms + Math.floor(Math.random() * spread);
}

/** En-têtes quota BDNB (Open = 10k/mois, Open Plus = 1M/mois) */
export function parseBdnbQuotaFromError(error) {
  const headers = error?.response?.headers ?? {};
  const toNum = (value) => (value != null && value !== '' ? Number(value) : null);
  const resetMs = toNum(headers['x-quota-reset']);

  return {
    message: error?.response?.data?.message ?? null,
    monthlyLimit: toNum(headers['x-quota-limit']),
    monthlyRemaining: toNum(headers['x-quota-remaining']),
    resetAt: resetMs != null && !Number.isNaN(resetMs) ? new Date(resetMs) : null,
    perMinuteLimit: toNum(headers['x-rate-limit-limit']),
    perMinuteRemaining: toNum(headers['x-rate-limit-remaining']),
  };
}

export function parseRetryAfterMs(headers) {
  const retryAfter = headers?.['retry-after'];
  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);
  if (!Number.isNaN(seconds)) {
    return seconds * 1000;
  }

  const dateMs = Date.parse(retryAfter);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

/** Erreurs réseau / timeout — toujours réessayables */
export function isNetworkError(error) {
  if (!error) {
    return false;
  }
  const code = error.code;
  return (
    code === 'ECONNRESET'
    || code === 'ECONNABORTED'
    || code === 'ETIMEDOUT'
    || code === 'ENOTFOUND'
    || code === 'EAI_AGAIN'
    || code === 'ERR_NETWORK'
  );
}

/**
 * Erreurs HTTP temporaires — on réessaie jusqu'au succès (429, 5xx, réseau).
 * 4xx métier (400, 401, 403, 404, 422) : pas de retry.
 */
export function isTransientHttpError(error) {
  if (isNetworkError(error)) {
    return true;
  }

  const status = error?.response?.status;
  if (status == null) {
    return true;
  }

  if (status === 408 || status === 429 || status === 502 || status === 503 || status === 504) {
    return true;
  }

  return status >= 500;
}

function computeBackoffMsInternal(error, attempt, { maxBackoffMs, initialBackoffMs }) {
  const status = error?.response?.status;
  const retryAfterMs = parseRetryAfterMs(error?.response?.headers);

  if (retryAfterMs != null) {
    return Math.min(retryAfterMs, maxBackoffMs);
  }

  if (status === 429) {
    return Math.min(Math.max(initialBackoffMs * 2, attempt * 8000), maxBackoffMs);
  }

  if (status === 503 || status === 502 || status === 504) {
    return Math.min(initialBackoffMs * 2 ** Math.min(attempt - 1, 8), maxBackoffMs);
  }

  return Math.min(initialBackoffMs * 2 ** Math.min(attempt - 1, 10), maxBackoffMs);
}

export function computeBackoffMs(error, attempt, opts) {
  return computeBackoffMsInternal(error, attempt, opts);
}

export async function axiosGetJson(url, { params, timeoutMs = 45000, headers = {} } = {}) {
  const response = await axios.get(url, {
    params,
    timeout: timeoutMs,
    headers: {
      Accept: 'application/json',
      'User-Agent': DEFAULT_USER_AGENT,
      ...headers,
    },
    validateStatus: (status) => status >= 200 && status < 300,
  });

  return response.data;
}

/**
 * GET JSON avec retries illimités sur erreurs transitoires (429, 5xx, réseau).
 * Conçu pour des runs longs (10 → 1M+ requêtes) sans échec rate-limit.
 */
export async function getJsonReliable(
  url,
  {
    params,
    delayMs = 0,
    label = 'API',
    timeoutMs = 45000,
    maxBackoffMs = 300_000,
    initialBackoffMs = 2000,
    logEveryAttempts = 5,
    onRetry,
    isRetryable = isTransientHttpError,
  } = {},
) {
  let attempt = 0;

  while (true) {
    attempt += 1;

    try {
      if (delayMs > 0 && attempt === 1) {
        await sleep(delayMs);
      }

      return await axiosGetJson(url, { params, timeoutMs });
    } catch (error) {
      if (!isRetryable(error)) {
        throw error;
      }

      const backoff = jitter(computeBackoffMs(error, attempt, { maxBackoffMs, initialBackoffMs }));
      const status = error.response?.status ?? error.code ?? 'network';

      if (attempt === 1 || attempt % logEveryAttempts === 0) {
        logger.warn(
          `${label} indisponible (${status}) — retry ${attempt} dans ${Math.ceil(backoff / 1000)}s`,
        );
      }

      onRetry?.({ attempt, status, backoff, error });
      await sleep(backoff);
    }
  }
}

/**
 * @deprecated Préférer getJsonReliable via RateLimitedClient (apiClients.js).
 * Conservé pour compatibilité — délègue au mode fiable avec plafond de tentatives optionnel.
 */
export async function getJson(url, options = {}) {
  const maxAttempts = options.retries ?? options.maxAttempts;
  if (maxAttempts == null || maxAttempts === Infinity || maxAttempts <= 0) {
    return getJsonReliable(url, options);
  }

  let attempt = 0;
  let lastError;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      if (options.delayMs > 0 && attempt === 1) {
        await sleep(options.delayMs);
      }
      return await axiosGetJson(url, {
        params: options.params,
        timeoutMs: options.timeoutMs ?? 45000,
      });
    } catch (error) {
      lastError = error;
      const retryable = options.isRetryable?.(error.response?.status) ?? isTransientHttpError(error);
      if (!retryable || attempt >= maxAttempts) {
        throw error;
      }

      const backoff = jitter(
        computeBackoffMs(error, attempt, {
          maxBackoffMs: options.maxBackoffMs ?? 300_000,
          initialBackoffMs: options.initialBackoffMs ?? 2000,
        }),
      );

      logger.warn(
        `${options.label ?? 'API'} indisponible (${error.response?.status ?? error.code}) — tentative ${attempt}/${maxAttempts} dans ${Math.ceil(backoff / 1000)}s`,
      );

      options.onRetry?.({ attempt, status: error.response?.status, backoff, error });
      await sleep(backoff);
    }
  }

  throw lastError;
}

/** fetch() avec retries illimités sur 429 / 5xx */
export async function fetchJsonReliable(url, { label = 'fetch', maxBackoffMs = 300_000 } = {}) {
  let attempt = 0;

  while (true) {
    attempt += 1;

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': DEFAULT_USER_AGENT },
      });

      if (res.ok) {
        return res.json();
      }

      const error = new Error(`${label} HTTP ${res.status}`);
      error.response = { status: res.status, headers: Object.fromEntries(res.headers.entries()) };
      throw error;
    } catch (error) {
      if (!isTransientHttpError(error) && !isNetworkError(error)) {
        throw error;
      }

      const backoff = jitter(
        computeBackoffMs(error, attempt, { maxBackoffMs, initialBackoffMs: 2000 }),
      );

      if (attempt === 1 || attempt % 5 === 0) {
        const status = error.response?.status ?? error.code ?? 'network';
        logger.warn(`${label} (${status}) — retry ${attempt} dans ${Math.ceil(backoff / 1000)}s`);
      }

      await sleep(backoff);
    }
  }
}
