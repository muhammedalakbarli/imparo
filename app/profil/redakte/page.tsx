"use client";

// Profili redaktə et — ad · istifadəçi adı · avatar.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { loadProfileRow, updateProfile, validUsername } from "@/lib/profileApi";
import { defaultAvatar, type AvatarConfig } from "@/components/Avatar";
import AvatarPicker from "@/components/AvatarPicker";
import { useT } from "@/lib/i18n";
import { PageSkeleton } from "@/components/Skeleton";

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

  async function save() {
    setErr("");
    if (username && !validUsername(username)) {
      setErr("hint");
      return;
    }
    setSaving(true);
    const r = await updateProfile({
      name: name.trim() || "İstifadəçi",
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

        <h1 className="mt-3 text-2xl font-bold text-fg">{t("profile.edit")}</h1>

        {/* Avatar */}
        <div className="mt-5 rounded-2xl border border-line bg-panel p-5">
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>

        {/* Ad */}
        <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-muted">
          {t("profile.name")}
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          className="mt-1.5 w-full rounded-2xl border-2 border-line bg-panel px-4 py-3 font-bold text-fg focus:border-brand focus:outline-none"
        />

        {/* Username */}
        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-muted">
          {t("profile.username")}
        </label>
        <div className="mt-1.5 flex items-center rounded-2xl border-2 border-line bg-panel px-4 focus-within:border-brand">
          <span className="font-bold text-muted">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            maxLength={20}
            placeholder="username"
            className="w-full bg-transparent py-3 pl-1 font-bold text-fg focus:outline-none"
          />
        </div>
        <p className={`mt-1.5 text-xs ${err ? "text-red-500" : "text-muted"}`}>
          {err === "taken"
            ? t("profile.usernameTaken")
            : t("profile.usernameHint")}
        </p>

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
