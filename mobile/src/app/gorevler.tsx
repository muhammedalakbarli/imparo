import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Animated } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, Check, Gift } from "lucide-react-native";
import AnimatedBar from "@/components/AnimatedBar";
import { useAuth } from "@/lib/auth";
import {
  todaysQuests,
  questValue,
  isQuestDone,
  syncQuestRewards,
  loadQuestState,
  chestAvailable,
  openChest,
  type QuestState,
  type ChestReward,
} from "@/lib/quests";
import { C } from "@/lib/theme";
import Mascot from "@/components/Mascot";

function rewardText(r: ChestReward): string {
  if (r.kind === "gems") return `+${r.amount} zümrüd 💎`;
  if (r.kind === "hearts") return "Canlar dolduruldu ❤️";
  return "Seriya qoruyucu qazandın 🧊";
}

export default function GorevlerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [quests, setQuests] = useState<QuestState | null>(null);
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState<ChestReward | null>(null);
  const [rewardScale] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reward) {
      rewardScale.setValue(0);
      Animated.spring(rewardScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
    }
  }, [reward, rewardScale]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      syncQuestRewards(user.id)
        .then(setQuests)
        .catch(() => loadQuestState().then(setQuests).catch(() => {}));
    }, [user]),
  );

  async function handleChest() {
    if (opening) return;
    setOpening(true);
    try {
      const r = await openChest();
      setReward(r);
      const s = await loadQuestState();
      setQuests(s);
    } finally {
      setOpening(false);
    }
  }

  if (!user || !quests) {
    return <View style={s.center}><ActivityIndicator color={C.brand} size="large" /></View>;
  }

  const list = todaysQuests(quests.date);
  const doneCount = list.filter((q) => isQuestDone(quests, q)).length;
  const chestReady = chestAvailable(quests);

  // Sandıq mükafatı açılışı
  if (reward) {
    return (
      <View style={s.center}>
        <Animated.View style={{ transform: [{ scale: rewardScale }] }}>
          <Mascot size={130} mood="celebrate" />
        </Animated.View>
        <Text style={s.rewardTitle}>Sandıq açıldı! 🎁</Text>
        <Text style={s.rewardText}>{rewardText(reward)}</Text>
        <Pressable style={s.cta} onPress={() => setReward(null)}>
          <Text style={s.ctaText}>Əla!</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.ink }}>
      {/* Başlıq */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}><ArrowLeft color={C.fg} size={26} /></Pressable>
        <Text style={s.title}>Görevlər</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Text style={s.subtitle}>Bu gün {doneCount} / {list.length} tamamlandı</Text>

        {list.map((q) => {
          const val = questValue(quests, q.kind);
          const done = isQuestDone(quests, q);
          const label = q.label.replace("{n}", String(q.goal));
          const pct = Math.min((val / q.goal) * 100, 100);
          return (
            <View key={q.id} style={s.quest}>
              <View style={s.questTop}>
                <Text style={s.questLabel}>{label}</Text>
                {done ? (
                  <View style={s.doneBadge}><Check color={C.white} size={14} strokeWidth={3} /></View>
                ) : (
                  <Text style={s.reward}>+{q.rewardXp} XP</Text>
                )}
              </View>
              <AnimatedBar pct={pct} color={done ? C.success : C.brand} height={12} />
              <Text style={s.count}>{Math.min(val, q.goal)} / {q.goal}</Text>
            </View>
          );
        })}

        {/* Mükafat sandığı */}
        <View style={[s.chest, chestReady ? s.chestReady : s.chestLocked]}>
          <Gift color={chestReady ? C.brand : C.muted} size={40} />
          <Text style={s.chestTitle}>Gündəlik sandıq</Text>
          <Text style={s.chestText}>
            {quests.chestOpened
              ? "Bu gün açıldı — sabah yenisi!"
              : chestReady
                ? "Bütün görevlər bitdi — sandığı aç!"
                : "Bütün görevləri bitir və sandığı qazandır."}
          </Text>
          {chestReady && (
            <Pressable style={s.cta} onPress={handleChest} disabled={opening}>
              <Text style={s.ctaText}>{opening ? "Açılır…" : "Sandığı aç"}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.ink, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: "900", color: C.fg },
  subtitle: { color: C.muted, fontWeight: "700", fontSize: 14 },
  quest: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 16, gap: 10 },
  questTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  questLabel: { color: C.fg, fontWeight: "800", fontSize: 16, flex: 1 },
  reward: { color: C.gold, fontWeight: "800", fontSize: 13 },
  doneBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.success, alignItems: "center", justifyContent: "center" },
  count: { color: C.muted, fontWeight: "700", fontSize: 12, textAlign: "right" },
  chest: { alignItems: "center", gap: 8, borderRadius: 16, borderWidth: 2, padding: 20, marginTop: 6 },
  chestReady: { borderColor: C.brand, backgroundColor: "#F47B3A14" },
  chestLocked: { borderColor: C.line, backgroundColor: C.panel },
  chestTitle: { color: C.fg, fontWeight: "800", fontSize: 17 },
  chestText: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 20 },
  cta: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40, alignItems: "center", backgroundColor: C.brand, marginTop: 8 },
  ctaText: { color: C.white, fontSize: 16, fontWeight: "800", textTransform: "uppercase" },
  rewardTitle: { fontSize: 24, fontWeight: "900", color: C.fg, marginTop: 8 },
  rewardText: { fontSize: 18, fontWeight: "700", color: C.brand },
});
