import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable, Modal } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trophy, X, Flame } from "lucide-react-native";
import { C } from "@/lib/theme";
import {
  loadCohort, loadMyLeagueTier, maybeLeagueRollover,
  TIER_NAMES, TIER_COLORS, type CohortRow,
} from "@/lib/leaderboard";

export default function LiqaScreen() {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<CohortRow[] | null>(null);
  const [tier, setTier] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<{ row: CohortRow; rank: number } | null>(null);

  const load = useCallback(async () => {
    await maybeLeagueRollover();
    const [c, t] = await Promise.all([loadCohort(15), loadMyLeagueTier()]);
    setRows(c);
    setTier(t);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (!rows) return <View style={s.center}><ActivityIndicator color={C.brand} size="large" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: C.ink }}>
      {/* Pillə başlığı */}
      <View style={[s.header, { backgroundColor: TIER_COLORS[tier] + "22", marginTop: insets.top + 16 }]}>
        <Trophy color={TIER_COLORS[tier]} size={30} fill={TIER_COLORS[tier]} />
        <View>
          <Text style={[s.tierName, { color: TIER_COLORS[tier] }]}>{TIER_NAMES[tier]} liqası</Text>
          <Text style={s.tierSub}>Top 5 növbəti pilləyə yüksəlir</Text>
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.userId}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        renderItem={({ item, index }) => {
          const rank = index + 1;
          const promo = rank <= 5;
          return (
            <Pressable
              style={[s.row, item.isMe && s.rowMe]}
              onPress={() => setSelected({ row: item, rank })}
            >
              <Text style={[s.rank, promo && { color: C.success }]}>
                {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
              </Text>
              <View style={[s.avatar, { backgroundColor: item.color }]}>
                <Text style={s.avatarText}>{item.initial}</Text>
              </View>
              <Text style={[s.name, item.isMe && { color: C.brand, fontWeight: "900" }]} numberOfLines={1}>
                {item.name}{item.isMe ? " (sən)" : ""}
              </Text>
              <Text style={s.xp}>{item.weeklyXp} XP</Text>
            </Pressable>
          );
        }}
        ListFooterComponent={<Text style={s.footer}>Həftə sonu sıralamaya görə yüksəlir/düşürsən.</Text>}
      />

      {/* Profil baxışı — sətrə toxunanda */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={s.modalBg} onPress={() => setSelected(null)}>
          {selected && (
            <Pressable style={s.card} onPress={(e) => e.stopPropagation()}>
              <Pressable style={s.closeBtn} onPress={() => setSelected(null)} hitSlop={10}>
                <X color={C.muted} size={20} />
              </Pressable>
              <View style={[s.avatarBig, { backgroundColor: selected.row.color }]}>
                <Text style={s.avatarBigText}>{selected.row.initial}</Text>
              </View>
              <Text style={s.cardName}>{selected.row.name}{selected.row.isMe ? " (sən)" : ""}</Text>
              <View style={s.cardBadge}>
                <Trophy color={TIER_COLORS[selected.row.tier]} size={16} fill={TIER_COLORS[selected.row.tier]} />
                <Text style={[s.cardBadgeText, { color: TIER_COLORS[selected.row.tier] }]}>
                  {TIER_NAMES[selected.row.tier]} liqası · #{selected.rank}
                </Text>
              </View>
              <View style={s.cardStat}>
                <Flame color={C.brand} size={18} fill={C.brand} />
                <Text style={s.cardStatText}>{selected.row.weeklyXp} XP bu həftə</Text>
              </View>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.ink, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18, margin: 16, borderRadius: 20 },
  tierName: { fontSize: 20, fontWeight: "900" },
  tierSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.panel, borderRadius: 16, borderWidth: 1, borderColor: C.line, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8 },
  rowMe: { borderColor: C.brand, backgroundColor: "#F47B3A12" },
  rank: { width: 28, textAlign: "center", fontSize: 16, fontWeight: "800", color: C.muted },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { color: C.white, fontWeight: "900", fontSize: 17 },
  name: { flex: 1, fontSize: 16, fontWeight: "700", color: C.fg },
  xp: { fontSize: 15, fontWeight: "800", color: C.accent },
  footer: { textAlign: "center", color: C.muted, fontSize: 12, marginTop: 12 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 320, backgroundColor: C.panel, borderRadius: 24, padding: 24, alignItems: "center", gap: 8 },
  closeBtn: { position: "absolute", top: 14, right: 14, padding: 4 },
  avatarBig: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarBigText: { color: C.white, fontWeight: "900", fontSize: 28 },
  cardName: { fontSize: 20, fontWeight: "900", color: C.fg, textAlign: "center" },
  cardBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.panel2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  cardBadgeText: { fontWeight: "800", fontSize: 13 },
  cardStat: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  cardStatText: { fontWeight: "800", fontSize: 15, color: C.fg },
});
