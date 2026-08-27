// Səs effektləri — WebAudio ilə fayl-siz qısa tonlar. `prefs.sound` söndürülübsə susur.
// İstifadə: playCorrect() / playWrong() / playComplete() / playLevelUp().

import { loadPrefs } from "./prefs";

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

// Tək not: tezlik, başlanğıc (san), müddət (san), forma, səs həcmi.
function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.14,
) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function enabled(): boolean {
  try {
    return loadPrefs().sound;
  } catch {
    return false;
  }
}

function play(notes: () => void) {
  if (!enabled()) return;
  const ac = audioCtx();
  if (ac) notes();
}

export function playCorrect() {
  const ac = audioCtx();
  play(() => {
    if (!ac) return;
    tone(ac, 660, 0, 0.12, "sine"); // E5
    tone(ac, 990, 0.09, 0.16, "sine"); // B5 — yüksələn "ding"
  });
}

export function playWrong() {
  const ac = audioCtx();
  play(() => {
    if (!ac) return;
    tone(ac, 200, 0, 0.18, "sawtooth", 0.1); // alçaq "buzz"
    tone(ac, 150, 0.1, 0.2, "sawtooth", 0.1);
  });
}

export function playComplete() {
  const ac = audioCtx();
  play(() => {
    if (!ac) return;
    // qısa fanfar (C-E-G-C)
    [523, 659, 784, 1047].forEach((f, i) => tone(ac, f, i * 0.12, 0.18, "triangle"));
  });
}

export function playLevelUp() {
  const ac = audioCtx();
  play(() => {
    if (!ac) return;
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone(ac, f, i * 0.1, 0.22, "square", 0.1),
    );
    tone(ac, 1568, 0.5, 0.4, "triangle", 0.12); // final parıltı
  });
}

// Variant seçiləndə yumşaq "tık".
export function playSelect() {
  const ac = audioCtx();
  play(() => {
    if (!ac) return;
    tone(ac, 520, 0, 0.05, "sine", 0.06);
  });
}

// Öyrənmə yolunda dərsə keçəndə xoş "addım/pop" (iki qalxan not).
export function playStep() {
  const ac = audioCtx();
  play(() => {
    if (!ac) return;
    tone(ac, 587, 0, 0.08, "triangle", 0.09); // D5
    tone(ac, 880, 0.06, 0.12, "sine", 0.08); // A5
  });
}

// Yeni bölmə açılanda/başında qısa bayram akkordu (milestone).
export function playMilestone() {
  const ac = audioCtx();
  play(() => {
    if (!ac) return;
    [523, 784, 1047].forEach((f, i) => tone(ac, f, i * 0.08, 0.2, "triangle", 0.1));
  });
}

// Combo artdıqca yüksələn "blip" (səviyyəyə görə tezlik).
export function playCombo(level = 1) {
  const ac = audioCtx();
  play(() => {
    if (!ac) return;
    const base = 660 + Math.min(level, 8) * 60;
    tone(ac, base, 0, 0.1, "triangle", 0.1);
    tone(ac, base * 1.5, 0.06, 0.12, "sine", 0.08);
  });
}

// Streak/quest mükafatı — qısa "coin/sparkle".
export function playStreak() {
  const ac = audioCtx();
  play(() => {
    if (!ac) return;
    [784, 1047, 1319].forEach((f, i) => tone(ac, f, i * 0.07, 0.14, "triangle", 0.1));
  });
}

export function playQuest() {
  const ac = audioCtx();
  play(() => {
    if (!ac) return;
    tone(ac, 880, 0, 0.08, "square", 0.09);
    tone(ac, 1318, 0.07, 0.16, "triangle", 0.1);
  });
}
