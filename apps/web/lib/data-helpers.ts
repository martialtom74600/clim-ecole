import type { ClosingLevel } from './types';

export function isClosingChaud(temperature: string): boolean {
  const t = String(temperature ?? '').toLowerCase();
  return t.includes('chaud') || String(temperature).includes('🔥');
}

export function isClosingTiede(temperature: string): boolean {
  const t = String(temperature ?? '').toLowerCase();
  return t.includes('tiède') || t.includes('tiede') || String(temperature).includes('⚡');
}

export function isClosingFroid(temperature: string): boolean {
  const t = String(temperature ?? '').toLowerCase();
  return t.includes('froid') || String(temperature).includes('❄');
}

export function temperatureLevel(temperature: string): ClosingLevel {
  if (isClosingChaud(temperature)) return 'chaud';
  if (isClosingTiede(temperature)) return 'tiede';
  return 'froid';
}
