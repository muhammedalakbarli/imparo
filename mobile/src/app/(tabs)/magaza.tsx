import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gem, Heart, Shield } from "lucide-react-native";
import { C } from "@/lib/theme";
import { loadGems, spendGems, SHOP_PRICES } from "@/lib/gems";
import { loadHearts, refillHearts, MAX_HEARTS } from "@/lib/hearts";
import { grantStreakFreeze } from "@/lib/streakFreeze";

type ItemId = "refillHearts" | "streakFreeze";

export default function MagazaScreen() {
  const insets = useSafeAreaInsets();
  const [gems, setGems] = useState<number | null>(null);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [busy, setBusy] = useState<ItemId | null>(null);

  const load = useCallback(async () => {
    const [g, h] = await Promise.all([loadGems(), loadHearts()]);
    setGems(g);
    setHearts(h);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function buy(id: ItemId, price: number) {
    if (busy) return;
    if (id === "refillHearts" && hearts >= MAX_HEARTS) {
      Alert.alert("Canların artıq doludur");
      return;
    }
    if ((gems ?? 0) < price) {
      Alert.alert("Zümrüd çatmır", `Bu üçün ${price} zümrüd lazımdır.`);
      return;
    }
    setBusy(id);
    try {
      const left = await spendGems(price);
      if (left < 0) { Alert.alert("Zümrüd çatmır"); return; }
      setGems(left);
      if (id === "refillHearts") { setHearts(await refillHearts()); Alert.alert("Canlar dolduruldu! ❤️"); }
      else { await grantStreakFreeze(); Alert.alert("Seriya qoruyucusu alındı! 🛡️"); }
    } finally {
      setBusy(null);
    }
  }

  const items = [
    { id: "refillHearts" as const, Icon: Heart, color: C.danger, title: "Canları doldur", desc: "Bütün canları bərpa et", price: SHOP_PRICES.refillHearts },
    { id: "streakFreeze" as const, Icon: Shield, color: "#38BDF8", title: "Seriya qoruyucusu", desc: "Bir buraxılmış günü örtür", price: SHOP_PRICES.streakFreeze },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.ink }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <Text style={s.title}>Mağaza</Text>
        <View style={s.balance}>
          <Gem color={C.success} size={20} fill={C.success} />
          <Text style={s.balanceText}>{gems === null ? "…" : gems}</Text>
        </View>
      </View>

      {gems === null ? (
        <View style={s.center}><ActivityIndicator color={C.brand} size="large" /></View>
      ) : (
        <View style={{ padding: 16, gap: 12 }}>
          {items.map((it) => (
            <View key={it.id} style={s.card}>
              <View style={[s.iconBox, { backgroundColor: it.color + "22" }]}>
                <it.Icon color={it.color} size={26} fill={it.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{it.title}</Text>
                <Text style={s.cardDesc}>{it.desc}</Text>
              </View>
              <Pressable
                style={[s.buy, busy === it.id && { opacity: 0.5 }]}
                disabled={busy !== null}
                onPress={() => buy(it.id, it.price)}
              >
                <Gem color={C.white} size={14} fill={C.white} />
                <Text style={s.buyText}>{it.price}</Text>
              </Pressable>
            </View>
          ))}
          <Text style={s.hint}>Zümrüdü dərsləri tamamlayaraq qazan. Imparo Plus ilə 2× zümrüd!</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: "900", color: C.fg },
  balance: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.panel, borderRadius: 999, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 6 },
  balanceText: { fontSize: 16, fontWeight: "800", color: C.success },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.panel, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 14 },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: C.fg },
  cardDesc: { fontSize: 13, color: C.muted, marginTop: 2 },
  buy: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.brand, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  buyText: { color: C.white, fontWeight: "900", fontSize: 15 },
  hint: { color: C.muted, fontSize: 12, textAlign: "center", marginTop: 8, paddingHorizontal: 16 },
});
