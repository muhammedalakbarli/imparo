"use client";

// Profili paylaş — link kopyala + QR kod. Username yoxdursa təyin etməyə yönləndirir.

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Copy, Check } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function ShareProfile({
  username,
  path = "u",
  labelKey = "profile.share",
}: {
  username: string | null;
  path?: string;
  labelKey?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url =
    username && typeof window !== "undefined"
      ? `${window.location.origin}/${path}/${username}`
      : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ötür */
    }
  }

  async function nativeShare() {
    try {
      if (navigator.share) await navigator.share({ url, title: "Imparo" });
      else copy();
    } catch {
      /* ötür */
    }
  }

  if (!username) {
    return (
      <Link
        href="/profil/redakte"
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-line bg-panel px-5 py-3 font-bold text-fg btn-pop btn-pop-ghost hover:border-brand"
      >
        <Share2 size={18} /> {t(labelKey)}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 font-bold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
      >
        <Share2 size={18} /> {t(labelKey)}
      </button>

      {open && (
        <div className="mt-3 rounded-2xl border-2 border-line bg-panel p-5 text-center">
          <div className="flex justify-center rounded-2xl bg-white p-3">
            <QRCodeSVG value={url} size={148} bgColor="#ffffff" fgColor="#1c1a30" level="M" />
          </div>
          <div className="mt-3 truncate rounded-xl bg-panel-2 px-3 py-2 text-sm text-muted">
            {url}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-2.5 font-bold text-white btn-pop hover:bg-brand-dark"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? t("profile.copied") : t("profile.copyLink")}
            </button>
            <button
              type="button"
              onClick={nativeShare}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-line px-4 py-2.5 font-bold text-fg btn-pop btn-pop-ghost hover:border-brand"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
