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
  compact = false,
}: {
  username: string | null;
  path?: string;
  labelKey?: string;
  /**
   * Kompakt: 2 sütunlu grid-in içində yan-yana düymə (Profil kimlik kartı).
   * Sarğı `display: contents` olur — düymə grid xanasına, QR paneli isə
   * tam enli ikinci sətrə (`col-span-2`) düşür.
   */
  compact?: boolean;
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
        className={`flex items-center justify-center gap-2 rounded-2xl border-2 border-line bg-panel font-bold text-fg btn-pop btn-pop-ghost hover:border-brand ${
          compact ? "px-3 py-2.5 text-sm" : "px-5 py-3"
        }`}
      >
        <Share2 size={18} /> {t(labelKey)}
      </Link>
    );
  }

  return (
    <div className={compact ? "contents" : undefined}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-brand font-bold text-white btn-pop hover:bg-brand-dark ${
          compact ? "gap-1.5 whitespace-nowrap px-2 py-2.5 text-[13px] sm:text-sm" : "px-5 py-3 uppercase tracking-wide"
        }`}
      >
        <Share2 size={compact ? 15 : 18} className="shrink-0" /> {t(labelKey)}
      </button>

      {open && (
        <div className={`rounded-2xl border-2 border-line bg-panel p-5 text-center ${compact ? "col-span-2" : "mt-3"}`}>
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
