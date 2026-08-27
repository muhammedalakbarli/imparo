# Supabase

Imparo-nun verilənlər bazası (Postgres) və məzmun seed-i.

## Struktur

| Qovluq / fayl | Təyinat |
|---------------|---------|
| `migrations/` | DB sxeması və funksiyaları. **Sıra ilə** (0001 → …) işə salınır. |
| `seed.ts` | Məzmunu (`lib/content`) DB-yə yükləyən skript (upsert, idempotent). |
| `archive/` | Tarixi birdəfəlik patch/seed skriptləri — artıq tətbiq olunub, istinad edilmir. |

## Quraşdırma

1. **Migrasiyalar** — Supabase **SQL Editor**-da `migrations/` fayllarını nömrə sırası ilə işə sal
   (0001_init → 0002 → … → sonuncu). Hər fayl idempotentdir (`create ... if not exists` /
   `create or replace`), təkrar işlətmək təhlükəsizdir.

2. **Məzmun seed-i** — layihə kökündən:
   ```bash
   npx tsx supabase/seed.ts
   ```
   `.env.local`-da `NEXT_PUBLIC_SUPABASE_URL` və `SUPABASE_SERVICE_ROLE_KEY` tələb olunur.
   Seed `subjects`, `units`, `lessons`, `tasks` cədvəllərini upsert edir — istifadəçi progresinə
   toxunmur.

## Qeydlər

- `archive/` qovluğundakı `apply_*.sql` fayllar keçmişdə birdəfəlik məzmun köçürmələri üçün
  işlədilib. İndiki məzmun `lib/content/` (TypeScript) mənbəyindən `seed.ts` ilə seed olunur —
  bu fayllara ehtiyac yoxdur, yalnız tarixçə üçün saxlanılır.
