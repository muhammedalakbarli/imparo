// İngilis dili tələffüzü (mobil) — cihazın öz TTS mühərriki (expo-speech).
// Web-dəki speakEnglish ilə eyni davranış: əvvəlki səsi dayandır, sonra oxu.
import * as Speech from "expo-speech";

// Verilmiş İngilis mətnini səsləndirir. Əvvəlki səsi kəsir (üst-üstə düşməsin).
export function speakEnglish(text: string): void {
  const t = text?.trim();
  if (!t) return;
  Speech.stop();
  Speech.speak(t, { language: "en-US", rate: 0.9 });
}

// Cihazda tələffüz mümkündür? (expo-speech hər platformada var)
export function ttsSupported(): boolean {
  return true;
}
