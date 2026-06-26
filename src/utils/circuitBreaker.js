import { sleep } from './sleep.js';
import { logger } from './logger.js';

export class CircuitBreaker {
  constructor(name, { failureThreshold = 5, cooldownMs = 30000 } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.failures = 0;
    this.openUntil = 0;
  }

  async exec(task) {
    if (Date.now() < this.openUntil) {
      const waitMs = this.openUntil - Date.now();
      logger.warn(`[${this.name}] Circuit ouvert — pause ${Math.ceil(waitMs / 1000)}s`);
      await sleep(waitMs);
    }

    try {
      const result = await task();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
  }

  onFailure(error) {
    const status = error.response?.status;
    if (status !== 429 && status !== 503 && status !== 502 && status !== 504 && !error.code) {
      return;
    }

    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.openUntil = Date.now() + this.cooldownMs;
      logger.warn(
        `[${this.name}] Circuit ouvert après ${this.failures} échecs — cooldown ${this.cooldownMs / 1000}s`,
      );
      this.failures = 0;
    }
  }
}
