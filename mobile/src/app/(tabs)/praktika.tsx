import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Animated } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dumbbell } from "lucide-react-native";
import AnimatedBar from "@/components/AnimatedBar";
import { fetchContentTree } from "@/lib/content";
import { gradeTask, type UserAnswer } from "@/lib/grading";
import { loadDueTaskIds, markCorrect, addWrong } from "@/lib/srs";
import type { Task } from "@/lib/types";
import { C } from "@/lib/theme";
import TaskView from "@/components/TaskView";
import Mascot from "@/components/Mascot";

type Phase = "intro" | "run" | "done";

export default function PraktikaScreen() {
  const insets = useSafeAreaInsets();
  const [due, setDue] = useState<Task[] | null>(null); // null = yüklənir
  const [phase, setPhase] = useState<Phase>("intro");

  // Sessiya vəziyyəti
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<UserAnswer | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // Animasiyalar
  const [shakeX] = useState(() => new Animated.Value(0));
  const [mascotScale] = useState(() => new Animated.Value(0));

  function runShake() {
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  useEffect(() => {
    if (phase === "done") {
      mascotScale.setValue(0);
      Animated.spring(mascotScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
    }
  }, [phase, mascotScale]);

  // Vaxtı çatan təkrarları yüklə (bütün məzmun ağacından task-ları tap).
  const reload = useCallback(async () => {
    setDue(null);
    try {
      const [tree, ids] = await Promise.all([fetchContentTree(), loadDueTaskIds()]);
      const byId = new Map<string, Task>();
      for (const su of tree)
        for (const un of su.units)
          for (const l of un.lessons) for (const t of [...l.tasks, ...(l.bonusTasks ?? [])]) byId.set(t.id, t);
      const tasks = ids.map((id) => byId.get(id)).filter((t): t is Task => !!t);
      setDue(tasks);
    } catch {
      setDue([]);
    }
  }, []);

  // Səhifəyə hər dönəndə (dərsdən sonra) təkrarları yenilə — amma sessiya gedirsə yox.
  useFocusEffect(
    useCallback(() => {
      if (phase === "intro") reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]),
  );

  function start() {
    setIndex(0);
    setAnswer(null);
    setChecked(false);
    setCorrectCount(0);
    setPhase("run");
  }

  function check() {
    const task = due?.[index];
    if (!task || answer === null || answer === "") return;
    const r = gradeTask(task, answer);
    setCorrect(r.correct);
    setChecked(true);
    if (r.correct) {
      markCorrect(task.id);
      setCorrectCount((c) => c + 1);
    } else {
      addWrong(task.id); // yenidən sıfırla, gələcəkdə təkrar
      runShake();
    }
  }

  function next() {
    setAnswer(null);
    setChecked(false);
    if (due && index + 1 < due.length) setIndex((i) => i + 1);
    else setPhase("done");
  }

  // ── Yüklənir ──
  if (due === null && phase !== "run") {
    return <View style={s.center}><ActivityIndicator color={C.brand} size="large" /></View>;
  }

  // ── Nəticə ──
  if (phase === "done") {
    const total = due?.length ?? 0;
    const acc = total ? Math.round((correctCount / total) * 100) : 0;
    return (
      <View style={s.center}>
        <Animated.View style={{ transform: [{ scale: mascotScale }] }}>
          <Mascot size={120} mood="celebrate" />
        </Animated.View>
        <Text style={s.doneTitle}>Praktika bitdi! 🎉</Text>
        <Text style={s.doneSub}>{correctCount} / {total} düz · {acc}% dəqiqlik</Text>
        <Pressable style={s.cta} onPress={() => setPhase("intro")}>
          <Text style={s.ctaText}>Bitir</Text>
        </Pressable>
      </View>
    );
  }

  // ── Sessiya ──
  if (phase === "run" && due) {
    const task = due[index];
    const pct = Math.round((index / due.length) * 100);
    return (
      <View style={{ flex: 1, backgroundColor: C.ink }}>
        <View style={[s.top, { paddingTop: insets.top + 16 }]}>
          <AnimatedBar pct={pct} />
          <Text style={s.counter}>{index + 1} / {due.length}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 150 }}>
          <Text style={s.badge}>🔁 Təkrar</Text>
          <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
            <TaskView task={task} answer={answer} checked={checked} onAnswer={setAnswer} />
          </Animated.View>
        </ScrollView>
        <View style={[s.bottom, checked && { backgroundColor: correct ? "#2FB17018" : "#FF6B5E18" }]}>
          {checked && (
            <Text style={[s.feedback, { color: correct ? C.success : C.danger }]}>
              {correct ? "Əla! 🦊" : "Bir də təkrar olunacaq"}
            </Text>
          )}
          <Pressable
            style={[s.cta, { backgroundColor: checked ? (correct ? C.success : C.danger) : C.brand }, (answer === null || answer === "") && !checked && { opacity: 0.5 }]}
            disabled={(answer === null || answer === "") && !checked}
            onPress={checked ? next : check}
          >
            <Text style={s.ctaText}>{checked ? (index + 1 < due.length ? "Növbəti" : "Bitir") : "Yoxla"}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Giriş (intro) ──
  const count = due?.length ?? 0;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.ink }} contentContainerStyle={s.introWrap}>
      <Dumbbell color={C.brand} size={56} />
      <Text style={s.title}>Praktika</Text>
      {count === 0 ? (
        <>
          <Mascot size={110} mood="celebrate" />
          <Text style={s.introText}>Təkrar üçün heç nə yoxdur! 🎉{"\n"}Dərslərdə səhv etdiyin suallar burada təkrara düşür.</Text>
        </>
      ) : (
        <>
          <Text style={s.bigNum}>{count}</Text>
          <Text style={s.introText}>sual təkrara hazırdır. Unutma əyrisinə görə planlaşdırılıb.</Text>
          <Pressable style={s.cta} onPress={start}>
            <Text style={s.ctaText}>Başla</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.ink, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  introWrap: { alignItems: "center", justifyContent: "center", gap: 14, padding: 28, paddingTop: 80, minHeight: "100%" },
  title: { fontSize: 28, fontWeight: "900", color: C.fg },
  bigNum: { fontSize: 64, fontWeight: "900", color: C.brand },
  introText: { fontSize: 16, color: C.muted, textAlign: "center", lineHeight: 24 },
  top: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  counter: { color: C.muted, fontWeight: "800", fontSize: 14 },
  badge: { color: "#E9A23B", fontWeight: "800", fontSize: 12, textTransform: "uppercase", marginBottom: 4 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 28, backgroundColor: C.ink, borderTopWidth: 1, borderTopColor: C.line, gap: 8 },
  feedback: { fontSize: 17, fontWeight: "800" },
  cta: { borderRadius: 16, minHeight: 56, paddingVertical: 15, paddingHorizontal: 40, alignItems: "center", justifyContent: "center", backgroundColor: C.brand, marginTop: 8 },
  ctaText: { color: C.white, fontSize: 17, fontWeight: "800", textTransform: "uppercase" },
  doneTitle: { fontSize: 24, fontWeight: "800", color: C.fg, marginTop: 10 },
  doneSub: { fontSize: 16, color: C.muted },
});
