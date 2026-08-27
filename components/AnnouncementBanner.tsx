"use client";

// Aktiv admin elanını bütün istifadəçilərə banner kimi göstərir (bağlana bilər).
// Bağlanma seçimi localStorage-da elan id-si ilə saxlanılır.

import { useEffect, useState } from "react";
import { X, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Ann { id: string; title: string; body: string }

export default function AnnouncementBanner() {
  const [ann, setAnn] = useState<Ann | null>(null);

  useEffect(() => {
    let alive = true;
    createClient()
      .rpc("get_active_announcement")
      .then(({ data }) => {
        if (!alive || !data) return;
        const a = data as Ann;
        if (localStorage.getItem("imparo-ann-dismissed") === a.id) return;
        setAnn(a);
      });
    return () => { alive = false; };
  }, []);

  if (!ann) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-brand/30 bg-gradient-to-r from-brand to-brand-dark px-4 py-2.5 text-white">
      <div className="mx-auto flex max-w-5xl items-start gap-3">
        <Megaphone size={18} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1 text-sm">
          <span className="font-bold">{ann.title}</span>
          <span className="ml-2 text-white/90">{ann.body}</span>
        </div>
        <button
          aria-label="Bağla"
          onClick={() => { localStorage.setItem("imparo-ann-dismissed", ann.id); setAnn(null); }}
          className="shrink-0 rounded-lg p-0.5 text-white/80 hover:bg-white/15 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
