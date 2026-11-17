import { describe, expect, it } from "vitest";
import { subjects } from "@/lib/content";
import { azToTrPhonetic, normalizeAzSpeech, splitSpeechChunks } from "@/lib/tts";
import { getAutoTaskVisual } from "@/lib/taskVisuals";
import LessonVisual, { resolveLessonVisual } from "@/components/LessonVisual";
import { isPrimaryTask, isYoungTask } from "@/lib/numberHints";

describe("ibtidai sinif səsli oxuma (normalizeAzSpeech & azToTrPhonetic)", () => {
  it("riyazi işarələri Azərbaycan dilində oxunuşa çevirir", () => {
    expect(normalizeAzSpeech("4 + 3 = ?")).toContain("4 üstəgəl 3 bərabərdir neçə?");
    expect(normalizeAzSpeech("9 − 4 = ?")).toContain("9 çıx 4 bərabərdir neçə?");
    expect(normalizeAzSpeech("3 × 5 = ?")).toContain("3 vur 5 bərabərdir neçə?");
    expect(normalizeAzSpeech("12 : 3 = ?")).toContain("12 böl 3 bərabərdir neçə?");
    expect(normalizeAzSpeech("3 + ? = 9")).toContain("3 üstəgəl boş xana bərabərdir 9");
  });

  it("şəkilçili ədədləri bütöv sözə çevirir və Google TTS üçün fonetik uyğunlaşdırır", () => {
    expect(normalizeAzSpeech("6-dan sonra hansı ədəd gəlir?")).toContain("altıdan sonra");
    expect(normalizeAzSpeech("1-ci və 4-cü")).toContain("birinci və dördüncü");
    const tr = azToTrPhonetic("9 − 4 = ?");
    expect(tr).toBe("dokkuz çıh dörd beraberdir neçe?");
    expect(tr).not.toMatch(/[əxqƏXQ]/);
  });

  it("müqayisə və boşluq işarələrini təbii oxuyur", () => {
    expect(normalizeAzSpeech("8 > 5")).toContain("8 böyükdür 5");
    expect(normalizeAzSpeech("3 < 7")).toContain("3 kiçikdir 7");
    expect(normalizeAzSpeech("Boşluğu doldur: 5, 6, __")).toContain("boş xana");
  });

  it("sayma suallarında emojilərin sayını demədən təmizləyir", () => {
    const spoken = normalizeAzSpeech("Neçə alma var? 🍎🍎🍎🍎");
    expect(spoken).toBe("Neçə alma var?");
    expect(spoken).not.toContain("4");
  });

  it("uzun izahları cümlə sərhədlərinə görə hissələrə bölür", () => {
    const long =
      "Toplama əməlində ədədləri birləşdiririk. Məsələn, 4 alma ilə 3 almanı bir yerə qoysaq cəmi 7 alma olar. Ona görə düzgün cavab 7-dir.";
    const chunks = splitSpeechChunks(long, 80);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(80);
    }
  });
});

describe("ibtidai sinif (1–4) dərslərinin və tapşırıqlarının vizual örtüyü", () => {
  const primarySubjects = subjects.filter((s) => s.grade <= 4);

  it("isPrimaryTask 1–4-cü sinfi, isYoungTask 1–2-ci sinfi tanıyır", () => {
    expect(isPrimaryTask("ry1-sayma-l1-t1")).toBe(true);
    expect(isPrimaryTask("ry3-vur-l1-t1")).toBe(true);
    expect(isPrimaryTask("az4-oxu-l1-t1")).toBe(true);
    expect(isPrimaryTask("ry5-kesr-l1-t1")).toBe(false);
    expect(isYoungTask("ry2-top-l1-t1")).toBe(true);
    expect(isYoungTask("ry3-vur-l1-t1")).toBe(false);
  });

  it("1–4-cü sinifdəki BÜTÜN dərslərin giriş ekranında vizual lövhə var", () => {
    let count = 0;
    for (const s of primarySubjects) {
      for (const u of s.units) {
        for (const l of u.lessons) {
          if (l.kind === "chest") continue;
          count++;
          const resolved = resolveLessonVisual(l.visual ?? l.id);
          const node = LessonVisual({ visual: resolved });
          expect(node, `${s.slug}/${l.id} (${resolved}) dərsinin vizualı yoxdur`).not.toBeNull();
        }
      }
    }
    expect(count).toBeGreaterThan(100);
  });

  it("konkret şəkil yoxdursa ümumi kart (📖, 🇬🇧, 🔢, 🧮, 🎧) göstərilmir", () => {
    // Köhnə ümumi kartların tam imzası (söz/əşya tapılmayanda qoyulan fallback-lar).
    const FALLBACK = new Set(["🇬🇧💬", "🧮✨", "🎧🔊", "🔢", "📖", "👏", "🅰️", "🔤", "✍️", "🙋📦🏃", "📝", "🎵📜", "🧩💡", "🧚📖"]);
    let taskCount = 0;
    let withVisual = 0;
    for (const s of primarySubjects) {
      for (const u of s.units) {
        for (const l of u.lessons) {
          for (const t of [...l.tasks, ...(l.bonusTasks ?? [])]) {
            taskCount++;
            const v = getAutoTaskVisual(t);
            if (!v) continue;
            withVisual++;
            if (v.kind !== "pictureCard") continue;
            const sig = v.emojis.join("");
            const text = `${t.prompt} ${"options" in t ? t.options.join(" ") : ""}`;
            const concrete =
              (v.badges?.some((x) => x.startsWith("[ ")) ?? false) || // heca blokları [ ki ] [ tab ]
              (sig === "📖" && /kitab|book|oxu|read/i.test(text)) || // "kitab" sözünün şəkli
              (sig === "✍️" && /yaz|writ/i.test(text));
            if (FALLBACK.has(sig) && !concrete) {
              throw new Error(`${s.slug}/${l.id}/${t.id}: ümumi kart ${sig} — "${t.prompt}"`);
            }
          }
        }
      }
    }
    expect(taskCount).toBeGreaterThan(2500);
    // Konkret vizualı olan tapşırıqlar hələ də çoxluq təşkil edir.
    expect(withVisual / taskCount).toBeGreaterThan(0.4);
  });
});

