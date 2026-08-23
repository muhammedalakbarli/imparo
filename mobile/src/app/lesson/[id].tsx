import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Vibration, Animated, Alert, BackHandler } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Heart } from "lucide-react-native";
import TaskView from "@/components/TaskView";
import AnimatedBar from "@/components/AnimatedBar";
import CountUp from "@/components/CountUp";
import { addWrong, markCorrect } from "@/lib/srs";
import { bumpQuest, bumpQuests } from "@/lib/quests";
import { useAuth } from "@/lib/auth";
import { fetchContentTree } from "@/lib/content";
import { gradeTask, type UserAnswer } from "@/lib/grading";
import { completeLesson } from "@/lib/progress";
import { loadHearts, loseHeart, MAX_HEARTS } from "@/lib/hearts";
import { loadPlus } from "@/lib/plus";
import { addLeaderboardXp } from "@/lib/leaderboard";
import type { Lesson, Task } from "@/lib/types";
import { C } from "@/lib/theme";
import Mascot from "@/components/Mascot";
import ZefiMascot, { type ZefiEmotion } from "@/components/ZefiMascot";

type Phase = "main" | "retry" | "done";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [lesson, setLesson] = useState<Lesson | null | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("main");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<UserAnswer | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [earned, setEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [gemsEarned, setGemsEarned] = useState(0);

  // Səhvlər — bölmə sonunda düz cavablanana qədər təkrarlanır.
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [retryQueue, setRetryQueue] = useState<Task[]>([]);
  const [retryTotal, setRetryTotal] = useState(0);

  // Oyunlaşdırma
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [plus, setPlus] = useState(false);

  useEffect(() => {
    fetchContentTree().then((tree) => {
      for (const su of tree) for (const un of su.units) {
        const l = un.lessons.find((x) => x.id === id);
        if (l) return setLesson(l);
      }
      setLesson(null);
    });
  }, [id]);
  useEffect(() => { loadHearts().then(setHearts).catch(() => {}); }, [user]);
  useEffect(() => { loadPlus().then(setPlus).catch(() => {}); }, [user]);

  const mainTasks = lesson?.tasks ?? [];
  const inRetry = phase === "retry";
  const task: Task | undefined = inRetry ? retryQueue[0] : mainTasks[index];

  // Dərsdən çıxış təsdiqi. Yarımçıq dərs saxlanılmır — həll edilən tapşırıqlar
  // itir, ona görə çıxış təsadüfi toxunuşla baş verməməlidir.
  function confirmQuit() {
    Alert.alert(
      "Dayan, getmə!",
      answered > 0
        ? `İndi çıxsan bu dərsdəki irəliləyişin itəcək.\n\nHəll edilib: ${answered} / ${mainTasks.length}`
        : "İndi çıxsan bu dərsə yenidən başlamalı olacaqsan.",
      [
        { text: "Dərsə davam et", style: "cancel" },
        { text: "Dərsi bitir", style: "destructive", onPress: () => router.back() },
      ],
      { cancelable: true },
    );
  }

  // Android-də əsas çıxış yolu aparat/jest "geri"dir — X-i qorumaq kifayət etmir,
  // yoxsa eyni problem geri düyməsində qalır.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmQuit();
      return true; // defolt "geri"ni dayandır
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, mainTasks.length]);
  const total = inRetry ? retryTotal : mainTasks.length;
  const doneCount = inRetry ? retryTotal - retryQueue.length : index;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  // ── Animasiyalar (RN Animated) ──
  const [shakeX] = useState(() => new Animated.Value(0)); // səhv cavabda titrəmə
  const [fbAnim] = useState(() => new Animated.Value(0)); // feedback banner slayd/opacity
  const [mascotScale] = useState(() => new Animated.Value(0)); // done ekranı maskot spring
  const [buddyBounce] = useState(() => new Animated.Value(1)); // yoldaş Zefi — cavabda bounce

  // Yoldaş Zefi — sualı gözləyəndə düşünür, düz/səhv cavabda reaksiya verir (Duolingo owl kimi).
  const buddyEmotion: ZefiEmotion = !checked ? "thinking" : correct ? "celebrating" : "worried";
  useEffect(() => {
    if (!checked) return;
    buddyBounce.setValue(0.7);
    Animated.spring(buddyBounce, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, correct]);

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

  // Yoxlanandan sonra feedback banner-i yumşaq gətir (yoxlama sıfırlananda gizlət).
  useEffect(() => {
    Animated.timing(fbAnim, { toValue: checked ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [checked, fbAnim]);

  // Done ekranı — maskot "pop" (spring) ilə görünsün.
  useEffect(() => {
    if (phase === "done") {
      mascotScale.setValue(0);
      Animated.spring(mascotScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
    }
  }, [phase, mascotScale]);

  function check() {
    if (task === undefined || answer === null || answer === "") return;
    const r = gradeTask(task, answer);
    setCorrect(r.correct);
    setChecked(true);

    // SRS (aralıqlı təkrar) — web ilə eyni: düz→irəli/mənimsə, səhv→təkrara sal.
    if (r.correct) markCorrect(task.id);
    else {
      addWrong(task.id);
      runShake();
    }

    if (inRetry) {
      Vibration.vibrate(r.correct ? 25 : 70);
      return; // təkrar mərhələsində XP/can dəyişmir
    }

    setAnswered((a) => a + 1);
    if (r.correct) {
      setEarned((x) => x + 2); // web ilə eyni: hər düz cavab +2 XP
      setCorrectCount((c) => c + 1);
      bumpQuest("correct", 1); // gündəlik "düzgün cavab" questi
      Vibration.vibrate(25);
    } else {
      setWrongIds((w) => (w.includes(task.id) ? w : [...w, task.id]));
      if (!plus) {
        loseHeart().then((h) => setHearts(h)).catch(() => {});
      }
      Vibration.vibrate(70);
    }
  }

  async function finishLesson() {
    // XP+zümrüd artıq serverdə (complete_lesson RPC) həqiqi tapşırıq sayından hesablanır —
    // client heç bir məbləğ göndərmir, idempotentdir (bax lib/progress.ts, migration 0037).
    // "Bitdi" ekranı server-in qaytardığı real dəyərləri göstərir.
    const r = user ? await completeLesson(String(id)).catch(() => ({ xp: 0, gems: 0 })) : { xp: 0, gems: 0 };
    setEarned(r.xp);
    setGemsEarned(r.gems);
    addLeaderboardXp(r.xp).catch(() => {});
    bumpQuests({ xp: r.xp, lessons: 1 }).catch(() => {}); // gündəlik XP + dərs questləri
    Vibration.vibrate([0, 40, 60, 40]);
    setPhase("done");
  }

  async function next() {
    setAnswer(null);
    setChecked(false);

    if (inRetry) {
      const [head, ...rest] = retryQueue;
      const nextQ = correct ? rest : [...rest, head];
      if (nextQ.length === 0) { await finishLesson(); return; }
      setRetryQueue(nextQ);
      return;
    }

    if (index + 1 < mainTasks.length) {
      setIndex((i) => i + 1);
      return;
    }
    // Əsas suallar bitdi — əvvəl səhvlərin təkrarı, sonra bitir.
    if (wrongIds.length > 0) {
      const retry = wrongIds
        .map((wid) => mainTasks.find((t) => t.id === wid))
        .filter((t): t is Task => !!t);
      setRetryQueue(retry);
      setRetryTotal(retry.length);
      setPhase("retry");
    } else {
      await finishLesson();
    }
  }

  if (lesson === undefined) return <View style={s.center}><ActivityIndicator color={C.brand} size="large" /></View>;
  if (lesson === null || mainTasks.length === 0) {
    return <View style={s.center}><Text style={{ color: C.muted }}>Dərs tapılmadı.</Text><Pressable onPress={() => router.back()}><Text style={s.link}>Geri</Text></Pressable></View>;
  }

  if (phase === "done") {
    const accuracy = answered ? Math.round((correctCount / answered) * 100) : 0;
    return (
      <View style={s.center}>
        <Animated.View style={{ transform: [{ scale: mascotScale }] }}>
          <Mascot size={130} mood="celebrate" />
        </Animated.View>
        <Text style={s.doneTitle}>Dərs tamamlandı! 🎉</Text>
        <View style={s.doneStats}>
          <Stat count={earned} prefix="+" label="XP" color={C.accent} />
          <Stat count={gemsEarned} prefix="+" label="Zümrüd" color={C.success} />
          <Stat count={accuracy} suffix="%" label="Dəqiqlik" color={C.brand} />
        </View>
        <Pressable style={s.btn} onPress={() => router.back()}><Text style={s.btnText}>Davam et</Text></Pressable>
      </View>
    );
  }

  if (task === undefined) return <View style={s.center}><ActivityIndicator color={C.brand} size="large" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: C.ink }}>
      {/* Üst bar: çıxış + progress + canlar */}
      <View style={[s.top, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={confirmQuit} hitSlop={10}><X color={C.muted} size={26} /></Pressable>
        <AnimatedBar pct={pct} color={inRetry ? "#E9A23B" : C.brand} />
        <View style={s.hearts}>
          <Heart color={C.danger} fill={C.danger} size={18} />
          <Text style={s.heartsText}>{plus ? "∞" : hearts}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 150 }}>
        <View style={s.buddyRow}>
          <Text style={s.taskNo}>
            {inRetry ? `🔁 Təkrar ${doneCount + 1} / ${total}` : `Tapşırıq ${index + 1} / ${total}`}
          </Text>
          <Animated.View style={{ transform: [{ scale: buddyBounce }] }}>
            <ZefiMascot emotion={buddyEmotion} size={48} />
          </Animated.View>
        </View>
        <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
          <TaskView task={task} answer={answer} checked={checked} onAnswer={setAnswer} />
        </Animated.View>
      </ScrollView>

      <View style={[s.bottom, { paddingBottom: insets.bottom + 16 }, checked && { backgroundColor: correct ? "#2FB17018" : "#FF6B5E18" }]}>
        {checked && (
          <Animated.Text
            style={[
              s.feedback,
              { color: correct ? C.success : C.danger, opacity: fbAnim, transform: [{ translateY: fbAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
            ]}
          >
            {correct ? "Əla! 🦊" : "Bir də yoxlayaq"}
          </Animated.Text>
        )}
        <Pressable
          style={[s.cta, { backgroundColor: checked ? (correct ? C.success : C.danger) : C.brand }, (answer === null || answer === "") && !checked && { opacity: 0.5 }]}
          disabled={(answer === null || answer === "") && !checked}
          onPress={checked ? next : check}
        >
          <Text style={s.ctaText}>
            {checked
              ? inRetry
                ? (retryQueue.length > 1 || !correct ? "Növbəti" : "Bitir")
                : (index + 1 < total ? "Növbəti" : (wrongIds.length > 0 ? "Davam et" : "Bitir"))
              : "Yoxla"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ count, prefix = "", suffix = "", label, color }: { count: number; prefix?: string; suffix?: string; label: string; color: string }) {
  return (
    <View style={s.stat}>
      <CountUp to={count} prefix={prefix} suffix={suffix} style={[s.statValue, { color }]} />
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.ink, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  link: { color: C.brand, fontWeight: "700", marginTop: 12 },
  top: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  hearts: { flexDirection: "row", alignItems: "center", gap: 4 },
  heartsText: { color: C.danger, fontWeight: "800", fontSize: 15 },
  taskNo: { color: C.muted, fontWeight: "700", fontSize: 12, textTransform: "uppercase" },
  buddyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 28, backgroundColor: C.ink, borderTopWidth: 1, borderTopColor: C.line, gap: 8 },
  feedback: { fontSize: 17, fontWeight: "800" },
  cta: { borderRadius: 16, minHeight: 56, paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  ctaText: { color: C.white, fontSize: 17, fontWeight: "800", textTransform: "uppercase" },
  doneTitle: { fontSize: 24, fontWeight: "800", color: C.fg, marginTop: 10 },
  doneStats: { flexDirection: "row", gap: 12, marginTop: 8 },
  stat: { alignItems: "center", backgroundColor: C.panel, borderRadius: 16, borderWidth: 1, borderColor: C.line, paddingVertical: 12, paddingHorizontal: 18 },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 11, color: C.muted, marginTop: 2 },
  btn: { backgroundColor: C.brand, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 40, marginTop: 16 },
  btnText: { color: C.white, fontWeight: "800", fontSize: 16, textTransform: "uppercase" },
});
