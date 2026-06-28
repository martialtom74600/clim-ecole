/**
 * Envoie les alertes email territoire aux abonnés (cron nightly / manuel).
 * Usage: node src/scripts/sendTerritoryAlerts.js [--digest]
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const PREFIX = 'clim-pack:';

function encodePackId(codeEpci) {
  return Buffer.from(`${PREFIX}${codeEpci}`, 'utf8').toString('base64url');
}

function supabase() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
  return createClient(url, key);
}

async function sendEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn('[alerts] RESEND non configuré — skip envoi');
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  return res.ok;
}

async function loadTerritoryCatalog(sb) {
  const { data: epciRows } = await sb.from('epci').select('code_epci, nom');
  if (!epciRows?.length) return [];

  const { data: batRows } = await sb.from('batiments').select('epci_id, capex_total');
  const capexByEpci = new Map();
  for (const b of batRows ?? []) {
    const id = b.epci_id;
    capexByEpci.set(id, (capexByEpci.get(id) ?? 0) + Number(b.capex_total ?? 0));
  }

  const { data: epciFull } = await sb.from('epci').select('id, code_epci, nom');
  return (epciFull ?? []).map((e) => ({
    codeEpci: e.code_epci,
    name: e.nom,
    packId: encodePackId(e.code_epci),
    capex: capexByEpci.get(e.id) ?? 0,
    budgetRange: formatBudgetRange(capexByEpci.get(e.id) ?? 0),
    grade: 'B',
  }));
}

function formatBudgetRange(capex) {
  if (capex >= 1_500_000) return '> 1,5 M€';
  if (capex >= 800_000) return '800 k€ – 1,5 M€';
  if (capex >= 400_000) return '400 k€ – 800 k€';
  return '< 400 k€';
}

async function wasSent(sb, subscriptionId, packId, type) {
  const { data } = await sb
    .from('alert_dispatch_log')
    .select('id')
    .eq('subscription_id', subscriptionId)
    .eq('pack_id', packId)
    .eq('dispatch_type', type)
    .maybeSingle();
  return Boolean(data);
}

async function logSent(sb, subscriptionId, packId, type) {
  await sb.from('alert_dispatch_log').upsert(
    {
      subscription_id: subscriptionId,
      pack_id: packId,
      dispatch_type: type,
      sent_at: new Date().toISOString(),
    },
    { onConflict: 'subscription_id,pack_id,dispatch_type' },
  );
}

async function main() {
  const digest = process.argv.includes('--digest');
  const sb = supabase();
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';

  const { data: subs } = await sb.from('alert_subscriptions').select('*');
  if (!subs?.length) {
    console.log('[alerts] Aucun abonné');
    return;
  }

  const catalog = await loadTerritoryCatalog(sb);
  console.log(`[alerts] ${subs.length} abonné(s), ${catalog.length} territoire(s)`);

  for (const sub of subs) {
    const minCapex = sub.min_capex ?? 400_000;
    const matching = catalog
      .filter((p) => p.capex >= minCapex || p.capex === 0)
      .slice(0, digest ? 10 : 5);

    const toSend = [];
    for (const pack of matching) {
      const type = digest ? 'weekly_digest' : 'new_territory';
      if (await wasSent(sb, sub.id, pack.packId, type)) continue;
      toSend.push(pack);
    }

    if (!toSend.length) continue;

    const items = toSend
      .map(
        (p) =>
          `<li><a href="${base}/explorer/${p.packId}">${p.name}</a> — ${p.budgetRange} · Score ${p.grade}</li>`,
      )
      .join('');

    const subject = digest
      ? `Top ${toSend.length} territoires — Clim École`
      : `${toSend.length} territoire(s) pour vous — Clim École`;

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h1>${digest ? 'Digest hebdomadaire' : 'Nouveaux territoires'}</h1>
        <ul>${items}</ul>
        <p><a href="${base}/explorer">Ouvrir l'explorateur</a></p>
      </div>`;

    const ok = await sendEmail(sub.email, subject, html);
    if (ok) {
      const type = digest ? 'weekly_digest' : 'new_territory';
      for (const p of toSend) await logSent(sb, sub.id, p.packId, type);
      console.log(`[alerts] Envoyé à ${sub.email} (${toSend.length} packs)`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