describe("avtomatik şəkil: Azərbaycan hərfləri və söz sərhədi", () => {
  const visualOf = (id: string, prompt: string, extra: Record<string, unknown> = {}) =>
    getAutoTaskVisual({ id, type: "fill_blank", prompt, answer: "x", ...extra } as never);
  const emojiOf = (id: string, prompt: string) => {
    const v = visualOf(id, prompt);
    return v && v.kind === "pictureCard" ? v.emojis[0] : null;
  };

  it("sözün ortasındakı hərf birləşməsinə görə şəkil seçmir (\\b ASCII tələsi)", () => {
    // "başlayır" ⊃ "ayı", "bunların" ⊃ "arı", "əmələ" ⊃ "əl", "çatışmır" ⊃ "at"
    expect(emojiOf("az1-x-q1", "Cümlə hansı hərflə başlayır?")).not.toBe("🐻");
    expect(emojiOf("az1-x-q2", "Hansı sözdə hecaların sayı ən çoxdur?")).not.toBe("🐝");
    expect(emojiOf("az1-x-q3", "Sait və samit birlikdə nəyi əmələ gətirir?")).not.toBe("✋");
    expect(emojiOf("az1-x-q4", "'Sən hara gedirsən' — nə çatışmır?")).not.toBe("🐴");
    expect(emojiOf("az2-x-q5", "'gözəl' sözünə mənaca yaxın hansıdır?")).not.toBe("👀");
  });

  it("əsl isim kökünü (şəkilçi ilə də) tanıyır", () => {
    expect(emojiOf("az1-x-q6", "'at' sözündəki sait qalındır, yoxsa incə?")).toBe("🐴");
    expect(emojiOf("az1-x-q7", "'alma' sözü hansı hərflə başlayır?")).toBe("🍎");
    expect(emojiOf("en1-x-q8", "'əl' İngiliscə necədir?")).toBe("✋");
  });

  it("İngilis cümləsindəki 'at' ön qoşması 🐴 vermir", () => {
    expect(emojiOf("en3-x-q9", "'I get up at 7.' nə deməkdir?")).not.toBe("🐴");
    expect(emojiOf("en3-x-q10", "'at night' nə deməkdir?")).not.toBe("🐴");
  });
});

describe("TTS server marşrutu client-only modul çəkmir", () => {
  it("app/api/tts React hook-suz lib/azSpeech-dən istifadə edir", async () => {
    const { readFileSync } = await import("node:fs");
    const route = readFileSync("app/api/tts/route.ts", "utf8");
    const speech = readFileSync("lib/azSpeech.ts", "utf8");
    // lib/tts.ts useSyncExternalStore import edir → server marşrutunda Next build-i qırılır.
    expect(route).not.toMatch(/from ["']@\/lib\/tts["']/);
    expect(speech).not.toMatch(/from ["']react["']/);
  });
});

describe("Azure Speech (az-AZ-BanuNeural) — açar varsa Azure, yoxdursa ehtiyat yol", () => {
  it("config yalnız açar + düzgün region olanda yaranır", async () => {
    const { parseAzureConfig } = await import("@/lib/azureSpeech");
    expect(parseAzureConfig("k", "westeurope")).toEqual({ key: "k", region: "westeurope" });
    expect(parseAzureConfig(" k ", " WestEurope ")).toEqual({ key: "k", region: "westeurope" });
    expect(parseAzureConfig(undefined, "westeurope")).toBeNull();
    expect(parseAzureConfig("k", "")).toBeNull();
    expect(parseAzureConfig("k", "evil.com/x")).toBeNull(); // URL-ə düşür
  });

  it("SSML Banu səsi ilə qurulur və mətn XML-escape olunur", async () => {
    const { azureSsml, azureTtsRequest } = await import("@/lib/azureSpeech");
    const ssml = azureSsml("3 < 5 & \"ok\"");
    expect(ssml).toContain('name="az-AZ-BanuNeural"');
    expect(ssml).toContain('xml:lang="az-AZ"');
    expect(ssml).toContain("3 &lt; 5 &amp; &quot;ok&quot;");
    const { url, init } = azureTtsRequest("salam", { key: "K", region: "westeurope" });
    expect(url).toBe("https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1");
    expect((init.headers as Record<string, string>)["Ocp-Apim-Subscription-Key"]).toBe("K");
  });
});
