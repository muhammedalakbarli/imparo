// AVTOMATİK YARADILIB — əl ilə redaktə etmə.
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
  tasks: number;
}

export const subjectMeta: SubjectMeta[] = [
  {
    "slug": "riyaziyyat-1",
    "name": "Riyaziyyat",
    "grade": 1,
    "units": 6,
    "lessons": 27,
    "tasks": 455
  },
  {
    "slug": "azerbaycan-dili-1",
    "name": "Azərbaycan dili",
    "grade": 1,
    "units": 5,
    "lessons": 23,
    "tasks": 366
  },
  {
    "slug": "ingilis-dili-1",
    "name": "İngilis dili",
    "grade": 1,
    "units": 6,
    "lessons": 24,
    "tasks": 390
  },
  {
    "slug": "riyaziyyat-2",
    "name": "Riyaziyyat",
    "grade": 2,
    "units": 6,
    "lessons": 25,
    "tasks": 398
  },
  {
    "slug": "azerbaycan-dili-2",
    "name": "Azərbaycan dili",
    "grade": 2,
    "units": 6,
    "lessons": 18,
    "tasks": 294
  },
  {
    "slug": "ingilis-dili-2",
    "name": "İngilis dili",
    "grade": 2,
    "units": 6,
    "lessons": 19,
    "tasks": 312
  },
  {
    "slug": "riyaziyyat-3",
    "name": "Riyaziyyat",
    "grade": 3,
    "units": 6,
    "lessons": 19,
    "tasks": 314
  },
  {
    "slug": "azerbaycan-dili-3",
    "name": "Azərbaycan dili",
    "grade": 3,
    "units": 6,
    "lessons": 18,
    "tasks": 294
  },
  {
    "slug": "ingilis-dili-3",
    "name": "İngilis dili",
    "grade": 3,
    "units": 6,
    "lessons": 19,
    "tasks": 312
  },
  {
    "slug": "riyaziyyat-4",
    "name": "Riyaziyyat",
    "grade": 4,
    "units": 6,
    "lessons": 19,
    "tasks": 314
  },
  {
    "slug": "azerbaycan-dili-4",
    "name": "Azərbaycan dili",
    "grade": 4,
    "units": 6,
    "lessons": 18,
    "tasks": 294
  },
  {
    "slug": "ingilis-dili-4",
    "name": "İngilis dili",
    "grade": 4,
    "units": 6,
    "lessons": 19,
    "tasks": 312
  },
  {
    "slug": "riyaziyyat",
    "name": "Riyaziyyat",
    "grade": 5,
    "units": 8,
    "lessons": 40,
    "tasks": 760
  },
  {
    "slug": "azerbaycan-dili",
    "name": "Azərbaycan dili",
    "grade": 5,
    "units": 4,
    "lessons": 19,
    "tasks": 365
  },
  {
    "slug": "ingilis-dili",
    "name": "İngilis dili",
    "grade": 5,
    "units": 10,
    "lessons": 121,
    "tasks": 1976
  },
  {
    "slug": "reqemsal-tehlukesizlik-5",
    "name": "Rəqəmsal Təhlükəsizlik",
    "grade": 5,
    "units": 3,
    "lessons": 6,
    "tasks": 88
  },
  {
    "slug": "maliyye-savadliligi-5",
    "name": "Maliyyə Savadlılığı",
    "grade": 5,
    "units": 3,
    "lessons": 9,
    "tasks": 147
  },
  {
    "slug": "suni-intellekt-5",
    "name": "Süni İntellekt",
    "grade": 5,
    "units": 3,
    "lessons": 12,
    "tasks": 171
  },
  {
    "slug": "kibertehlukesizlik-5",
    "name": "Kibertəhlükəsizlik",
    "grade": 5,
    "units": 3,
    "lessons": 12,
    "tasks": 171
  },
  {
    "slug": "riyaziyyat-6",
    "name": "Riyaziyyat",
    "grade": 6,
    "units": 8,
    "lessons": 32,
    "tasks": 640
  },
  {
    "slug": "azerbaycan-dili-6",
    "name": "Azərbaycan dili",
    "grade": 6,
    "units": 6,
    "lessons": 23,
    "tasks": 435
  },
  {
    "slug": "ingilis-dili-6",
    "name": "İngilis dili",
    "grade": 6,
    "units": 6,
    "lessons": 20,
    "tasks": 372
  },
  {
    "slug": "riyaziyyat-7",
    "name": "Riyaziyyat",
    "grade": 7,
    "units": 8,
    "lessons": 32,
    "tasks": 640
  },
  {
    "slug": "azerbaycan-dili-7",
    "name": "Azərbaycan dili",
    "grade": 7,
    "units": 6,
    "lessons": 24,
    "tasks": 450
  },
  {
    "slug": "ingilis-dili-7",
    "name": "İngilis dili",
    "grade": 7,
    "units": 6,
    "lessons": 18,
    "tasks": 338
  },
  {
    "slug": "riyaziyyat-8",
    "name": "Riyaziyyat",
    "grade": 8,
    "units": 8,
    "lessons": 32,
    "tasks": 640
  },
  {
    "slug": "azerbaycan-dili-8",
    "name": "Azərbaycan dili",
    "grade": 8,
    "units": 6,
    "lessons": 24,
    "tasks": 450
  },
  {
    "slug": "ingilis-dili-8",
    "name": "İngilis dili",
    "grade": 8,
    "units": 6,
    "lessons": 18,
    "tasks": 338
  }
];

export function getSubjectMeta(slug: string): SubjectMeta | undefined {
  return subjectMeta.find((s) => s.slug === slug);
}
