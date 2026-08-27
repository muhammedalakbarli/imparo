# Töhfə qaydaları

Imparo komandası üçün iş axını və standartlar.

## İş axını (branch → Pull Request)

Heç kim birbaşa `main`-ə push etmir. `main` həmişə işlək və deploy oluna bilən qalmalıdır.

1. `main`-i yenilə və yeni branch aç:
   ```bash
   git checkout main && git pull
   git checkout -b feature/qisa-ad
   ```
2. Kiçik, məntiqli commit-lər et (öz adınla).
3. Branch-ı göndər və **Pull Request** aç:
   ```bash
   git push -u origin feature/qisa-ad
   ```
4. Yoxlanışdan sonra `main`-ə merge olunur (squash). Kiçik və tez-tez PR-lar ver.

### Branch adlandırma

| Prefiks | İşlədilir |
|---------|-----------|
| `feature/` | yeni funksiya |
| `fix/` | səhv düzəlişi |
| `content/` | məzmun (dərs/tapşırıq) əlavəsi |
| `docs/` | sənədləşmə |

Nümunə: `feature/liqa-timer`, `fix/mobil-sidebar`, `content/riyaziyyat-7`.

## Kod standartları

Hər PR merge-dən əvvəl bu yoxlamalar **təmiz** olmalıdır:

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run test        # Vitest
npm run build       # Production build
```

- Kod və şərhlər mövcud üsluba uyğun olsun (adlandırma, şərh sıxlığı, idiomlar).
- Şagird-üzlü səhifələr fənləri sinfə görə süzməlidir (`subjectsForGrade`).

## Yeni məzmun əlavə etmək

Məzmun `lib/content/` altında sinif üzrə TypeScript fayllarındadır (məs. `math7.ts`):
`Subject → Unit → Lesson → Task`. Tapşırıq tipləri `lib/types.ts`-də (`multiple_choice`,
`fill_blank`, `numeric`, `word_order`, `listening`). Yeni fayl `lib/content/index.ts`-ə əlavə edilir.

Dəyişikliyi canlıya çıxarmaq üçün seed yenidən işə salınır:
```bash
npx tsx supabase/seed.ts
```

## Verilənlər bazası

Sxem dəyişiklikləri `supabase/migrations/` altında nömrələnmiş fayl kimi əlavə olunur (bax
[`supabase/README.md`](supabase/README.md)). Migrasiyalar Supabase SQL Editor-da sıra ilə işə salınır.
