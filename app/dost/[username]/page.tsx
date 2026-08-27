"use client";

// Dost dəvəti qəbulu — /dost/{username}. Dəvət edəni göstərir, "Dost əlavə et".

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Check, UserPlus } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { getPublicProfile, loadProfileRow, type PublicProfile } from "@/lib/profileApi";
import { followUser } from "@/lib/follows";
import { useT } from "@/lib/i18n";
import { PageSkeleton } from "@/components/Skeleton";
import Avatar from "@/components/Avatar";
import Logo from "@/components/Logo";

export default function FriendInvitePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const uname = decodeURIComponent(username);
  const { user, ready } = useAuthUser();
  const t = useT();
  const [inviter, setInviter] = useState<PublicProfile | null | undefined>(undefined);
  const [myId, setMyId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPublicProfile(uname).then(setInviter);
  }, [uname]);
  useEffect(() => {
    if (user) loadProfileRow().then((p) => setMyId(p?.id ?? null));
  }, [user]);

  if (!ready || inviter === undefined) return <PageSkeleton />;

  const isSelf = !!inviter && !!myId && inviter.id === myId;

  async function accept() {
    if (!inviter) return;
    setBusy(true);
    const ok = await followUser(inviter.id);
    setBusy(false);
    if (ok) setAdded(true);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-ink px-4 py-10">
      <Link href="/" className="flex items-center gap-2">
        <Logo size={28} />
        <span className="font-extrabold text-fg">Imparo</span>
      </Link>

      <div className="mt-8 w-full max-w-sm rounded-3xl border border-line bg-panel p-8 text-center">
        {inviter === null ? (
          <p className="font-bold text-fg">{t("profile.notFound")}</p>
        ) : (
          <>
            <div className="flex justify-center">
              <Avatar config={inviter.avatar} seed={inviter.username || inviter.id} size={92} />
            </div>
            <h1 className="mt-3 text-xl font-bold text-fg">{inviter.name}</h1>
            {inviter.username && (
              <p className="text-sm font-bold text-muted">@{inviter.username}</p>
            )}

            {!user ? (
              <>
                <p className="mt-4 text-muted">{t("friends.loginToAdd")}</p>
                <Link
                  href="/login"
                  className="mt-4 inline-block w-full rounded-2xl bg-brand px-5 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
                >
                  {t("friends.login")}
                </Link>
              </>
            ) : isSelf ? (
              <p className="mt-4 text-muted">{t("friends.ownLink")}</p>
            ) : added ? (
              <div className="mt-5">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-5 py-2.5 font-extrabold text-emerald-600">
                  <Check size={20} /> {t("follow.following")}
                </div>
                <Link
                  href="/profil"
                  className="mt-4 block w-full rounded-2xl border-2 border-line px-5 py-3 font-bold text-fg btn-pop btn-pop-ghost hover:border-brand"
                >
                  {t("friends.toProfile")}
                </Link>
              </div>
            ) : (
              <>
                <p className="mt-4 text-muted">
                  {t("friends.inviteText").replace("{n}", inviter.name)}
                </p>
                <button
                  type="button"
                  onClick={accept}
                  disabled={busy}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-50"
                >
                  <UserPlus size={20} /> {t("follow.follow")}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
