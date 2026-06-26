import { logger } from './logger.js';

let requested = false;
const handlers = [];

export function isShutdownRequested() {
  return requested;
}

export function onShutdown(handler) {
  handlers.push(handler);
}

export function setupGracefulShutdown(...initialHandlers) {
  for (const handler of initialHandlers) {
    if (typeof handler === 'function') {
      onShutdown(handler);
    }
  }

  const trigger = async (signal) => {
    if (requested) {
      return;
    }

    requested = true;
    logger.warn(`Signal ${signal} reçu — arrêt gracieux en cours (checkpoint sauvegardé)...`);

    for (const handler of handlers) {
      try {
        await handler();
      } catch (error) {
        logger.error('Erreur lors de l’arrêt gracieux', error);
      }
    }

    process.exit(0);
  };

  process.on('SIGINT', () => {
    trigger('SIGINT');
  });

  process.on('SIGTERM', () => {
    trigger('SIGTERM');
  });
}
