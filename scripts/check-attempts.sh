#!/usr/bin/env bash
# Cəhd jurnalının (task_attempts, migration 0044) doldugunu yoxlayır.
# İstifadə:  bash scripts/check-attempts.sh
# Service role açarı işlədilir ki, RLS-i keçib BÜTÜN istifadəçilərin sayını görək.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env.local; set +a
U="$NEXT_PUBLIC_SUPABASE_URL"; K="$SUPABASE_SERVICE_ROLE_KEY"

q() { curl -s "$U/rest/v1/$1" -H "apikey: $K" -H "Authorization: Bearer $K" -H "${2:-Accept: application/json}"; }

echo "── Cəhd jurnalı vəziyyəti ────────────────────────────"
TOTAL=$(curl -s -I "$U/rest/v1/task_attempts?select=id" \
  -H "apikey: $K" -H "Authorization: Bearer $K" -H "Prefer: count=exact" \
  | grep -i "content-range" | sed 's#.*/##' | tr -d '\r')
echo "Ümumi cəhd sayı        : ${TOTAL:-0}"

if [ "${TOTAL:-0}" = "0" ]; then
  echo
  echo "Hələ heç nə yığılmayıb. Səbəb adətən bunlardan biridir:"
  echo "  1. Kod deploy olunmayıb (git commit + push edilməyib)"
  echo "  2. Deploy-dan sonra heç kim dərs bitirməyib"
  exit 0
fi

echo "Son cəhd               : $(q 'task_attempts?select=created_at&order=created_at.desc&limit=1' | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:]+' | head -1)"
echo "Fərqli şagird          : $(q 'task_attempts?select=user_id' | grep -oE '"user_id":"[^"]+"' | sort -u | wc -l)"
echo
echo "── Ən çətin 5 tapşırıq (accuracy) ───────────────────"
q 'task_difficulty?select=task_id,attempts,accuracy&attempts=gte.10&order=accuracy.asc&limit=5' \
  | python3 -c "import sys,json;[print(f\"  {r['task_id']:<28} cəhd={r['attempts']:<5} dəqiqlik={r['accuracy']}\") for r in json.load(sys.stdin)]" 2>/dev/null || echo "  (hələ 10+ cəhdli tapşırıq yoxdur)"
