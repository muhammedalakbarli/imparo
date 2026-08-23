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
}

export const subjectMeta: SubjectMeta[] = [
  {
    "slug": "riyaziyyat-1",
    "name": "Riyaziyyat",
    "grade": 1,
    "units": 6,
    "lessons": 33
  },
  {
    "slug": "azerbaycan-dili-1",
    "name": "Azərbaycan dili",
    "grade": 1,
    "units": 5,
    "lessons": 28
  },
  {
    "slug": "ingilis-dili-1",
    "name": "İngilis dili",
    "grade": 1,
    "units": 6,
    "lessons": 30
  },
  {
    "slug": "riyaziyyat-2",
    "name": "Riyaziyyat",
    "grade": 2,
    "units": 6,
    "lessons": 31
  },
  {
    "slug": "azerbaycan-dili-2",
    "name": "Azərbaycan dili",
    "grade": 2,
    "units": 6,
    "lessons": 24
  },
  {
    "slug": "ingilis-dili-2",
    "name": "İngilis dili",
    "grade": 2,
    "units": 6,
    "lessons": 25
  },
  {
    "slug": "riyaziyyat-3",
    "name": "Riyaziyyat",
    "grade": 3,
    "units": 6,
    "lessons": 25
  },
  {
    "slug": "azerbaycan-dili-3",
    "name": "Azərbaycan dili",
    "grade": 3,
    "units": 6,
    "lessons": 24
  },
  {
    "slug": "ingilis-dili-3",
    "name": "İngilis dili",
    "grade": 3,
    "units": 6,
    "lessons": 25
  },
  {
    "slug": "riyaziyyat-4",
    "name": "Riyaziyyat",
    "grade": 4,
    "units": 6,
    "lessons": 25
  },
  {
    "slug": "azerbaycan-dili-4",
    "name": "Azərbaycan dili",
    "grade": 4,
    "units": 6,
    "lessons": 24
  },
  {
    "slug": "ingilis-dili-4",
    "name": "İngilis dili",
    "grade": 4,
    "units": 6,
    "lessons": 25
  },
  {
    "slug": "riyaziyyat",
    "name": "Riyaziyyat",
    "grade": 5,
    "units": 8,
    "lessons": 48
  },
  {
    "slug": "azerbaycan-dili",
    "name": "Azərbaycan dili",
    "grade": 5,
    "units": 4,
    "lessons": 22
  },
  {
    "slug": "ingilis-dili",
    "name": "İngilis dili",
    "grade": 5,
    "units": 10,
    "lessons": 129
  },
  {
    "slug": "reqemsal-tehlukesizlik-5",
    "name": "Rəqəmsal Təhlükəsizlik",
    "grade": 5,
    "units": 3,
    "lessons": 6
  },
  {
    "slug": "maliyye-savadliligi-5",
    "name": "Maliyyə Savadlılığı",
    "grade": 5,
    "units": 3,
    "lessons": 12
  },
  {
    "slug": "riyaziyyat-6",
    "name": "Riyaziyyat",
    "grade": 6,
    "units": 8,
    "lessons": 32
  },
  {
    "slug": "azerbaycan-dili-6",
    "name": "Azərbaycan dili",
    "grade": 6,
    "units": 6,
    "lessons": 28
  },
  {
    "slug": "ingilis-dili-6",
    "name": "İngilis dili",
    "grade": 6,
    "units": 6,
    "lessons": 20
  },
  {
    "slug": "riyaziyyat-7",
    "name": "Riyaziyyat",
    "grade": 7,
    "units": 8,
    "lessons": 32
  },
  {
    "slug": "azerbaycan-dili-7",
    "name": "Azərbaycan dili",
    "grade": 7,
    "units": 6,
    "lessons": 30
  },
  {
    "slug": "ingilis-dili-7",
    "name": "İngilis dili",
    "grade": 7,
    "units": 6,
    "lessons": 18
  },
  {
    "slug": "riyaziyyat-8",
    "name": "Riyaziyyat",
    "grade": 8,
    "units": 8,
    "lessons": 32
  },
  {
    "slug": "azerbaycan-dili-8",
    "name": "Azərbaycan dili",
    "grade": 8,
    "units": 6,
    "lessons": 30
  },
  {
    "slug": "ingilis-dili-8",
    "name": "İngilis dili",
    "grade": 8,
    "units": 6,
    "lessons": 18
  }
];

export function getSubjectMeta(slug: string): SubjectMeta | undefined {
  return subjectMeta.find((s) => s.slug === slug);
}
