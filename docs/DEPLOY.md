# Déploiement Clim École

## Architecture données

```
Pipeline (GitHub Actions / local)
  → data/departments/{code}.csv  (disque runner — hors Git)
  → Supabase (source de vérité)
  → Site Next.js (Vercel)
  → Git : rotation.json uniquement
```

### Pipeline optimisé

| Fonctionnalité | Détail |
|----------------|--------|
| **Batch temps-réel** | Traite autant de dept que le budget (165 min initial / 105 min refresh) |
| **2 crons initial** | 2h + 14h UTC → intervalle 12 h en phase découverte |
| **Priorité initiale** | Rhône, Nord, Paris… puis ordre catalogique |
| **Refresh delta** | `light` sync · `medium` recalc · `full` re-scrape · `skip_empty` 90 j |
| **Priorité refresh** | `pipeline_jobs.last_sync_at` ASC — les plus vieux d'abord |
| **Estimation adaptive** | Durée rolling / dept dans `deptDurations` |
| **Maintenance ∞** | Phase refresh ne s'arrête jamais (budget GHA skip désactivé) |

Rotation : [`data/departments/rotation.json`](../data/departments/rotation.json)

### Cycle de vie

```
initial (12h, batch temps)  →  96 dept  →  refresh (∞, delta, 24h)
```

## GitHub Actions

Workflow : [`.github/workflows/nightly-department.yml`](../.github/workflows/nightly-department.yml)

### Secrets

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Même que Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Même que Vercel |

### Crons

- **2h UTC** et **14h UTC** — en initial : skip si run < 12 h
- En refresh : skip si run < 24 h

### Refresh delta

| Mode | Condition | Action |
|------|-----------|--------|
| `skip_empty` | dept vide + sync < 90 j | skip |
| `light` | sync < 30 j | sync Supabase (~3 min) |
| `medium` | 30–60 j + checkpoint | reexportEconomics (~8 min) |
| `full` | > 60 j ou jamais sync | pipeline complet |

### Limitations GHA

| Limitation | Réaction |
|------------|----------|
| Timeout 180 min | Arrêt à 165 min (initial) ou 105 min (refresh) |
| Batch | Cap 8 ; ÷2 si partial/timeout |
| Minutes/mois | Skip > 800 min **initial only** |
| Disque < 2 Go | `skipped_disk` |
| Push git | 3× retry rebase |

### Lancement manuel

`force=true` · `batch_size=8` (cap)

## Commandes locales

```bash
npm run nightly:department -- --force
npm run sync:supabase:all
node src/scripts/runNightlyDepartment.js --force --batch 3
```

## Supabase

1. [`supabase/schema.sql`](../supabase/schema.sql)
2. `npm run sync:supabase:all` pour seed AURA

## Repo privé

Les CSV contiennent noms d'écoles et contacts — **hors Git**, stockés sur runner + Supabase.
