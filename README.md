<div align="center">

# Imparo

**Azərbaycan məktəbliləri üçün adaptiv öyrənmə platforması**

1–8-ci siniflər. Öyrənməni **bacarıq səviyyəsində** modelləşdirir və məşqi şagirdin
göstəricilərinə görə fərdiləşdirir.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-087EA4?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)
![Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare_Workers-F38020?logo=cloudflareworkers)

</div>

---

## Xülasə

Imparo — Azərbaycan orta məktəb şagirdləri üçün öyrənmə platformasıdır: şagird özü qeydiyyatdan
keçir, sinfini seçir və öz sürəti ilə öyrənir. Məzmun rəsmi kurikuluma uyğun qurulub.

Platformanın fərqi oyunlaşdırmada deyil — onu başqası da yaza bilər. Fərq budur ki, sistem
**hansı sualı niyə məhz həmin şagirdə verdiyini izah edə bilir**: hər tapşırıq konkret
bacarıqlara bağlıdır, hər cavab həmin bacarıqların mənimsəmə səviyyəsini yeniləyir, növbəti
məşq isə ən zəif bacarığın **kökündən** seçilir.

| | |
|---|---|
| Siniflər | 1–8 |
| Fənlər | Riyaziyyat · Azərbaycan dili · İngilis dili (+ 5-ci sinifdə Rəqəmsal Təhlükəsizlik və Maliyyə Savadlılığı) |
| Dərs · tapşırıq | 666 dərs · 10 043 tapşırıq |
| Bacarıq qrafı | 154 bacarıq · 9 853 tapşırıq etiketli |
| Cavab izahı | 1–4-cü siniflər üzrə 2 989 tapşırıqda |

## Öyrənmə mühərriki

```
məzmun → bacarıq qrafı → mənimsəmə (mastery) → adaptiv seçim → SRS → analitika → ölçmə
```

- **Bacarıq qrafı** (`lib/skills.ts`) — 154 bacarıq, hər birinin prerequisite-ləri ilə. Bacarıq
  sinifdən asılı deyil: «kəsrlərin toplanması» həm 3-cü, həm 4-cü sinifdədir və eyni düyündür —
  məhz buna görə şagird 4-cü sinifdə ilişəndə kökünə qayıtmaq mümkündür.
- **Mənimsəmə modeli** (`lib/mastery.ts`, migration 0047) — hər cəhd bacarığa proyeksiya olunur.
  Təzəlik çəkisi (14 gün yarımparçalanma) + Bayes daralması: 3 cəhdə əsasən qəti hökm verilmir.
- **Adaptiv məşq** — zəif bacarığın prereq-i də zəifdirsə, məşq **kökdən** başlayır; tapşırıq
  həmin bacarığı keçən ən aşağı sinifdən götürülür.
- **Diaqnostika** — bacarıqları əhatə edən ölçmə. Cavabdan sonra nə düzgün cavab, nə izah
  göstərilir: diaqnostikanın işi ölçməkdir, öyrətmək yox.
- **Bacarığa həssas SRS** — unutma əyrisi tapşırığın yox, bacarığın xassəsidir. Zəif bacarıqda
  təkrar tez qayıdır, güclüdə gecikir.
- **Bilik Xəritəsi** — şagird hansı bacarığı nə qədər mənimsədiyini görür. Sınanmamış bacarıq
  göstərilmir: «0%» bilmədiyi kimi görünərdi.
- **Müəllim və valideyn** — sinif səhifəsində «neçə şagird bu bacarıqda ilişib» (ortalama yox,
  çünki ortalama yarısının ilişdiyini gizlədir); valideyn hesabatı isə bölmə deyil, bacarıq adı
  verir: «Kəsrlər 67%» yox, «fərqli məxrəcli kəsrləri toplamaq 41%».

Ölçmə infrastrukturu hazırdır (baseline/final, ayrılmış element hovuzları, deterministik hədəf
seçimi, hesabat generatoru) — **pilot hələ başlamayıb**, ona görə real öyrənmə nəticəsi iddia
edilmir. Metodologiya: [`docs/pilot/`](docs/pilot/).

## Əsas imkanlar

- **Dərs axını və skill tree** — bölmə → dərs → tapşırıq; dərs bitəndə növbəti açılır (unlock).
- **5 tapşırıq tipi** — çoxseçimli, boşluq doldur, rəqəm, söz sırası, dinləmə.
- **Oyunlaşdırma** — XP, səviyyələr, gündəlik seriya (streak), nişanlar (achievements).
- **Həftəlik liqalar** — Bürüncdən Almaza qədər 5 pillə; həftəlik kohort yarışı, avtomatik yüksəliş/enmə.
- **Praktika mərkəzi** — zəif bacarıqlar (adaptiv), diaqnostika, təkrar (SRS), qarışıq praktika, sürət raundu, bölmə üzrə, gündəlik çağırış.
- **Sosial** — dost dəvəti, izləmə, ictimai profil, ümumi reytinq.
- **Məktəb (B2B)** — müəllim, sinif, şagird reyestri, tapşırıq təyini və sinfin zəif bacarıqları.
- **Valideyn hesabatı** — həftəlik e-poçt + tokenli səhifə; valideyn hesabı tələb olunmur.
- **Admin panel** — məzmun idarəetməsi (CRUD), analitika paneli, istifadəçi rəyləri, moderasiya.
- **PWA + web push** — quraşdırıla bilən tətbiq və re-engagement bildirişləri.
- **Çoxdillilik** — interfeys AZ / EN / RU.

