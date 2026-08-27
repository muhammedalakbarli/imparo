// Paylaşılan tapşırıq göstəricisi — dərs (lesson) və Praktika ekranları eyni UI işlədir.
// 5 tip: multiple_choice, listening (səsli), word_order (cümlə quran), fill_blank, numeric.
import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Volume2 } from "lucide-react-native";
import { speakEnglish } from "@/lib/tts";
import type { UserAnswer } from "@/lib/grading";
import type { Task } from "@/lib/types";
import { C } from "@/lib/theme";

export default function TaskView({
  task,
  answer,
  checked,
  onAnswer,
}: {
  task: Task;
  answer: UserAnswer | null;
  checked: boolean;
  onAnswer: (v: UserAnswer) => void;
}) {
  const isListening = task.type === "listening";
  const isChoice = task.type === "multiple_choice" || isListening;
  const options = isChoice ? ((task as any).options as string[]) : [];

  return (
    <View>
      <Text style={t.prompt}>{task.prompt}</Text>

      {/* Dinləmə: İngilis mətnini səsləndir */}
      {isListening && (
        <Pressable style={t.listenBtn} onPress={() => speakEnglish((task as any).audioText)}>
          <Volume2 color={C.white} size={24} />
          <Text style={t.listenText}>Dinlə</Text>
        </Pressable>
      )}

      {task.type === "word_order" ? (
        <WordOrder
          key={task.id}
          words={(task as any).words}
          translation={(task as any).translation}
          disabled={checked}
          onChange={onAnswer}
        />
      ) : isChoice ? (
        options.map((opt, i) => {
          const sel = answer === i;
          const isCorrectOpt = i === (task as any).correctIndex;
          const tone = checked
            ? isCorrectOpt
              ? { borderColor: C.success, backgroundColor: "#2FB17022" }
              : sel
                ? { borderColor: C.danger, backgroundColor: "#FF6B5E22" }
                : {}
            : sel
              ? { borderColor: C.brand, backgroundColor: "#F47B3A18" }
              : {};
          return (
            <Pressable
              key={i}
              disabled={checked}
              onPress={() => {
                onAnswer(i);
                // Dinləmə variantları İngilis sözdür — seçiləndə səslənir.
                if (isListening) speakEnglish(opt);
              }}
              style={({ pressed }) => [t.opt, tone, pressed && { transform: [{ scale: 0.98 }] }]}
            >
              <Text style={t.optText}>{opt}</Text>
            </Pressable>
          );
        })
      ) : (
        <TextInput
          style={t.input}
          placeholder="Cavabını yaz…"
          placeholderTextColor={C.muted}
          editable={!checked}
          value={answer !== null ? String(answer) : ""}
          onChangeText={onAnswer}
          keyboardType={task.type === "numeric" ? "numeric" : "default"}
          autoCapitalize="none"
        />
      )}
    </View>
  );
}

// Cümlə quran (word_order): söz banki qarışıq → sıra ilə seç → cavab sətri.
function WordOrder({
  words,
  translation,
  disabled,
  onChange,
}: {
  words: string[];
  translation?: string;
  disabled: boolean;
  onChange: (v: UserAnswer) => void;
}) {
  // Söz banki: hər sözə sabit açar (təkrar sözlər üçün) + bir dəfə qarışıq sıra.
  const [bank] = useState(() => {
    const a = words.map((w, i) => ({ w, key: i }));
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  });
  const [picked, setPicked] = useState<number[]>([]);

  useEffect(() => {
    const complete = picked.length === words.length;
    const sentence = picked.map((k) => bank.find((b) => b.key === k)!.w).join(" ");
    onChange(complete ? sentence : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  const available = bank.filter((b) => !picked.includes(b.key));

  return (
    <View>
      {translation ? (
        <Text style={t.woTranslation}>
          Tərcümə: <Text style={t.woTranslationStrong}>{translation}</Text>
        </Text>
      ) : null}

      {/* Cavab sətri — tıklananda sözü geri qaytarır */}
      <View style={t.woAnswer}>
        {picked.length === 0 && <Text style={t.woHint}>Sözləri sıra ilə seç…</Text>}
        {picked.map((k) => {
          const word = bank.find((b) => b.key === k)!.w;
          return (
            <Pressable key={k} disabled={disabled} onPress={() => setPicked((p) => p.filter((x) => x !== k))} style={t.woChip}>
              <Text style={t.woChipText}>{word}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Söz banki */}
      <View style={t.woBank}>
        {available.map((b) => (
          <Pressable key={b.key} disabled={disabled} onPress={() => setPicked((p) => [...p, b.key])} style={({ pressed }) => [t.woBankChip, pressed && { transform: [{ scale: 0.94 }] }]}>
            <Text style={t.woBankChipText}>{b.w}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const t = StyleSheet.create({
  prompt: { color: C.fg, fontSize: 22, fontWeight: "800", marginTop: 8, marginBottom: 20 },
  opt: { borderWidth: 2, borderColor: C.line, backgroundColor: C.panel, borderRadius: 16, padding: 16, marginBottom: 12 },
  optText: { fontSize: 17, fontWeight: "600", color: C.fg },
  input: { borderWidth: 2, borderColor: C.line, backgroundColor: C.panel, borderRadius: 16, padding: 16, fontSize: 18, color: C.fg },
  listenBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: C.brand, borderRadius: 16, paddingVertical: 18, marginBottom: 20 },
  listenText: { color: C.white, fontSize: 18, fontWeight: "800" },
  woTranslation: { color: C.muted, fontSize: 14, marginBottom: 12 },
  woTranslationStrong: { color: C.fg, fontWeight: "700" },
  woAnswer: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, minHeight: 56, borderWidth: 2, borderStyle: "dashed", borderColor: C.line, borderRadius: 16, padding: 12, marginBottom: 16 },
  woHint: { color: C.muted, fontSize: 14 },
  woChip: { backgroundColor: C.brand, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  woChipText: { color: C.white, fontWeight: "700", fontSize: 16 },
  woBank: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  woBankChip: { backgroundColor: C.panel, borderWidth: 2, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  woBankChipText: { color: C.fg, fontWeight: "700", fontSize: 16 },
});
