# Clim École

Plateforme **Radar de prospection** pour la rénovation thermique des écoles publiques (AURA).

## Stack

- **Pipeline** (`/src`) — Node.js, BDNB, CSV `output_prospection.csv`
- **Web** (`/apps/web`) — Next.js 15, App Router, Tailwind

## Démarrage

```bash
# Pipeline (génère le CSV)
npm run prospect

# Next.js (port 3001)
npm run web:dev
```

## Routes

| Zone | URL | Accès |
|------|-----|-------|
| SaaS public | `/`, `/explorer`, `/tarifs` | Public |
| Deal room | `/explorer/[id]` | Teaser / débloqué si achat |
| Compte | `/compte` | Client Stripe |
| Admin cockpit | `/admin/*` | Mot de passe (`ADMIN_PASSWORD`) |
| Login admin | `/admin/login` | — |

## Configuration

Copier `apps/web/.env.example` → `apps/web/.env.local`

## Monétisation (Stripe)

1. Créer produits/prix Stripe (290 € dossier, 990 €/mois abo)
2. Renseigner `STRIPE_*` dans `.env.local`
3. Webhook : `POST /api/stripe/webhook`

## Déblocage dev (sans Stripe)

```bash
curl -X POST http://localhost:3001/api/dev/unlock \
  -H 'Content-Type: application/json' \
  -H 'x-dev-key: dev-unlock' \
  -d '{"packId":"YOUR_PACK_ID","pro":false}'
```

## Fonctionnalités Radar

- Score Radar 0–100 + grade A–D
- **Deals qualifiés** — filtre par défaut (score B+, CAPEX > 400 k€)
- Personas multi-tags (BTP / BE / AMO) + explainability
- Simulateur RAC interactif
- Watchlist, comparateur, **alertes email serveur**
- **Exclusivité** — max 3 achats unitaires par territoire (`PACK_MAX_UNLOCKS`)
- **Exports client** — CSV + dossier MGPE-PD post-déblocage
- Emails post-achat (Resend)
- Paywall serveur — identités débloquées via entitlements
- Renouvellement abo Stripe (`invoice.paid` / `subscription.deleted`)

## Légal

- `/legal/cgu`, `/legal/confidentialite`, `/legal/methodologie`
