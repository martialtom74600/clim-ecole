import { appendPipelineLog } from './pipelineLogBus.js';

const PREFIX = '[clim-ecole]';

function publish(level, message) {
  appendPipelineLog({ level, message });
}

export const logger = {
  info(message) {
    console.log(`${PREFIX} ${message}`);
    publish('info', message);
  },
  success(message) {
    console.log(`${PREFIX} ✓ ${message}`);
    publish('success', message);
  },
  warn(message) {
    console.warn(`${PREFIX} ⚠ ${message}`);
    publish('warn', message);
  },
  error(message, err) {
    const detail = err?.message ? `${message} — ${err.message}` : message;
    console.error(`${PREFIX} ✗ ${message}`, err?.message ?? '');
    publish('error', detail);
  },
  step(current, total, message) {
    const line = `[${current}/${total}] ${message}`;
    console.log(`${PREFIX} ${line}`);
    publish('info', line);
  },
};
