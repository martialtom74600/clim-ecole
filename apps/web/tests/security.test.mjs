/**
 * Tests sécurité (node --test) — pas de dépendance TS runtime.
 * Run: cd apps/web && node --test tests/security.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);

describe('security invariants', () => {
  it('dev/unlock disabled in production', async () => {
    const src = await readFile(new URL('app/api/dev/unlock/route.ts', root), 'utf8');
    assert.ok(src.includes("NODE_ENV === 'production'"));
    assert.ok(src.includes('404'));
  });

  it('stripe/complete does not grant entitlements', async () => {
    const src = await readFile(new URL('app/api/stripe/complete/route.ts', root), 'utf8');
    assert.ok(!src.includes('grantPackAccess'));
    assert.ok(!src.includes('grantProSubscription'));
    assert.ok(src.includes('waitForPackEntitlement') || src.includes('waitForProEntitlement'));
  });

  it('crypto requires AUTH_SECRET in production', async () => {
    const src = await readFile(new URL('lib/crypto.ts', root), 'utf8');
    assert.ok(src.includes('AUTH_SECRET est obligatoire en production'));
    assert.ok(!src.includes('ADMIN_PASSWORD ||'));
  });

  it('webhook uses idempotency', async () => {
    const src = await readFile(new URL('app/api/stripe/webhook/route.ts', root), 'utf8');
    assert.ok(src.includes('isStripeEventProcessed'));
    assert.ok(src.includes('validateCheckoutSession'));
  });

  it('middleware protects admin export APIs', async () => {
    const src = await readFile(new URL('middleware.ts', root), 'utf8');
    assert.ok(src.includes('/api/export'));
    assert.ok(src.includes('/api/dossier'));
  });

  it('test mode blocked on Vercel production', async () => {
    const src = await readFile(new URL('lib/test-mode.ts', root), 'utf8');
    assert.ok(src.includes("VERCEL_ENV === 'production'"));
    assert.ok(src.includes('return false'));
  });
});
