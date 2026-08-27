// lib/subjectMeta.ts faylını lib/content-dən yenidən yaradır.
//
// Niyə lazımdır: `@/lib/content` bütün seed məzmunudur (~9000 tapşırıq, MB-larla).
// sitemap.ts və fənn səhifəsinin generateMetadata-sı ondan yalnız slug/ad/sinif
// və say lazım olduğu halda bütöv məzmunu Worker paketinə çəkirdi və deploy
// 3 MiB limitini keçirdi. Bu skript həmin dörd sahəni bir neçə KB-lıq ayrıca
// fayla çıxarır. Sinxron qalması tests/logic.test.ts ilə yoxlanılır.
//
// İşlətmək: npx tsx scripts/gen-subject-meta.ts
import { writeFileSync } from "node:fs";
import { subjects } from "../lib/content";

const rows = subjects.map((s) => ({
  slug: s.slug,
  name: s.name,
  grade: s.grade,
  units: s.units.length,
  // Sandıqlar SAYILMIR: onların tapşırığı yoxdur, ona görə "dərs" deyil.
  // Əvvəl sayılırdı və sayt 776 "dərs" göstərirdi, halbuki 110-u boş sandıqdır.
  lessons: s.units.reduce(
    (n, u) => n + u.lessons.filter((l) => l.tasks.length > 0).length,
    0,
  ),
}));

const out = `// AVTOMATİK YARADILIB — əl ilə redaktə etmə.
// Mənbə: lib/content · Yenilə: npx tsx scripts/gen-subject-meta.ts
//
// Fənlərin yalnız xülasəsi. Worker paketinə bütöv seed məzmununu çəkməmək
// üçün var (bax scripts/gen-subject-meta.ts başlığı).

export interface SubjectMeta {
  slug: string;
  name: string;
  grade: number;
  units: number;
  lessons: number;
}

export const subjectMeta: SubjectMeta[] = ${JSON.stringify(rows, null, 2)};

export function getSubjectMeta(slug: string): SubjectMeta | undefined {
  return subjectMeta.find((s) => s.slug === slug);
}
`;

writeFileSync(new URL("../lib/subjectMeta.ts", import.meta.url), out);
console.log(`lib/subjectMeta.ts yeniləndi — ${rows.length} fənn`);
