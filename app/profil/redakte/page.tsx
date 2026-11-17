"use client";

// Profili redaktə et — ad · istifadəçi adı · avatar.
//
// Sinif hesabında (müəllimin yaratdığı) ad kilidlidir: müəllimin siyahısında,
// liqada və giriş ekranında görünən addır, onu yalnız müəllim düzəldir.
// Avatar və istifadəçi adı uşağın özünündür. Server də adı qoruyur (0067).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AtSign, Lock, Palette, UserRound } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { loadProfileRow, updateProfile, validUsername } from "@/lib/profileApi";
import { isManagedAccount } from "@/lib/managedStudents";
import Avatar, { defaultAvatar, type AvatarConfig } from "@/components/Avatar";
import AvatarPicker from "@/components/AvatarPicker";
import { useT } from "@/lib/i18n";
import { PageSkeleton } from "@/components/Skeleton";

const CARD = "rounded-2xl border-2 border-line bg-card shadow-[0_4px_0_0_var(--color-line)]";
const INPUT_WRAP =
  "flex items-center gap-1 rounded-2xl border-2 border-line bg-panel px-4 transition-colors focus-within:border-brand";

export default function EditProfilePage() {
  const { user, ready } = useAuthUser();
  const router = useRouter();
  const t = useT();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<"" | "hint" | "taken">("");

  useEffect(() => {
    loadProfileRow().then((p) => {
      if (p) {
        setName(p.name);
        setUsername(p.username ?? "");
        setAvatar(p.avatar ?? defaultAvatar(p.username || p.name || "?"));
      }
      setLoaded(true);
    });
  }, []);

  if (!ready || !user || !loaded || !avatar) return <PageSkeleton />;

  const managed = isManagedAccount(user);

  async function save() {
    setErr("");
    if (username && !validUsername(username)) {
      setErr("hint");
      return;
    }
    setSaving(true);
    const r = await updateProfile({
      // Sinif hesabı adı göndərmir — updateProfile mövcud adı saxlayır.
      name: managed ? undefined : name.trim() || "İstifadəçi",
      username: username || undefined,
      avatar: avatar ?? undefined,
    });
    setSaving(false);
    if (!r.ok) {
      setErr(r.error === "username_taken" ? "taken" : "hint");
      return;
    }
    router.push("/profil");
  }

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-lg px-4 py-6">
        <Link
          href="/profil"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-fg"
        >
          <ArrowLeft size={18} /> {t("profile.back")}
        </Link>

        <h1 className="mt-3 text-2xl font-extrabold text-fg">{t("profile.edit")}</h1>

        {/* Avatar — banner + böyük önizləmə, altında seçici */}
        <div className={`mt-5 overflow-hidden ${CARD}`}>
          <div className="relative h-20 bg-gradient-to-r from-teal-300/45 via-amber-200/50 to-orange-300/55">
            <span className="absolute left-4 top-3 inline-flex items-center gap-1.5 rounded-full bg-card/85 px-2.5 py-1 text-xs font-extrabold text-fg">
              <Palette size={13} className="text-brand" /> {t("profile.avatar")}
            </span>
          </div>
          <div className="relative -mt-12 flex justify-center">
            <span className="rounded-[1.35rem] bg-card ring-4 ring-card">
              <Avatar config={avatar} size={88} />
            </span>
          </div>
          <div className="p-5 pt-3">
            <AvatarPicker value={avatar} onChange={setAvatar} preview={false} />
          </div>
        </div>

        {/* Ad + istifadəçi adı */}
        <div className={`mt-5 space-y-4 p-5 ${CARD}`}>
          <div>
            <label htmlFor="pf-name" className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-muted">
              <UserRound size={14} /> {t("profile.name")}
            </label>
            {managed ? (
              <>
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border-2 border-line bg-panel-2 px-4 py-3">
                  <span id="pf-name" className="min-w-0 flex-1 truncate font-bold text-fg">
                    {name}
                  </span>
                  <Lock size={16} className="shrink-0 text-muted" aria-hidden />
                </div>
                <p className="mt-1.5 text-xs text-muted">{t("profile.nameLocked")}</p>
              </>
            ) : (
              <div className={`mt-1.5 ${INPUT_WRAP}`}>
                <input
                  id="pf-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  className="w-full bg-transparent py-3 font-bold text-fg focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="pf-username" className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-muted">
              <AtSign size={14} /> {t("profile.username")}
            </label>
            <div className={`mt-1.5 ${INPUT_WRAP}`}>
              <span className="font-bold text-muted">@</span>
              <input
                id="pf-username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={20}
                placeholder="username"
                className="w-full bg-transparent py-3 font-bold text-fg focus:outline-none"
              />
            </div>
            <p className={`mt-1.5 text-xs ${err ? "font-bold text-red-500" : "text-muted"}`}>
              {err === "taken" ? t("profile.usernameTaken") : t("profile.usernameHint")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-brand px-5 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-50"
        >
          {t("profile.save")}
        </button>
      </main>
    </div>
  );
}
