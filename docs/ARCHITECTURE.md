# Memarlıq icmalı

Imparo-nun yüksək səviyyəli quruluşu — yeni komanda üzvləri üçün.

## Ümumi baxış

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript. Səhifələr `app/` altında.
- **Backend:** Supabase — Postgres (verilənlər), Auth (qeydiyyat/giriş), Row-Level Security (RLS)
  və RPC funksiyaları (`supabase/migrations/`).
- **Deploy:** Cloudflare Workers (`@opennextjs/cloudflare` adapteri) — `npm run cf:deploy`.
  Canlı: `imparo.app`. Vercel ARTIQ İŞLƏDİLMİR (2026 Avq 14-də köçürüldü).
  Cloudflare Pages DA YOX — adapter Workers üçündür, bax `wrangler.jsonc`.

## Məzmun modeli

Məzmun ağacı: **Subject → Unit → Lesson → Task** (tiplər `lib/types.ts`).

- Mənbə həqiqəti: `lib/content/` altında sinif üzrə TypeScript faylları (məs. `math7.ts`).
- `supabase/seed.ts` bu ağacı DB cədvəllərinə (`subjects/units/lessons/tasks`) upsert edir.
- İş vaxtı məzmun `ContentProvider` (`components/ContentProvider.tsx`) vasitəsilə **DB-dən** yüklənir;
  DB boş/əlçatmaz olsa, TypeScript seed-i fallback kimi qalır (app dərhal işləyir).

## Sinif filtri

Hər sinif üçün ayrı `Subject` var (eyni adlı: "Riyaziyyat" və s.), `grade` sahəsi ilə fərqlənir.
Şagird-üzlü səhifələr fənləri **istifadəçinin sinfinə görə** süzməlidir:
`subjectsForGrade(subjects, user)` (`lib/grade.ts`). Bu, dashboard, praktika, profil və s.-də
istifadə olunur ki, fənlər təkrarlanmasın.

## Oyunlaşdırma və proqres

- `lib/progress.ts` — XP, streak, tamamlanmış dərslər. `lib/levels.ts` — səviyyələr.
- `lib/grading.ts` — cavab yoxlama (mərkəzi, saf funksiya; testlərlə əhatə olunub).
- `lib/quests.ts`, `lib/achievements.ts`, `lib/monthly.ts` — gündəlik tapşırıq, nişan, aylıq.

## Liqa sistemi

`lib/leaderboard.ts` + `supabase/migrations/` (league cədvəli və RPC-lər):
- Həftəlik kohort (eyni pillə, həftəlik XP üzrə); azlıq real istifadəçini deterministik **botlarla**
  (`lib/bots.ts`) 15-ə tamamlanır ki, rəqabət hissi olsun.
- Həftə açarı ISO həftə (Asia/Baku). Həftə sonu **rollover**: top 5 yüksəlir, kohort böyükdürsə alt 5
  düşür, XP sıfırlanır (`run_league_rollover`); `maybe_league_rollover` səhifə açılanda həftədə bir dəfə
  işə düşür.
- **Bot paritetı:** botlar UI-də real istifadəçidən ayırd edilməməlidir; bot-spesifik davranış yalnız
  data qatındadır (məs. bota izləmə `lib/botFollows.ts` — localStorage).

## Data qatı və təhlükəsizlik

- Supabase client: `lib/supabase/`. Yazılar RLS ilə qorunur (`is_admin()`, sahib yoxlaması).
- Admin: `app/admin/` (məzmun CRUD, analitika, rəylər) — yalnız `is_admin()`.
- İstifadəçi rəyləri: `task_feedback` cədvəli; admin panelində sual mətni ilə göstərilir.

## Çoxdillilik

`lib/i18n.ts` — AZ / EN / RU açar-dəyər tərcümələri; `useT()` hook-u ilə istifadə olunur.

## Bildirişlər

PWA manifesti (`app/manifest.ts`) + web push (`lib/push.ts`, VAPID) + cron
(`app/api/cron/`) re-engagement üçün. Cron-ları **GitHub Actions** çağırır
(`.github/workflows/cron-*.yml`) — Vercel Cron deyil. Çağırış `workers.dev`
hostuna gedir, çünki `imparo.app` zonasında Bot Fight Mode datamərkəz IP-lərini
bloklayır.