## Texnologiya

| Sahə | Texnologiya |
|------|-------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Üslub | Tailwind CSS v4, Framer Motion |
| Backend | Supabase (Postgres, Auth, Row-Level Security) |
| Analitika | PostHog |
| Deploy | Cloudflare Workers (OpenNext) |

## Sürətli başlanğıc

```bash
git clone https://github.com/muhammedalakbarli/imparo.git
cd imparo
npm install
cp .env.example .env.local   # dəyərləri doldur (aşağıya bax)
npm run dev
```

Brauzerdə [http://localhost:3000](http://localhost:3000) aç.

## Mühit dəyişənləri

Bütün dəyişənlər və izahları [`.env.example`](.env.example) faylındadır: Supabase, PostHog (istəyə
bağlı), web push (VAPID) və re-engagement kronu. `.env.local` git-ə əlavə olunmur (gizli qalır).

## Verilənlər bazası (Supabase)

1. [supabase.com](https://supabase.com)-da layihə yarat; **Settings → API**-dən URL və `anon` açarı
   `.env.local`-a yaz.
2. **SQL Editor**-da `supabase/migrations/` fayllarını **sıra ilə** (0001 → …) işə sal.
3. Məzmunu seed et:
   ```bash
   npx tsx supabase/seed.ts
   ```
   Seed idempotentdir (upsert) — təkrar işlətmək təhlükəsizdir, mövcud progresə toxunmur.

Ətraflı: [`supabase/README.md`](supabase/README.md).

## Layihə strukturu

```
app/                 # Next.js App Router marşrutları
  dashboard/         #   Ana səhifə: XP, streak, fənn kartları
  subjects/[slug]/   #   Fənn → bölmələr və dərslər (skill tree)
  lessons/[id]/      #   Dərs: izah + tapşırıq axını
  praktika/          #   Praktika mərkəzi (adaptiv, diaqnostika, SRS)
  bilik-xeritesi/    #   Bilik Xəritəsi: bacarıq üzrə mənimsəmə
  mekteb/            #   Məktəb: müəllim, sinif, tapşırıq təyini
  hesabat/[token]/   #   Valideyn hesabatı (tokenli link)
  liqa/              #   Həftəlik liqa
  profil/  u/  dost/ #   Profil, ictimai profil, dost dəvəti
  admin/             #   Admin: məzmun, analitika, rəylər
  api/               #   Server marşrutları (cron və s.)
components/          # UI komponentləri (lesson/, tasks/, ...)
lib/
  content/           #   Sinif üzrə məzmun (subjects → units → lessons → tasks)
  skills.ts          #   Bacarıq qrafı (154 bacarıq + prerequisite-lər)
  mastery.ts         #   Mənimsəmə hesabı, adaptiv seçim, bilik xəritəsi
  pilot.ts           #   Pilot: element hovuzları, deterministik hədəf seçimi
  attempts.ts        #   Cəhd jurnalı (buferli, mənbə ilə)
  srs.ts             #   Aralıqlı təkrar (bacarığa həssas)
  grading.ts         #   Cavab yoxlama (mərkəzi məntiq)
  grade.ts           #   Sinif filtri (subjectsForGrade)
  leaderboard.ts     #   Liqa (kohort, rollover, həftə açarı)
  progress.ts        #   XP, streak, tamamlanmış dərslər
  i18n.ts            #   AZ / EN / RU tərcümələr
  supabase/          #   Supabase client
  types.ts           #   Məlumat tipləri
supabase/
  migrations/        #   DB sxeması (sıra ilə işə sal)
  seed.ts            #   Məzmun seed skripti
docs/
  pilot/             #   Ölçmə dizaynı, analiz planı, hesabat şablonu
scripts/             # Məzmun və analiz alətləri (etiketləmə, izah, pilot hesabatı)
tests/               # Vitest testləri (96)
```

## Skriptlər

| Əmr | İş |
|-----|-----|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest testləri |
| `npm run typecheck` | TypeScript tip yoxlaması |

## Deploy

Cloudflare Workers-ə deploy olunur (OpenNext adapteri): `npm run cf:deploy`. Mühit dəyişənləri
`wrangler secret put <AD>` ilə Worker secret kimi qoyulur (Cloudflare dashboard-da da görünür).
Custom domain: `imparo.app` (+ `www.imparo.app` → 301 redirect, bax `middleware.ts`).

Gündəlik re-engagement bildirişi (`/api/cron/reminders`) GitHub Actions ilə işə salınır —
bax [`.github/workflows/cron-reminders.yml`](.github/workflows/cron-reminders.yml)
(hər gün saat 19:00 Bakı vaxtı, `CRON_SECRET` repo secret-indən oxunur).

## İş axını və töhfə

Branch → Pull Request axını üçün [`CONTRIBUTING.md`](CONTRIBUTING.md)-a bax. Memarlıq icmalı:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Lisenziya

Bu proqram təminatı proprietardır. Bütün hüquqlar qorunur — bax [`LICENSE`](LICENSE).
