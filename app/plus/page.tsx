"use client";

// Imparo Plus — premium abunə marketinq səhifəsi (Duolingo Super üslubu).
// Ödəniş inteqrasiyası hələ yoxdur; CTA marağı qeyd edir + "tezliklə".

import { useEffect, useState } from "react";
import { Heart, Gem, Sparkles, BarChart3, Crown, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { loadPlus } from "@/lib/plus";
import { useOptionalUser } from "@/lib/useOptionalUser";
import Mascot from "@/components/Mascot";
import ManualPayBox from "@/components/ManualPayBox";

// LemonSqueezy hosted checkout linkləri (.env-də təyin olunur; yoxdursa maraq qeyd edilir).
const CHECKOUT: Record<string, string | undefined> = {
  yearly: process.env.NEXT_PUBLIC_LS_CHECKOUT_YEARLY,
  monthly: process.env.NEXT_PUBLIC_LS_CHECKOUT_MONTHLY,
};

// YALNIZ HƏQİQƏTƏN MÖVCUD OLAN İMKANLAR SADALANIR.
// Əvvəl burada üç uydurma vəd var idi və bunlar PUL MÜQABİLİNDƏ satılırdı:
//   · "Zefi geyimləri / mağaza endirimləri" — geyim sistemi ümumiyyətlə yoxdur,
//     mağazada yalnız can doldurma və seriya qoruyucu var, Plus endirimi yoxdur;
//   · "Prioritet məzmun" — belə bir mexanizm heç yerdə yoxdur;
//   · "Valideyn hesabatı" — MÖVCUDDUR, amma HAMIYA PULSUZDUR (bax Ayarlar),
//     Plus üstünlüyü kimi göstərmək yanlış idi.
// Qalan ikisi koddan təsdiqləndi: limitsiz can (LessonRunner Plus-da loseHeart
// çağırmır) və 2× zümrüd (0037_complete_lesson.sql-də is_plus çarpanı).
const BENEFITS = [
  { Icon: Heart, title: "Limitsiz can", desc: "Səhv etməkdən qorxma — canlar bitmir." },
  { Icon: Gem, title: "2× zümrüd", desc: "Hər dərsdə iki qat çox zümrüd qazan." },
  { Icon: BarChart3, title: "Imparo-ya dəstək", desc: "Abunəliyin yeni dərslərin hazırlanmasına gedir." },
];

const PLANS = [
  { id: "yearly", name: "İllik", price: "23.99 ₼", per: "il", note: "33% qənaət", best: true, months: 12 },
  { id: "monthly", name: "Aylıq", price: "2.99 ₼", per: "ay", note: "", best: false, months: 1 },
];

export default function PlusPage() {
  const { user } = useOptionalUser();
  const [plan, setPlan] = useState("yearly");
  const [done, setDone] = useState(false);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  // Ödənişdən qayıdış: webhook bir neçə saniyə gec gələ bilər, ona görə gözləyirik.
  // Səhifə açılanda URL-dən oxunur: effekt içində setState çağırmaq lazım gəlmir
  // (React "cascading render" xəbərdarlığı) və ilk render dərhal düzgün olur.
  const [waiting, setWaiting] = useState(
    () => typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("paid") === "1",
  );

  useEffect(() => {
    loadPlus().then(setActive).catch(() => {});
  }, []);

  // LemonSqueezy uğurlu ödənişdən sonra `?paid=1` ilə geri qaytarır. Plus statusu
  // webhook-dan asılıdır (client heç nə yaza bilmir) — ona görə status aktiv olana
  // qədər qısa müddət yoxlanılır. Beləcə istifadəçi "ödədim, amma dəyişmədi" halında qalmır.
  useEffect(() => {
    if (!waiting) return;
    let stop = false;
    let tries = 0;
    const tick = async () => {
      if (stop) return;
      tries++;
      const on = await loadPlus().catch(() => false);
      if (on) { setActive(true); setWaiting(false); return; }
      if (tries >= 15) { setWaiting(false); return; }  // ~45 saniyə
      setTimeout(tick, 3000);
    };
    void tick();
    return () => { stop = true; };
    // `waiting` yalnız ilk dəyərdən asılıdır (aşağıda yalnız false-a keçir).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Checkout linki varsa → LemonSqueezy hosted checkout-a yönləndir (user_id + plan + email).
  // Yoxdursa (hələ konfiqurasiya edilməyib) → yalnız maraq qeyd olunur (pulsuz plus YOX).
  function subscribe() {
    if (busy) return;
    const url = CHECKOUT[plan];
    track("plus_checkout", { plan, configured: !!url });
    if (url && user) {
      setBusy(true);
      const sep = url.includes("?") ? "&" : "?";
      const params =
        `checkout[custom][user_id]=${encodeURIComponent(user.id)}` +
        `&checkout[custom][plan]=${plan}` +
        (user.email ? `&checkout[email]=${encodeURIComponent(user.email)}` : "");
      // Xarici LemonSqueezy checkout URL-i — router yox, tam keçid lazımdır.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `${url}${sep}${params}`;
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-8">
        {waiting && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <span className="text-sm font-bold text-fg">
              Ödənişin qəbul olundu — Plus aktivləşdirilir…
            </span>
          </div>
        )}

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-brand p-8 text-center text-white shadow-lg">
          <span className="twinkle pointer-events-none absolute left-8 top-8 text-white/60" aria-hidden>
            <Sparkles size={22} fill="currentColor" strokeWidth={0} />
          </span>
          <div className="flex justify-center">
            <Mascot size={100} mood="love" />
          </div>
          <div className="mt-3 inline-block rounded-full bg-white/25 px-4 py-1 text-sm font-extrabold uppercase tracking-wider">
            Imparo Plus
          </div>
          <h1 className="mt-3 text-3xl font-extrabold">Öyrənməni gücləndir</h1>
          <p className="mx-auto mt-2 max-w-sm text-white/90">
            Zefi ilə daha sürətli və daha çox mükafatla irəlilə.
          </p>
        </div>

        {/* Üstünlüklər */}
        <div className="mt-6 space-y-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-brand text-white shadow-sm">
                <b.Icon size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-fg">{b.title}</div>
                <div className="text-sm text-muted">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Planlar */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {PLANS.map((p) => {
            const on = plan === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                className={`relative rounded-2xl border-2 p-4 text-left transition ${
                  on ? "border-brand bg-brand/5" : "border-line bg-panel hover:border-brand/50"
                }`}
              >
                {p.best && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                    ən sərfəli
                  </span>
                )}
                <div className="font-extrabold text-fg">{p.name}</div>
                <div className="mt-1 text-2xl font-black text-brand">{p.price}</div>
                <div className="text-xs text-muted">/{p.per}</div>
                {p.note && <div className="mt-1 text-xs font-bold text-emerald-600">{p.note}</div>}
              </button>
            );
          })}
        </div>

        {/* CTA */}
        {active ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-400/15 to-brand/10 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-brand text-white">
              <Crown size={22} />
            </span>
            <div className="text-sm">
              <div className="font-extrabold text-fg">Sən artıq Plus üzvüsən 👑</div>
              <div className="text-muted">Limitsiz can və 2× zümrüd aktivdir.</div>
            </div>
          </div>
        ) : done ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Sparkles size={20} fill="currentColor" strokeWidth={0} />
            </span>
            <div className="text-sm">
              <div className="font-extrabold text-fg">Maraq qeyd olundu 🎉</div>
              <div className="text-muted">Ödəniş yaxında əlavə olunacaq — səni xəbərdar edəcəyik.</div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={subscribe}
            disabled={busy}
            className="mt-5 w-full rounded-2xl bg-brand py-4 text-lg font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-60"
          >
            Plus-a başla
          </button>
        )}
        <p className="mt-2 text-center text-xs text-muted">
          Plus yalnız ödənişdən sonra aktivləşir.
        </p>

        {/* Kart/m10 ilə ödəniş — kart ödənişi provayderi (LemonSqueezy) təsdiq
            gözlədiyi üçün əsas kanal budur. Rekvizit .env-də yoxdursa göstərilmir. */}
        {user && !active && (
          <ManualPayBox
            kind="plus"
            plan={plan}
            amountCents={plan === "yearly" ? 2399 : 299}
          />
        )}

        {/* Sponsorluq: özünə yox, BAŞQA şagirdə Plus almaq (0057).
            Ödəyə bilməyən şagird eyni səhifədən burs üçün müraciət edir. */}
        <Link
          href="/destek"
          className="mt-6 flex items-center gap-4 rounded-2xl border border-line bg-panel p-5 transition hover:bg-panel-2"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <HeartHandshake size={24} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold text-fg">Bir şagirdə hədiyyə et</span>
            <span className="block text-sm text-muted">
              Əlavə ödəyib imkanı olmayan şagirdə pulsuz Plus bağışla — və ya özün burs üçün müraciət et.
            </span>
          </span>
        </Link>
      </main>
    </div>
  );
}
