// Liqa botlarına "izləmə" — botların DB sətri olmadığı üçün follow_user RPC işləmir.
// Bot profilinin real istifadəçidən fərqlənməməsi üçün izləmə vəziyyəti yalnız cihazda
// (localStorage) saxlanılır: optimistik UI + reload-dan sonra da qalır. Real istifadəçilər
// üçün toxunulmur — onlar follow_user RPC ilə DB-yə yazılır (lib/follows.ts).

const KEY = "biq_bot_follows";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // sükutla ötür — kritik deyil
  }
}

export function isBotFollowed(botId: string): boolean {
  return read().includes(botId);
}

// İzləmə vəziyyətini dəyiş; yeni vəziyyəti qaytar (true = izlənilir).
export function toggleBotFollow(botId: string): boolean {
  const cur = read();
  if (cur.includes(botId)) {
    write(cur.filter((id) => id !== botId));
    return false;
  }
  write([...cur, botId]);
  return true;
}
