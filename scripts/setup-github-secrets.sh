#!/usr/bin/env bash
# Configure les secrets GitHub Actions (nécessite: gh auth login)
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v gh >/dev/null 2>&1; then
  echo "Installe GitHub CLI: https://cli.github.com/"
  exit 1
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${SUPABASE_URL:?SUPABASE_URL manquant dans .env}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY manquant dans .env}"

gh secret set SUPABASE_URL --body "$SUPABASE_URL"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "$SUPABASE_SERVICE_ROLE_KEY"

echo "Secrets GitHub configurés pour $(gh repo view --json nameWithOwner -q .nameWithOwner)"
