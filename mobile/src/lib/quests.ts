// Gündəlik questlər (mobil) — hər gün 3 kiçik hədəf, proqres Supabase user_metadata.questState-də
// (gündəlik sıfırlanır). Web lib/quests.ts ilə EYNİ POOL id/goal/rewardXp → questState paylaşılır,
// web+mobil sinxron. Yeganə fərq: labelKey (i18n) əvəzinə birbaşa AZ mətn (mobil AZ-dır).
import { supabase } from "./supabase";
import { addXp } from "./progress";
import { grantStreakFreeze } from "./streakFreeze";
import { addLeaderboardXp } from "./leaderboard";
import { addGems } from "./gems";
import { refillHearts } from "./hearts";

// Bugünkü gün açarı (yerli tarix) — web daily.todayKey ilə eyni.
function todayKey(): string {
  return new Date().toLocaleDateString("en-CA");
}

export type QuestKind = "xp" | "lessons" | "correct";

export interface Quest {
  id: string;
  kind: QuestKind;
  goal: number;
  rewardXp: number;
  label: string; // {n} → goal ilə əvəzlənir
}

export interface QuestState {
  date: string;
  xp: number;
  lessons: number;
  correct: number;
  claimed: string[];
  chestOpened: boolean;
}

export type ChestReward =
  | { kind: "gems"; amount: number }
  | { kind: "hearts" }
  | { kind: "freeze" };

const CHEST_LOOT: ChestReward[] = [
  { kind: "gems", amount: 20 },
  { kind: "gems", amount: 30 },
  { kind: "gems", amount: 50 },
  { kind: "hearts" },
  { kind: "freeze" },
];

// Quest hovuzu — id/goal/rewardXp web ilə EYNİ olmalıdır (paylaşılan questState).
const POOL: Quest[] = [
  { id: "xp20", kind: "xp", goal: 20, rewardXp: 5, label: "{n} XP qazan" },
  { id: "correct10", kind: "correct", goal: 10, rewardXp: 5, label: "{n} düzgün cavab" },
  { id: "lessons1", kind: "lessons", goal: 1, rewardXp: 5, label: "{n} dərs bitir" },
  { id: "xp40", kind: "xp", goal: 40, rewardXp: 6, label: "{n} XP qazan" },
  { id: "correct20", kind: "correct", goal: 20, rewardXp: 6, label: "{n} düzgün cavab" },
  { id: "lessons2", kind: "lessons", goal: 2, rewardXp: 8, label: "{n} dərs bitir" },
];

// Bugünkü 3 quest (tarixə görə deterministik) — web ilə eyni alqoritm.
export function todaysQuests(dateKey: string = todayKey()): Quest[] {
  const seed = dateKey.split("-").reduce((a, p) => a + parseInt(p, 10), 0);
  const off = seed % POOL.length;
  return [0, 1, 2].map((step) => POOL[(off + step) % POOL.length]);
}

const EMPTY = (date: string): QuestState => ({
  date,
  xp: 0,
  lessons: 0,
  correct: 0,
  claimed: [],
  chestOpened: false,
});

function normalize(raw: unknown): QuestState {
  const today = todayKey();
  const s = (raw ?? {}) as Partial<QuestState>;
  if (!s || s.date !== today) return EMPTY(today);
  return {
    date: today,
    xp: s.xp ?? 0,
    lessons: s.lessons ?? 0,
    correct: s.correct ?? 0,
    claimed: Array.isArray(s.claimed) ? s.claimed : [],
    chestOpened: !!s.chestOpened,
  };
}

export function questValue(state: QuestState, kind: QuestKind): number {
  return kind === "xp" ? state.xp : kind === "lessons" ? state.lessons : state.correct;
}

export function isQuestDone(state: QuestState, q: Quest): boolean {
  return questValue(state, q.kind) >= q.goal;
}

async function readState(): Promise<QuestState> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return normalize(user?.user_metadata?.questState);
  } catch {
    return EMPTY(todayKey());
  }
}

async function writeState(state: QuestState): Promise<void> {
  try {
    await supabase.auth.updateUser({ data: { questState: state } });
  } catch {
    // sükutla ötür
  }
}

// Yazıları seriallaşdır — eyni anda gələn bump-lar read-modify-write race yaratmasın.
let chain: Promise<void> = Promise.resolve();
function enqueue(fn: () => Promise<void>): Promise<void> {
  chain = chain.then(fn, fn);
  return chain;
}

export async function bumpQuest(kind: QuestKind, amount: number): Promise<void> {
  if (amount <= 0) return;
  return bumpQuests({ [kind]: amount });
}

export async function bumpQuests(deltas: Partial<Record<QuestKind, number>>): Promise<void> {
  return enqueue(async () => {
    const s = await readState();
    (Object.keys(deltas) as QuestKind[]).forEach((k) => {
      s[k] += deltas[k] ?? 0;
    });
    await writeState(s);
  });
}

// Tamamlanmış, hələ claim olunmamış questlərin XP mükafatını verir (dashboard yüklənəndə).
export async function syncQuestRewards(userId: string): Promise<QuestState> {
  let result: QuestState = EMPTY(todayKey());
  await enqueue(async () => {
    const s = await readState();
    const quests = todaysQuests(s.date);
    let changed = false;
    let reward = 0;
    for (const q of quests) {
      if (isQuestDone(s, q) && !s.claimed.includes(q.id)) {
        s.claimed.push(q.id);
        reward += q.rewardXp;
        changed = true;
      }
    }
    if (changed) {
      if (reward > 0) {
        await addXp(userId, reward).catch(() => {});
        await addLeaderboardXp(reward).catch(() => {});
      }
      await writeState(s);
    }
    result = s;
  });
  return result;
}

export async function loadQuestState(): Promise<QuestState> {
  return readState();
}

// Bütün gündəlik questlər claim olunub və sandıq açılmayıbsa — sandıq hazırdır.
export function chestAvailable(state: QuestState): boolean {
  if (state.chestOpened) return false;
  return todaysQuests(state.date).every((q) => state.claimed.includes(q.id));
}

// Sandığı aç: random mükafat (zümrüd / can / seriya qoruyucu), bir dəfə.
export async function openChest(): Promise<ChestReward> {
  let reward: ChestReward = { kind: "gems", amount: 20 };
  await enqueue(async () => {
    const s = await readState();
    if (!chestAvailable(s)) return;
    reward = CHEST_LOOT[Math.floor(Math.random() * CHEST_LOOT.length)];
    s.chestOpened = true;
    if (reward.kind === "gems") await addGems(reward.amount).catch(() => {});
    else if (reward.kind === "hearts") await refillHearts().catch(() => {});
    else await grantStreakFreeze().catch(() => {});
    await writeState(s);
  });
  return reward;
}
