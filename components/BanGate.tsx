"use client";

// Banlı hesab üçün tam ekran blok.
//
// Niyə lazımdır: ban server tərəfdə `complete_lesson` içində tətbiq olunur (0043) —
// yəni blok olmasa, banlı şagird dərsi normal keçir, sonda isə anlaşılmaz RPC xətası
// alırdı. Bu komponent vəziyyəti girişdə bir dəfə soruşur və səbəbi ilə birlikdə
// aydın ekran göstərir.

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useOptionalUser } from "@/lib/useOptionalUser";
import { myBanStatus, isForever, type BanStatus } from "@/lib/adminApi";
import { signOut } from "@/lib/auth";

function untilLabel(ts: string | null): string {
  if (!ts || isForever(ts)) return "həmişəlik";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "həmişəlik";
  return d.toLocaleString("az-AZ", { dateStyle: "long", timeStyle: "short" });
}

export default function BanGate() {
  const { user } = useOptionalUser();
  const [ban, setBan] = useState<BanStatus | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    myBanStatus().then((s) => { if (alive) setBan(s); }).catch(() => {});
    return () => { alive = false; };
  }, [user]);

  // Çıxış edilibsə köhnə vəziyyət göstərilməsin (user null → blok yoxdur).
  if (!user || !ban?.banned) return null;

  const forever = isForever(ban.until);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[16px] border border-line bg-panel p-6 text-center shadow-2xl">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <ShieldAlert size={28} />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-fg">Hesabın bloklanıb</h1>
        <p className="mt-2 text-sm text-muted">
          {forever
            ? "Bu hesab qaydaların pozulduğuna görə həmişəlik bloklanıb."
            : `Blok ${untilLabel(ban.until)} tarixinə qədər davam edir.`}
        </p>
        {ban.reason && (
          <p className="mt-3 rounded-[10px] bg-panel-2 px-3.5 py-2.5 text-sm text-fg">
            <span className="font-bold">Səbəb:</span> {ban.reason}
          </p>
        )}
        <p className="mt-3 text-xs text-muted">
          Səhv olduğunu düşünürsənsə,{" "}
          <a href="mailto:destek@imparo.app" className="font-semibold text-brand hover:underline">
            destek@imparo.app
          </a>{" "}
          ünvanına yaz.
        </p>
        <button
          onClick={() => signOut()}
          className="mt-5 w-full rounded-[12px] border border-line px-4 py-2.5 font-bold text-fg transition-colors hover:border-brand"
        >
          Çıxış et
        </button>
      </div>
    </div>
  );
}
