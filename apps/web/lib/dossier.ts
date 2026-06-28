import type { EpciDetail } from './types';
import { formatEur, formatInt } from './format';
import { buildMgpeSummary } from './dossier-helpers';

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildMgpeDossierHtml(epci: EpciDetail): string {
  const date = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const mgpe = buildMgpeSummary(epci.batiments);
  const argLoi = mgpe?.argumentaireLoiElan ?? '';
  const argMgpe = mgpe?.argumentaireMgpePd ?? '';
  const racAfterSubs = Math.max(0, epci.packCapexTotal - epci.subventionsTotal);

  const batRows = epci.batiments
    .map(
      (b) => `
      <tr>
        <td>${esc(b.nomEcole)}</td>
        <td>${esc(b.commune)}</td>
        <td>${esc(b.classeDpe)}</td>
        <td class="num">${formatInt(b.surfaceM2)} m²</td>
        <td class="num">${formatEur(b.capexTotal)}</td>
        <td class="num">${formatEur(b.gainNetAnnuelMairieEuros)}/an</td>
        <td>${esc(b.closingTemperature)}</td>
      </tr>`,
    )
    .join('');

  const mgpeKpis = mgpe
    ? `
    <div class="kpi"><label>Durée contrat MGPE</label><span class="kpi-value">${mgpe.dureeContratAns} ans</span></div>
    <div class="kpi"><label>Gain net contractuel (pack)</label><span class="kpi-value">${formatEur(mgpe.gainNetContractuelEuros)}</span></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>Dossier MGPE-PD — ${esc(epci.displayName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a1a; max-width: 820px; margin: 0 auto; padding: 48px 40px; line-height: 1.55; }
    .header { border-bottom: 3px solid #0d9488; padding-bottom: 24px; margin-bottom: 32px; }
    .brand { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #0d9488; font-weight: 700; }
    h1 { font-size: 26px; margin: 8px 0 4px; }
    .meta { color: #666; font-size: 14px; }
    h2 { font-size: 16px; color: #0d9488; margin: 32px 0 12px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
    .kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0; }
    .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .kpi label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 4px; }
    .kpi-value { display: block; font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
    th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; }
    .num { font-variant-numeric: tabular-nums; text-align: right; }
    .arg { background: #f8fafc; border-left: 4px solid #0d9488; padding: 16px 20px; margin: 12px 0; font-size: 14px; color: #334155; white-space: pre-wrap; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #94a3b8; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Strate Studio · Clim École</div>
    <h1>Dossier de financement MGPE-PD</h1>
    <p class="meta">${esc(epci.displayName)} · ${esc(epci.communesLabel)} · ${date}</p>
  </div>

  <h2>Synthèse financière du pack</h2>
  <div class="kpis">
    <div class="kpi"><label>Budget travaux</label><span class="kpi-value">${formatEur(epci.packCapexTotal)}</span></div>
    <div class="kpi"><label>Aides publiques</label><span class="kpi-value">${formatEur(epci.subventionsTotal)}</span></div>
    <div class="kpi"><label>Reste à charge après subventions</label><span class="kpi-value">${formatEur(racAfterSubs)}</span></div>
    <div class="kpi"><label>Part Fonds Vert (pessimiste)</label><span class="kpi-value">${formatEur(epci.resteAChargeTotal)}</span></div>
    <div class="kpi"><label>Économie annuelle mairie</label><span class="kpi-value">${formatEur(epci.gainNetMairieTotal)}/an</span></div>
    ${mgpeKpis}
  </div>

  <h2>Patrimoine scolaire (${epci.batimentCount} bâtiment${epci.batimentCount > 1 ? 's' : ''})</h2>
  <table>
    <thead>
      <tr>
        <th>École</th><th>Commune</th><th>DPE</th><th>Surface</th><th>Budget</th><th>Gain net/an</th><th>Urgence</th>
      </tr>
    </thead>
    <tbody>${batRows}</tbody>
  </table>

  ${argLoi ? `<h2>Cadre réglementaire (Loi ELAN)</h2><div class="arg">${esc(argLoi)}</div>` : ''}
  ${argMgpe ? `<h2>Montage MGPE-PD</h2><div class="arg">${esc(argMgpe)}</div>` : ''}

  <div class="footer">
    Document généré par Clim École · Données locales output_prospection.csv · ${date}
  </div>
</body>
</html>`;
}
