import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link } from "expo-router";
import { Check } from "lucide-react-native";
import { signUp } from "@/lib/auth";
import { C } from "@/lib/theme";
import Mascot from "@/components/Mascot";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8];
// Sadə format yoxlaması — "test@a" kimi real olmayan domenləri tutur (Supabase özü buraxır).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    if (busy) return;
    if (grade === null) { setMsg("Zəhmət olmasa sinfini seç."); return; }
    if (!EMAIL_RE.test(email.trim())) { setMsg("Zəhmət olmasa düzgün email daxil et."); return; }
    if (password.length < 6) { setMsg("Parol ən azı 6 simvol olmalıdır."); return; }
    if (!guardianConsent) { setMsg("Zəhmət olmasa valideyn/müəllim nəzarəti bəndini təsdiqlə."); return; }
    setMsg("");
    setBusy(true);
    const { error } = await signUp(email, password, name, grade, guardianConsent, parentEmail);
    if (error) setMsg(error.message);
    else setMsg("Hesab yaradıldı! Emailini təsdiqlə və ya daxil ol.");
    setBusy(false);
  }

  return (
    <KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <Mascot size={88} mood="celebrate" />
        <Text style={s.title}>Qeydiyyat</Text>

        <TextInput style={s.input} placeholder="Ad" placeholderTextColor={C.muted} value={name} onChangeText={setName} />
        <TextInput style={s.input} placeholder="Email" placeholderTextColor={C.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={s.input} placeholder="Parol (min 6)" placeholderTextColor={C.muted} secureTextEntry value={password} onChangeText={setPassword} />

        <Text style={s.label}>Neçənci sinifdəsən?</Text>
        <View style={s.grades}>
          {GRADES.map((g) => {
            const on = grade === g;
            return (
              <Pressable key={g} onPress={() => setGrade(g)} style={[s.gradeBtn, on && s.gradeOn]}>
                <Text style={[s.gradeText, on && s.gradeTextOn]}>{g}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.consentBox}>
          <Pressable style={s.consentRow} onPress={() => setGuardianConsent((v) => !v)}>
            <View style={[s.checkbox, guardianConsent && s.checkboxOn]}>
              {guardianConsent && <Check color={C.white} size={14} strokeWidth={3} />}
            </View>
            <Text style={s.consentText}>Bu hesabı valideyn/müəllim nəzarəti ilə yaradıram</Text>
          </Pressable>
          <TextInput
            style={s.parentInput}
            placeholder="Valideyn email-i (könüllü)"
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={parentEmail}
            onChangeText={setParentEmail}
          />
        </View>

        {msg ? <Text style={s.msg}>{msg}</Text> : null}

        <Pressable style={[s.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          <Text style={s.btnText}>{busy ? "Gözlə…" : "Qeydiyyatdan keç"}</Text>
        </Pressable>
        <Link href="/(auth)/login" style={s.link}>Artıq hesabın var? Daxil ol</Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.ink },
  inner: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "800", color: C.fg, marginVertical: 8 },
  input: { width: "100%", backgroundColor: C.panel, borderWidth: 2, borderColor: C.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.fg },
  label: { alignSelf: "flex-start", color: C.muted, fontWeight: "700", fontSize: 13, marginTop: 4 },
  grades: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%" },
  gradeBtn: { width: 52, height: 52, borderRadius: 14, borderWidth: 2, borderColor: C.line, backgroundColor: C.panel, alignItems: "center", justifyContent: "center" },
  gradeOn: { borderColor: C.brand, backgroundColor: C.brand },
  gradeText: { fontSize: 18, fontWeight: "800", color: C.fg },
  gradeTextOn: { color: C.white },
  consentBox: { width: "100%", backgroundColor: C.panel, borderWidth: 2, borderColor: C.line, borderRadius: 14, padding: 12, gap: 8 },
  consentRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: C.line, alignItems: "center", justifyContent: "center" },
  checkboxOn: { backgroundColor: C.brand, borderColor: C.brand },
  consentText: { flex: 1, fontSize: 12, fontWeight: "600", color: C.fg },
  parentInput: { backgroundColor: C.panel2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: C.fg },
  msg: { color: C.brand, fontWeight: "700", textAlign: "center" },
  btn: { width: "100%", backgroundColor: C.brand, borderRadius: 16, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  btnText: { color: C.white, fontSize: 17, fontWeight: "800", textTransform: "uppercase" },
  link: { color: C.brand, fontWeight: "700", marginTop: 10 },
});
