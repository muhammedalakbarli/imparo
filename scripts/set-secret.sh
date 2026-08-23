#!/usr/bin/env bash
# Worker secret-ini TƏHLÜKƏSİZ qoyur.
#
# Niyə ayrıca skript: `wrangler secret put <AD>` əmrində açarı səhvən AD-ın yerinə
# yapışdırmaq çox asandır. O halda açar secret-in ADI olur — adlar isə GİZLİ DEYİL,
# `wrangler secret list` onları açıq göstərir, yəni açar sızır.
# Burada ad sabitdir, dəyər isə gizli (ekranda görünmür) oxunur.
#
# İşlətmək:  bash scripts/set-secret.sh RESEND_API_KEY
set -euo pipefail

NAME="${1:-}"
if [[ -z "$NAME" ]]; then
  echo "İstifadə: bash scripts/set-secret.sh <SECRET_ADI>" >&2
  echo "Məsələn : bash scripts/set-secret.sh RESEND_API_KEY" >&2
  exit 1
fi

# Ad yalnız BÖYÜK_HƏRF_VƏ_ALT_XƏTT ola bilər — açarı ad kimi yapışdırmağın qarşısını alır.
if [[ ! "$NAME" =~ ^[A-Z][A-Z0-9_]*$ ]]; then
  echo "XƏTA: \"$NAME\" secret adına oxşamır." >&2
  echo "Deyəsən açarın DƏYƏRİNİ ad kimi yazmısan. Ad belə olmalıdır: RESEND_API_KEY" >&2
  exit 1
fi

printf 'Dəyəri yapışdır və Enter bas (ekranda görünməyəcək): '
IFS= read -rs VALUE
printf '\n'

if [[ -z "$VALUE" ]]; then
  echo "XƏTA: boş dəyər — heç nə edilmədi." >&2
  exit 1
fi

printf '%s' "$VALUE" | npx wrangler secret put "$NAME"
unset VALUE
echo "✓ $NAME qoyuldu."
