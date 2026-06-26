export class BdnbQuotaExhaustedError extends Error {
  constructor(quota = {}) {
    const resetLabel = quota.resetAt
      ? quota.resetAt.toLocaleDateString('fr-FR', { dateStyle: 'long' })
      : 'prochain cycle mensuel';
    super(
      `Quota BDNB mensuel épuisé (${quota.monthlyLimit ?? 10_000} req/mois). `
      + `Réinitialisation estimée : ${resetLabel}. `
      + 'Configurez BDNB_API_TOKEN (Open Plus) ou BDNB_LOCAL_DIR (export départemental).',
    );
    this.name = 'BdnbQuotaExhaustedError';
    this.quota = quota;
  }
}
