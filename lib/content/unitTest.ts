// Bölmə sonu testi (kind: "test") — tapşırıqlar əl ilə yazılmır, həmin bölmənin adi
// dərslərindən DETERMİNİSTİK seçilir. Beləliklə test həmişə bölmənin real məzmununu
// yoxlayır və məzmun dəyişəndə avtomatik yenilənir.
//
// Deterministik = hər açılışda eyni suallar (təsadüfi deyil) — beləcə şagird testi
// təkrar açanda sual dəsti dəyişmir, irəliləyiş və SRS mənalı qalır.

import type { Subject, Task, Lesson } from "../types";

// FNV-1a → mulberry32 (balance.ts ilə eyni yanaşma).
function seedOf(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Testdə neçə sual olsun (bölmə uzunluğundan asılı olmayaraq sabit hiss).
const TEST_SIZE = 15;

// Bir bölmənin adi dərslərindən test tapşırıqlarını yığ.
function buildTestTasks(lessons: Lesson[], testId: string): Task[] {
  // Yalnız adi dərslər (sandıq/test özləri daxil deyil) və yalnız əsas tapşırıqlar —
  // bonuslar çətindir, bölmə sonu testi əsas materialı yoxlamalıdır.
  const pool: Task[] = lessons
    .filter((l) => (l.kind ?? "lesson") === "lesson")
    .flatMap((l) => l.tasks);

  if (pool.length === 0) return [];

  // Hər dərsdən bərabər pay götürmək üçün əvvəlcə dərs-dərs qruplaşdır, sonra
  // növbə ilə (round-robin) seç — beləcə test bir dərsə yığılmır.
  const byLesson = lessons
    .filter((l) => (l.kind ?? "lesson") === "lesson")
    .map((l) => l.tasks.slice());

  const rnd = mulberry32(seedOf(testId));
  // Hər dərsin daxilində deterministik qarışdır.
  for (const arr of byLesson) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  const picked: Task[] = [];
  let round = 0;
  while (picked.length < TEST_SIZE && round < 50) {
    let addedThisRound = false;
    for (const arr of byLesson) {
      if (picked.length >= TEST_SIZE) break;
      const t = arr[round];
      if (t) {
        picked.push(t);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break;
    round++;
  }

  // Test daxilində sualların sırasını da deterministik qarışdır (dərs sırası bilinməsin).
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  // Test tapşırıqlarına ayrıca id ver — SRS/praktika onları dərs tapşırığı ilə
  // qarışdırmasın (eyni sual iki dəfə «səhvlərim» siyahısına düşməsin).
  return picked.map((t, i) => ({ ...t, id: `${testId}-q${i + 1}` }) as Task);
}

// Bütün fənlərdə kind:"test" olan dərslərin tasks-ını doldur (məzmun tərəfində boş yazılır).
export function fillUnitTests(subjects: Subject[]): Subject[] {
  return subjects.map((s) => ({
    ...s,
    units: s.units.map((u) => ({
      ...u,
      lessons: u.lessons.map((l) =>
        l.kind === "test" && l.tasks.length === 0
          ? { ...l, tasks: buildTestTasks(u.lessons, l.id) }
          : l,
      ),
    })),
  }));
}
