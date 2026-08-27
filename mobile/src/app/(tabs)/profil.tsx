import { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Star, Flame, Gem, LogOut } from "lucide-react-native";
import { useAuth, userGrade, signOut, updateGrade } from "@/lib/auth";
import { loadProgress, type Progress } from "@/lib/progress";
import { levelFromXp } from "@/lib/levels";
import { C } from "@/lib/theme";
import Mascot from "@/components/Mascot";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Profil() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [prog, setProg] = useState<Progress | null>(null);
  const [editGrade, setEditGrade] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) loadProgress(user.id).then(setProg);
    }, [user]),
  );

  const lv = levelFromXp(prog?.totalXp ?? 0);
  const name = (user?.user_metadata?.name as string) || user?.email?.split("@")[0] || "İstifadəçi";
  const grade = userGrade(user);

  async function pickGrade(g: number) {
    if (savingGrade || g === grade) { setEditGrade(false); return; }
    setSavingGrade(true);
    await updateGrade(g); // onAuthStateChange (USER_UPDATED) user-i yeniləyir
    setSavingGrade(false);
    setEditGrade(false);
  }

  return (
    <View style={[s.wrap, { paddingTop: insets.top + 40 }]}>
      <Mascot size={100} mood="happy" />
      <Text style={s.name}>{name}</Text>
      <Pressable onPress={() => setEditGrade((v) => !v)}>
        <Text style={s.meta}>{grade}-ci sinif · Səviyyə {lv.level} ({lv.title})  ✎</Text>
      </Pressable>

      {editGrade ? (
        <View style={s.grades}>
          {GRADES.map((g) => {
            const on = g === grade;
            return (
              <Pressable
                key={g}
                onPress={() => pickGrade(g)}
                disabled={savingGrade}
                style={[s.gradeBtn, on && s.gradeOn, savingGrade && { opacity: 0.5 }]}
              >
                <Text style={[s.gradeText, on && s.gradeTextOn]}>{g}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={s.row}>
        <Stat Icon={Star} v={prog?.totalXp ?? 0} label="XP" color={C.accent} />
        <Stat Icon={Flame} v={prog?.streakDays ?? 0} label="Streak" color={C.brand} />
        <Stat Icon={Gem} v={prog?.gems ?? 0} label="Zümrüd" color={C.success} />
      </View>

      {/* Səviyyə barı */}
      <View style={s.barWrap}>
        <View style={[s.barFill, { width: `${Math.round(lv.progress * 100)}%` }]} />
      </View>
      <Text style={s.barText}>{lv.xpInLevel}/{lv.xpForNext} XP</Text>

      <Pressable style={s.logout} onPress={() => signOut()}>
        <LogOut color={C.fg} size={18} />
        <Text style={s.logoutText}>Çıxış</Text>
      </Pressable>
    </View>
  );
}

function Stat({ Icon, v, label, color }: { Icon: any; v: number; label: string; color: string }) {
  return (
    <View style={s.stat}>
      <Icon color={color} size={22} />
      <Text style={s.statN}>{v}</Text>
      <Text style={s.statL}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.ink, alignItems: "center", paddingTop: 60, paddingHorizontal: 24, gap: 8 },
  name: { fontSize: 24, fontWeight: "800", color: C.fg, marginTop: 8 },
  meta: { color: C.muted, marginBottom: 8 },
  grades: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 4 },
  gradeBtn: { width: 46, height: 46, borderRadius: 12, borderWidth: 2, borderColor: C.line, backgroundColor: C.panel, alignItems: "center", justifyContent: "center" },
  gradeOn: { borderColor: C.brand, backgroundColor: C.brand },
  gradeText: { fontSize: 17, fontWeight: "800", color: C.fg },
  gradeTextOn: { color: C.white },
  row: { flexDirection: "row", gap: 12, marginTop: 8 },
  stat: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14, alignItems: "center", width: 92 },
  statN: { fontSize: 18, fontWeight: "800", color: C.fg, marginTop: 4 },
  statL: { fontSize: 11, color: C.muted },
  barWrap: { width: "100%", height: 12, backgroundColor: C.panel2, borderRadius: 8, marginTop: 18, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: C.accent, borderRadius: 8 },
  barText: { color: C.muted, fontSize: 12, marginTop: 4 },
  logout: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 30, borderWidth: 2, borderColor: C.line, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12 },
  logoutText: { fontWeight: "700", color: C.fg },
});
