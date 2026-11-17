"use client";

// Ayarlar → Tərcihlər: dərs təcrübəsi (səs, animasiya, motivasiya, dinləmə) +
// görünüş (tünd rejim) + dil (interfeys dili).
//
// Sinif hesabı (müəllimin yaratdığı, sinif kodu + PIN ilə girən şagird): sinfi və
// hesabı silməyi müəllim idarə edir — burada kilidlidir. Server də eyni qaydanı
// tətbiq edir (migration 0067), bu ekran yalnız uşağı çaşdırmamaq üçündür.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Download,
  GraduationCap,
  Headphones,
  Languages,
  Lock,
  Moon,
  PartyPopper,
  Settings,
  Sparkles,
  Trash2,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { createClient } from "@/lib/supabase/client";
import { userGrade, GRADES_WITH_CONTENT, gradeOrdinal } from "@/lib/grade";
import { isManagedAccount } from "@/lib/managedStudents";
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

const CARD = "rounded-2xl border-2 border-line bg-card shadow-[0_4px_0_0_var(--color-line)]";
const SELECT =
  "max-w-[46%] shrink-0 rounded-xl border-2 border-line bg-panel px-3 py-2 text-sm font-bold text-fg outline-none focus:border-brand sm:max-w-none";

const LESSON_ROWS: { key: keyof Prefs; labelKey: string; hintKey: string; Icon: LucideIcon; tile: string }[] = [
  { key: "sound", labelKey: "settings.sound", hintKey: "settings.soundHint", Icon: Volume2, tile: "bg-brand/12 text-brand" },
  {
    key: "animations",
    labelKey: "settings.animations",
    hintKey: "settings.animationsHint",
    Icon: Sparkles,
    tile: "bg-violet-500/12 text-violet-600 dark:text-violet-300",
  },
  {
    key: "motivational",
    labelKey: "settings.motivational",
    hintKey: "settings.motivationalHint",
    Icon: PartyPopper,
    tile: "bg-amber-400/15 text-amber-600 dark:text-amber-300",
  },
  {
    key: "listening",
    labelKey: "settings.listening",
    hintKey: "settings.listeningHint",
    Icon: Headphones,
    tile: "bg-sky-500/12 text-sky-600 dark:text-sky-300",
  },
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
  const [deleteErr, setDeleteErr] = useState(false);
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

  const managed = isManagedAccount(user);
  const grade = userGrade(user);
  const gradeText = (g: number) =>
    t("settings.gradeOption").replace("{n}", String(g)).replace("{ord}", gradeOrdinal(g));

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
  // RPC xəta qaytarsa (şəbəkə, sinif hesabı — 0067) çıxış ETMİRİK: əks halda istifadəçi
  // hesabın silindiyini düşünərdi, amma hesab yerində qalardı.
  async function deleteAccount() {
    if (managed || deleteText !== DELETE_WORD || deleting) return;
    setDeleting(true);
    setDeleteErr(false);
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_own_account").then(
      (r) => r,
      () => ({ error: true }),
    );
    if (error) {
      setDeleting(false);
      setDeleteErr(true);
      return;
    }
    await supabase.auth.signOut();
    router.replace("/");
  }

  // Sinif dəyişdir — user_metadata.grade yenilə və yeni sinfin proqramına keç.
  async function setGrade(value: number) {
    if (managed) return;
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { grade: value } });
    // Sinif dəyişəndə bütün proqram/məzmun yenidən yüklənməlidir — tam keçid qəsdəndir.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-500/12 text-slate-500 dark:text-slate-300">
            <Settings size={24} strokeWidth={2.3} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-fg">{t("settings.title")}</h1>
            <p className="text-sm text-muted">{t("settings.subtitle")}</p>
          </div>
        </div>

        {/* Dərs təcrübəsi */}
        <SectionTitle>{t("settings.lessonExp")}</SectionTitle>
        <div className={`overflow-hidden ${CARD}`}>
          {LESSON_ROWS.map((row, i) => (
            <Row
              key={row.key}
              Icon={row.Icon}
              tile={row.tile}
              label={t(row.labelKey)}
              hint={t(row.hintKey)}
              last={i === LESSON_ROWS.length - 1}
            >
              <Toggle checked={prefs[row.key] as boolean} onChange={(v) => setToggle(row.key, v)} />
            </Row>
          ))}
        </div>

        {/* Bildirişlər (re-engagement push) */}
        <SectionTitle>{t("settings.notifSection")}</SectionTitle>
        <div className={`overflow-hidden ${CARD}`}>
          <Row
            Icon={Bell}
            tile="bg-rose-500/12 text-rose-500 dark:text-rose-300"
            label={t("settings.notifications")}
            hint={pushSupported() ? t("settings.notificationsHint") : t("settings.notifUnsupported")}
            extra={pushMsg ? <div className="mt-1 text-xs font-semibold text-red-500">{pushMsg}</div> : null}
            last
          >
            <Toggle
              checked={pushOn}
              disabled={pushBusy || !pushSupported() || pushPermission() === "denied"}
              onChange={togglePush}
            />
          </Row>
        </div>

        {/* Sinif — sinif hesabında müəllim təyin edir (kilidli) */}
        <SectionTitle>{t("settings.gradeSection")}</SectionTitle>
        <div className={`overflow-hidden ${CARD}`}>
          <Row
            Icon={GraduationCap}
            tile="bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"
            label={t("settings.grade")}
            hint={managed ? t("settings.gradeLocked") : t("settings.gradeHint")}
            last
          >
            {managed ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-panel-2 px-3 py-2 text-sm font-bold text-fg">
                <Lock size={14} className="text-muted" /> {gradeText(grade)}
              </span>
            ) : (
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                aria-label={t("settings.grade")}
                className={SELECT}
              >
                {GRADES_WITH_CONTENT.map((g) => (
                  <option key={g} value={g}>
                    {gradeText(g)}
                  </option>
                ))}
              </select>
            )}
          </Row>
        </div>

        {/* Görünüş */}
        <SectionTitle>{t("settings.appearance")}</SectionTitle>
        <div className={`overflow-hidden ${CARD}`}>
          <Row
            Icon={Moon}
            tile="bg-indigo-500/12 text-indigo-600 dark:text-indigo-300"
            label={t("settings.dark")}
            hint={t("settings.darkHint")}
            last
          >
            <select
              value={prefs.darkMode}
              onChange={(e) => setDark(e.target.value as DarkMode)}
              aria-label={t("settings.dark")}
              className={SELECT}
            >
              <option value="system">{t("settings.system")}</option>
              <option value="light">{t("settings.light")}</option>
              <option value="dark">{t("settings.darkOpt")}</option>
            </select>
          </Row>
        </div>

        {/* Dil */}
        <SectionTitle>{t("settings.language")}</SectionTitle>
        <div className={`overflow-hidden ${CARD}`}>
          <Row
            Icon={Languages}
            tile="bg-teal-500/12 text-teal-600 dark:text-teal-300"
            label={t("settings.language")}
            hint={t("settings.languageHint")}
            last
          >
            <select
              value={prefs.lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label={t("settings.language")}
              className={SELECT}
            >
              {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
                <option key={l} value={l}>
                  {LANG_NAMES[l]}
                </option>
              ))}
            </select>
          </Row>
        </div>

        <ParentReportCard />

        {/* Məlumatlarım — özünə-xidmət ixrac + silmə (məxfilik hüquqları) */}
        <SectionTitle>{t("settings.privacy")}</SectionTitle>
        <div className={`overflow-hidden ${CARD}`}>
          <button
            type="button"
            onClick={exportData}
            disabled={exporting}
            className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left transition hover:bg-panel disabled:opacity-60"
          >
            <Tile Icon={Download} tile="bg-sky-500/12 text-sky-600 dark:text-sky-300" />
            <div className="min-w-0">
              <div className="font-bold text-fg">{t("settings.exportData")}</div>
              <div className="text-xs text-muted">{t("settings.exportDataHint")}</div>
            </div>
          </button>

          {managed ? (
            <Row
              Icon={Lock}
              tile="bg-slate-500/12 text-slate-500 dark:text-slate-300"
              label={t("settings.managedTitle")}
              hint={t("settings.managedHint")}
              last
            />
          ) : (
            <div className="px-4 py-3.5">
              <button
                type="button"
                onClick={() => setDeleteOpen((v) => !v)}
                aria-expanded={deleteOpen}
                className="flex w-full items-center gap-3 text-left"
              >
                <Tile Icon={Trash2} tile="bg-red-500/12 text-red-500" />
                <div className="min-w-0">
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
                  {deleteErr && <p className="mt-2 text-xs font-bold text-red-500">{t("settings.deleteAccountErr")}</p>}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteOpen(false);
                        setDeleteText("");
                        setDeleteErr(false);
                      }}
                      className="flex-1 rounded-xl border-2 border-line bg-card px-3 py-2 text-sm font-bold text-fg btn-pop btn-pop-ghost"
                    >
                      {t("settings.deleteAccountCancel")}
                    </button>
                    <button
                      type="button"
                      onClick={deleteAccount}
                      disabled={deleteText !== DELETE_WORD || deleting}
                      className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white btn-pop [--pop:#b91c1c] disabled:opacity-40"
                    >
                      {t("settings.deleteAccountFinal")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-7 px-1 text-xs font-extrabold uppercase tracking-wide text-muted">{children}</h2>;
}

function Tile({ Icon, tile }: { Icon: LucideIcon; tile: string }) {
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tile}`}>
      <Icon size={20} strokeWidth={2.3} />
    </span>
  );
}

function Row({
  Icon,
  tile,
  label,
  hint,
  extra,
  last = false,
  children,
}: {
  Icon: LucideIcon;
  tile: string;
  label: string;
  hint?: string;
  extra?: React.ReactNode;
  last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${last ? "" : "border-b border-line"}`}>
      <Tile Icon={Icon} tile={tile} />
      <div className="min-w-0 flex-1">
        <div className="font-bold text-fg">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
        {extra}
      </div>
      {children}
    </div>
  );
}
