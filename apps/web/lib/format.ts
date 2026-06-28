const eurCompact = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const intFmt = new Intl.NumberFormat('fr-FR');

export function formatEur(value: number, compact = false): string {
  const v = Number.isFinite(value) ? value : 0;
  if (compact && Math.abs(v) >= 1_000_000) {
    return `${(v / 1_000_000).toFixed(1).replace('.0', '')} M€`;
  }
  if (compact && Math.abs(v) >= 1_000) {
    return `${Math.round(v / 1_000)} k€`;
  }
  return eurCompact.format(v);
}

export function formatInt(value: number): string {
  return intFmt.format(Number.isFinite(value) ? value : 0);
}

export function formatPct(ratio: number, decimals = 0): string {
  const v = Number.isFinite(ratio) ? ratio * 100 : 0;
  return `${v.toFixed(decimals)} %`;
}

export function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function abbreviateEpciName(name: string): string {
  return String(name ?? '')
    .replace(/^Communauté de communes (du |de |de l'|des |d'|)/i, '')
    .replace(/^Communauté d'agglomération (du |de |de l'|des |d'|)/i, '')
    .replace(/^Métropole de /i, '')
    .trim();
}

export function isNomEpciPlaceholder(nom: string, code: string): boolean {
  const n = String(nom ?? '').trim();
  if (!n) return true;
  if (n === code) return true;
  return /^\d+$/.test(n);
}

export function formatEpciDisplayName(nom: string, code: string): string {
  if (!isNomEpciPlaceholder(nom, code)) {
    const abbr = abbreviateEpciName(nom);
    if (abbr) return abbr;
  }
  return code ? `EPCI ${code}` : 'EPCI inconnu';
}

export function formatCommunesLabel(communes: string[], max = 3): string {
  const unique = [...new Set(communes.filter(Boolean))];
  if (!unique.length) return '';
  const head = unique.slice(0, max).join(', ');
  const rest = unique.length - max;
  return rest > 0 ? `${head} +${rest}` : head;
}

const FINANCEMENT_LABELS: Record<string, string> = {
  ELIGIBLE_MGPE_PD: 'Éligible MGPE-PD',
  A_VERIFIER: 'À vérifier',
  NON_ELIGIBLE: 'Non éligible',
  EN_COURS: 'En cours d’étude',
};

export function formatFinancementStatut(statut: string): string {
  if (!statut) return '—';
  return FINANCEMENT_LABELS[statut] ?? statut.replace(/_/g, ' ').toLowerCase();
}
