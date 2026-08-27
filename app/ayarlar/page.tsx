"use client";

// Ayarlar → Tərcihlər: dərs təcrübəsi (səs, animasiya, motivasiya, dinləmə) +
// görünüş (tünd rejim) + dil (interfeys dili).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { createClient } from "@/lib/supabase/client";
import { userGrade, GRADES_WITH_CONTENT } from "@/lib/grade";
import { loadPrefs, savePrefs, type Prefs, type DarkMode, type Lang } from "@/lib/prefs";
import {
  pushSupported,
  pushPermission,
  isSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";
import { useT, LANG_NAMES } from "@/lib/i18n";
import { PageSkeleton } from "@/components/Skeleton";
import Toggle from "@/components/Toggle";
import ParentReportCard from "@/components/ParentReportCard";

const LESSON_ROWS: { key: keyof Prefs; labelKey: string; hintKey: string }[] = [
  { key: "sound", labelKey: "settings.sound", hintKey: "settings.soundHint" },
  { key: "animations", labelKey: "settings.animations", hintKey: "settings.animationsHint" },
  { key: "motivational", labelKey: "settings.motivational", hintKey: "settings.motivationalHint" },
  { key: "listening", labelKey: "settings.listening", hintKey: "settings.listeningHint" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const t = useT();
  const DELETE_WORD = "SİL";

  useEffect(() => {
    // Hidrasiya-təhlükəsiz: localStorage tərcihlərini mount-dan sonra oxu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(loadPrefs());
    isSubscribed().then(setPushOn).catch(() => {});
  }, []);

  async function togglePush(value: boolean) {
    setPushBusy(true);
    setPushMsg("");
    if (value) {
      const res = await subscribeToPush();
      if (res.ok) setPushOn(true);
      else setPushMsg(res.error === "denied" ? t("settings.notifDenied") : t("settings.notifError"));
    } else {
      await unsubscribeFromPush();
      setPushOn(false);
    }
    setPushBusy(false);
  }

  if (!ready || !user || !prefs) return <PageSkeleton />;

  function setToggle(key: keyof Prefs, value: boolean) {
    const next = { ...prefs!, [key]: value };
    setPrefs(next);
    savePrefs(next);
  }

  function setDark(value: DarkMode) {
    const next = { ...prefs!, darkMode: value };
    setPrefs(next);
    savePrefs(next);
  }

  function setLang(value: Lang) {
    const next = { ...prefs!, lang: value };
    savePrefs(next);
    // Bütün səhifədəki mətnlərin yenilənməsi üçün təzələ.
    window.location.reload();
  }

  // Məlumatlarını JSON kimi endir (bax migration 0039, export_own_data RPC).
  async function exportData() {
    setExporting(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.rpc("export_own_data");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "imparo-melumatlarim.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  // Hesabı həmişəlik sil (bax migration 0039, delete_own_account RPC) — geri qaytarılmaz.
  async function deleteAccount() {
    if (deleteText !== DELETE_WORD || deleting) return;
    setDeleting(true);
    const supabase = createClient();
    try {
      await supabase.rpc("delete_own_account");
    } catch {
      // sükutla ötür — hər halda çıxış edib yönləndiririk
    }
    await supabase.auth.signOut();
    router.replace("/");
  }

  // Sinif dəyişdir — user_metadata.grade yenilə və yeni sinfin proqramına keç.
  async function setGrade(value: number) {
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { grade: value } });
    // Sinif dəyişəndə bütün proqram/məzmun yenidən yüklənməlidir — tam keçid qəsdəndir.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold text-fg">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("settings.subtitle")}</p>

        {/* Dərs təcrübəsi */}
        <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">
          {t("settings.lessonExp")}
        </h2>
        <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-panel">
          {LESSON_ROWS.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-4 border-b border-line px-4 py-3.5 last:border-b-0"
            >
              <div>
                <div className="font-bold text-fg">{t(row.labelKey)}</div>
                <div className="text-xs text-muted">{t(row.hintKey)}</div>
              </div>
              <Toggle
                checked={prefs[row.key] as boolean}
                onChange={(v) => setToggle(row.key, v)}
              />
            </div>
          ))}
        </div>

        {/* Bildirişlər (re-engagement push) */}
        <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">
          {t("settings.notifSection")}
        </h2>
        <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <div className="font-bold text-fg">{t("settings.notifications")}</div>
              <div className="text-xs text-muted">
                {pushSupported() ? t("settings.notificationsHint") : t("settings.notifUnsupported")}
              </div>
              {pushMsg && <div className="mt-1 text-xs font-semibold text-red-500">{pushMsg}</div>}
            </div>
            <Toggle
              checked={pushOn}
              disabled={pushBusy || !pushSupported() || pushPermission() === "denied"}
              onChange={togglePush}
            />
          </div>
        </div>

        {/* Sinif */}
        <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">
          {t("settings.gradeSection")}
        </h2>
        <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <div className="font-bold text-fg">{t("settings.grade")}</div>
              <div className="text-xs text-muted">{t("settings.gradeHint")}</div>
            </div>
            <select
              value={userGrade(user)}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="rounded-xl border-2 border-line bg-panel px-3 py-2 text-sm font-bold text-fg outline-none focus:border-brand"
            >
              {GRADES_WITH_CONTENT.map((g) => (
                <option key={g} value={g}>
                  {t("settings.gradeOption").replace("{n}", String(g))}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Görünüş */}
        <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">
          {t("settings.appearance")}
        </h2>
        <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <div className="font-bold text-fg">{t("settings.dark")}</div>
              <div className="text-xs text-muted">{t("settings.darkHint")}</div>
            </div>
            <select
              value={prefs.darkMode}
              onChange={(e) => setDark(e.target.value as DarkMode)}
              className="rounded-xl border-2 border-line bg-panel px-3 py-2 text-sm font-bold text-fg outline-none focus:border-brand"
            >
              <option value="system">{t("settings.system")}</option>
              <option value="light">{t("settings.light")}</option>
              <option value="dark">{t("settings.darkOpt")}</option>
            </select>
          </div>
        </div>

        {/* Dil */}
        <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">
          {t("settings.language")}
        </h2>
        <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <div className="font-bold text-fg">{t("settings.language")}</div>
              <div className="text-xs text-muted">{t("settings.languageHint")}</div>
            </div>
            <select
              value={prefs.lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="rounded-xl border-2 border-line bg-panel px-3 py-2 text-sm font-bold text-fg outline-none focus:border-brand"
            >
              {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
                <option key={l} value={l}>
                  {LANG_NAMES[l]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ParentReportCard />

        {/* Məlumatlarım — özünə-xidmət ixrac + silmə (məxfilik hüquqları) */}
        <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">
          {t("settings.privacy")}
        </h2>
        <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-panel">
          <button
            onClick={exportData}
            disabled={exporting}
            className="flex w-full items-center justify-between gap-4 border-b border-line px-4 py-3.5 text-left last:border-b-0 disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <Download size={18} className="text-muted" />
              <div>
                <div className="font-bold text-fg">{t("settings.exportData")}</div>
                <div className="text-xs text-muted">{t("settings.exportDataHint")}</div>
              </div>
            </div>
          </button>

          <div className="px-4 py-3.5">
            <button
              onClick={() => setDeleteOpen((v) => !v)}
              className="flex w-full items-center gap-3 text-left"
            >
              <Trash2 size={18} className="text-red-500" />
              <div>
                <div className="font-bold text-red-500">{t("settings.deleteAccount")}</div>
                <div className="text-xs text-muted">{t("settings.deleteAccountHint")}</div>
              </div>
            </button>

            {deleteOpen && (
              <div className="mt-3 rounded-xl border-2 border-red-500/30 bg-red-500/5 p-3">
                <p className="text-sm font-semibold text-fg">
                  {t("settings.deleteAccountConfirm")} <span className="font-mono text-red-500">{DELETE_WORD}</span>
                </p>
                <input
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  className="mt-2 w-full rounded-lg border-2 border-line bg-panel px-3 py-2 text-sm font-bold text-fg outline-none focus:border-red-500"
                  placeholder={DELETE_WORD}
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setDeleteOpen(false); setDeleteText(""); }}
                    className="flex-1 rounded-lg border-2 border-line px-3 py-2 text-sm font-bold text-fg"
                  >
                    {t("settings.deleteAccountCancel")}
                  </button>
                  <button
                    onClick={deleteAccount}
                    disabled={deleteText !== DELETE_WORD || deleting}
                    className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
                  >
                    {t("settings.deleteAccountFinal")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
