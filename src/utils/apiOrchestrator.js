import { config } from '../config.js';
import {
  axiosGetJson,
  computeBackoffMs,
  isTransientHttpError,
  jitter,
  parseBdnbQuotaFromError,
  parseRetryAfterMs,
} from './httpClient.js';
import { singleflight } from './singleflight.js';
import { sleep } from './sleep.js';
import { logger } from './logger.js';
import { BdnbQuotaExhaustedError } from '../errors/bdnbQuotaError.js';
import { bdnbQuotaBlocked, blockBdnbQuota } from '../services/bdnbQuotaState.js';

/** Token bucket — limite proactive avant le 429 */
class TokenBucket {
  constructor({ capacity = 1, refillIntervalMs = 2500 } = {}) {
    this.capacity = capacity;
    this.refillIntervalMs = refillIntervalMs;
    this.tokens = capacity;
    this.lastRefillAt = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefillAt;
    const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs);
    if (tokensToAdd <= 0) {
      return;
    }
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillAt = now;
  }

  async acquire() {
    while (true) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const waitMs = this.refillIntervalMs - (Date.now() - this.lastRefillAt);
      await sleep(Math.max(50, waitMs));
    }
  }

  reset() {
    this.tokens = this.capacity;
    this.lastRefillAt = Date.now();
  }
}

