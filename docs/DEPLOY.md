# Déploiement Clim École

## Architecture données

```
Pipeline (GitHub Actions / local)
  → data/departments/{code}.csv  (Git)
  → Supabase (upsert)
  → Site Next.js (Vercel)
```

- **1 département toutes les 48 h** (`intervalHours: 36`)
- **96 départements** métropole + Corse
- Rotation : [`data/departments/rotation.json`](../data/departments/rotation.json)

## Vercel (site)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | URL projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (serveur uniquement) |
| `AUTH_SECRET` | Sessions |
| `ADMIN_PASSWORD` | Cockpit admin |
| Stripe vars | Paiements |

**Root Directory** : `apps/web`

## GitHub Actions (pipeline nightly)

Workflow : [`.github/workflows/nightly-department.yml`](../.github/workflows/nightly-department.yml)

### Secrets à configurer

Repository → Settings → Secrets → Actions :

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Même que Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Même que Vercel |

Optionnel : reprendre les variables API du [`.env.example`](../.env.example) si le pipeline en a besoin (SIRENE, etc.).

### Lancement manuel

Actions → **Nightly department pipeline** → **Run workflow** → cocher `force` pour ignorer l'intervalle 36 h.

### Budget minutes

- Cron : tous les jours à 2h UTC, **skip** si dernière run < 36 h
- Timeout job : **120 min**
- Estimation : ~350–450 min/mois (avec strate-radar-lab ~850 min total → OK Free)

## Supabase

1. Exécuter [`supabase/schema.sql`](../supabase/schema.sql) (inclut `pipeline_jobs`)
2. Seed AURA déjà exporté :

```bash
npm run sync:supabase:all
```

## Commandes locales

```bash
# Catalog départements
npm run dept:catalog

# Split CSV AURA existant
npm run dept:split

# Sync tous les CSV dept → Supabase
npm run sync:supabase:all

# Simuler une nuit (force)
npm run nightly:department -- --force

# Sync un dept
node src/scripts/syncToSupabase.js --file data/departments/074.csv --region-label "Auvergne-Rhône-Alpes" --department 074
```

## Repo privé recommandé

Les CSV contiennent noms d'écoles et contacts mairies.