function stableKey(url, params) {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${JSON.stringify(params[k])}`)
    .join('&');
  return `${url}?${sorted}`;
}

/**
 * Orchestrateur HTTP — file séquentielle + token bucket + AIMD + singleflight.
 * Chaque tentative repasse par la file (fix: plus de rafale de 15 retries dans un slot).
 */
export class ApiOrchestratorClient {
  constructor(name, options = {}) {
    this.name = name;
    this.minIntervalMs = options.minIntervalMs ?? 200;
    this.maxIntervalMs = options.maxIntervalMs ?? 12_000;
    this.backoffMultiplier = options.backoffMultiplier ?? 1.5;
    this.recoverySuccessThreshold = options.recoverySuccessThreshold ?? 12;
    this.recoveryMultiplier = options.recoveryMultiplier ?? 0.9;
    this.currentIntervalMs = this.minIntervalMs;
    this.consecutiveSuccesses = 0;
    this.consecutive429 = 0;
    this.queue = Promise.resolve();
    this.lastRequestAt = 0;
    this.nextAllowedAt = 0;
    this.bucket = new TokenBucket({
      capacity: options.bucketCapacity ?? 1,
      refillIntervalMs: options.minIntervalMs ?? 200,
    });
    this.stats = {
      requests: 0,
      successes: 0,
      retries: 0,
      rateLimits: 0,
      deduped: 0,
      lastError: null,
      lastSuccessAt: null,
      currentIntervalMs: this.minIntervalMs,
      blockedUntil: 0,
    };
    this.extraHeaders = options.extraHeaders ?? {};
    this.quotaExhaustedLogged = false;
  }

  resetPressure() {
    this.currentIntervalMs = this.minIntervalMs;
    this.consecutiveSuccesses = 0;
    this.consecutive429 = 0;
    this.nextAllowedAt = 0;
    this.bucket.reset();
    this.stats.currentIntervalMs = this.currentIntervalMs;
    this.stats.blockedUntil = 0;
    logger.info(`[${this.name}] Orchestrateur réinitialisé (${this.minIntervalMs}ms)`);
  }

  getSnapshot() {
    return {
      name: this.name,
      ...this.stats,
      blockedUntil: Math.max(this.stats.blockedUntil, this.nextAllowedAt),
      blockedForSec: Math.max(0, Math.ceil((Math.max(this.stats.blockedUntil, this.nextAllowedAt) - Date.now()) / 1000)),
    };
  }

  bumpOnRateLimit(error, backoffMs) {
    this.consecutiveSuccesses = 0;
    this.consecutive429 += 1;
    this.stats.rateLimits += 1;

    if (this.name === 'BDNB') {
      const quota = parseBdnbQuotaFromError(error);
      if (quota.monthlyRemaining === 0) {
        if (!this.quotaExhaustedLogged) {
          this.quotaExhaustedLogged = true;
          logger.error(
            `[BDNB] Quota mensuel épuisé (${quota.monthlyLimit ?? 10_000} req/mois) — arrêt des appels API`,
          );
        }
        blockBdnbQuota();
        throw new BdnbQuotaExhaustedError(quota);
      }
      if (!this.quotaExhaustedLogged && quota.message) {
        logger.warn(`[BDNB] ${quota.message}`);
      }
    }

    const retryAfterMs = parseRetryAfterMs(error?.response?.headers);
    const globalPause = Math.max(backoffMs, retryAfterMs ?? 0, this.currentIntervalMs * 2);

    this.nextAllowedAt = Math.max(this.nextAllowedAt, Date.now() + globalPause);
    this.stats.blockedUntil = this.nextAllowedAt;

    const nextInterval = Math.min(
      Math.floor(this.currentIntervalMs * this.backoffMultiplier),
      this.maxIntervalMs,
    );
    if (nextInterval !== this.currentIntervalMs) {
      this.currentIntervalMs = nextInterval;
      this.bucket.refillIntervalMs = nextInterval;
      this.stats.currentIntervalMs = nextInterval;
      logger.warn(`[${this.name}] AIMD ↓ intervalle ${nextInterval}ms (pause globale ${Math.ceil(globalPause / 1000)}s)`);
    }
  }

  onSuccess() {
    this.consecutive429 = 0;
    this.consecutiveSuccesses += 1;
    this.stats.successes += 1;
    this.stats.lastSuccessAt = new Date().toISOString();

    if (this.consecutiveSuccesses < this.recoverySuccessThreshold) {
      return;
    }

    this.consecutiveSuccesses = 0;
    const next = Math.max(
      Math.floor(this.currentIntervalMs * this.recoveryMultiplier),
      this.minIntervalMs,
    );
    if (next !== this.currentIntervalMs) {
      this.currentIntervalMs = next;
      this.bucket.refillIntervalMs = next;
      this.stats.currentIntervalMs = next;
      logger.info(`[${this.name}] AIMD ↑ intervalle ${next}ms`);
    }
  }

  async waitForTurn() {
    await this.bucket.acquire();

    const now = Date.now();
    const throttleWait = Math.max(0, this.lastRequestAt + this.currentIntervalMs - now);
    const cooldownWait = Math.max(0, this.nextAllowedAt - now);
    const wait = Math.max(throttleWait, cooldownWait);

    if (wait > 0) {
      await sleep(wait);
    }

    this.lastRequestAt = Date.now();
  }

  /** Une tentative HTTP = un passage dans la file + token bucket */
  scheduleAttempt(task) {
    const run = this.queue.then(async () => {
      await this.waitForTurn();
      return task();
    });

    this.queue = run.catch(() => {});
    return run;
  }

  async executeOnce(url, options) {
    return this.scheduleAttempt(() =>
      axiosGetJson(url, {
        params: options.params,
        timeoutMs: options.timeoutMs ?? 45000,
        headers: { ...this.extraHeaders, ...options.headers },
      }),
    );
  }

  async getJson(url, options = {}) {
    const label = options.label ?? this.name;
    const dedupeKey = options.dedupeKey ?? stableKey(url, options.params);
    const flightKey = `${this.name}:${dedupeKey}`;

    return singleflight(flightKey, () => this.getJsonInner(url, { ...options, label, dedupeKey }));
  }

  async getJsonInner(url, options) {
    const label = options.label ?? this.name;
    let attempt = 0;

    while (true) {
      attempt += 1;
      this.stats.requests += 1;

      try {
        const data = await this.executeOnce(url, options);
        this.onSuccess();
        return data;
      } catch (error) {
        if (error instanceof BdnbQuotaExhaustedError) {
          throw error;
        }

        if (this.name === 'BDNB' && bdnbQuotaBlocked) {
          throw new BdnbQuotaExhaustedError({ monthlyLimit: 10_000, monthlyRemaining: 0 });
        }

        if (!isTransientHttpError(error)) {
          this.stats.lastError = {
            at: new Date().toISOString(),
            status: error.response?.status ?? error.code,
            message: error.message,
          };
          throw error;
        }

        this.stats.retries += 1;
        const backoff = jitter(
          computeBackoffMs(error, attempt, {
            maxBackoffMs: options.maxBackoffMs ?? config.http.maxBackoffMs,
            initialBackoffMs: options.initialBackoffMs ?? config.http.initialBackoffMs,
          }),
        );

        const status = error.response?.status ?? error.code ?? 'network';
        if (status === 429 || status === 503) {
          this.bumpOnRateLimit(error, backoff);
        }

        if (attempt === 1 || attempt % (options.logEveryAttempts ?? config.http.logEveryAttempts) === 0) {
          logger.warn(
            `${label} (${status}) — retry ${attempt}, prochain slot dans ${Math.ceil(backoff / 1000)}s`,
          );
        }

        options.onRetry?.({ attempt, status, backoff, error });
        await sleep(backoff);
      }
    }
  }
}
