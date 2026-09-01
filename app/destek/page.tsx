"use client";

// Dəstək — sponsorluq və burs səhifəsi (migration 0057).
//
// Səhifənin iki üzü var və bu, qəsdəndir:
//   YUXARI — ŞƏFFAFLIQ: neçə sponsor, neçə yer, neçə şagird pulsuz oxuyur.
//     "Pulum hara getdi?" sualına rəqəmlə cavab verilmirsə, bu model işləmir.
//   AŞAĞI — MÜRACİƏT: ehtiyacı olan şagird bir formla burs istəyə bilir.
//
// Statistika girişsiz də görünür (aqreqatdır, şəxsi məlumat yoxdur) — səhifə
// paylaşıla bilən olmalıdır.

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeartHandshake, Users, GraduationCap, Gift, Check, Clock } from "lucide-react";
import { useOptionalUser } from "@/lib/useOptionalUser";
import {
  sponsorStats, myScholarship, requestScholarship,
  type SponsorStats, type MyScholarship,
} from "@/lib/sponsor";
import Mascot from "@/components/Mascot";
import ManualPayBox from "@/components/ManualPayBox";
import { track } from "@/lib/analytics";

// Sponsorluq məhsulunun checkout linki (.env). Yoxdursa maraq qeyd olunur —
// uydurma "ödəniş" düyməsi göstərilmir.
const SPONSOR_CHECKOUT = process.env.NEXT_PUBLIC_LS_CHECKOUT_SPONSOR;

/** Bir yer = bir illik Plus (23.99 ₼ = 2399 qəpik). Webhook-dakı dəyərlə eyni olmalıdır. */
const SEAT_PRICE_CENTS = 2399;

const SEAT_OPTIONS = [
  { seats: 1, label: "1 şagird", note: "23.99 ₼ · bir il pulsuz" },
  { seats: 3, label: "3 şagird", note: "71.97 ₼ · bir sinif qrupu" },
  { seats: 10, label: "10 şagird", note: "239.90 ₼ · bütöv bir sinif" },
];

export default function SupportPage() {
  const { user } = useOptionalUser();
  const [stats, setStats] = useState<SponsorStats | null>(null);
  const [mine, setMine] = useState<MyScholarship | null>(null);
  const [seats, setSeats] = useState(1);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  // Sponsorluq ödənişindən qayıdış: webhook havuza yeri bir neçə saniyəyə yazır.
  const [waiting, setWaiting] = useState(
    () => typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("paid") === "1",
  );

  useEffect(() => { sponsorStats().then(setStats); }, []);

  // Ödəniş gələnə qədər statistikanı təzələ (maksimum ~45 saniyə).
  useEffect(() => {
    if (!waiting) return;
    let stop = false;
    let tries = 0;
    const base = stats?.seats_funded ?? -1;
    const tick = async () => {
      if (stop) return;
      tries++;
      const s = await sponsorStats();
      if (s && s.seats_funded !== base) { setStats(s); setWaiting(false); return; }
      if (tries >= 15) { setWaiting(false); return; }
      setTimeout(tick, 3000);
    };
    void tick();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (user) myScholarship().then(setMine); }, [user]);

  function sponsor() {
    track("sponsor_checkout", { seats, configured: !!SPONSOR_CHECKOUT });
    if (!SPONSOR_CHECKOUT || !user) return;
    const sep = SPONSOR_CHECKOUT.includes("?") ? "&" : "?";
    // `custom_price` qəpiklə göndərilir (LS "pay what you want" məhsulu üçün):
    // seçilən yer sayı × bir illik Plus qiyməti. Webhook yer sayını yenidən
    // ÖDƏNİLƏN məbləğdən hesablayır — yəni bu parametr dəyişdirilsə də uyğunsuzluq yaranmır.
    const params =
      `checkout[custom][user_id]=${encodeURIComponent(user.id)}` +
      `&checkout[custom][plan]=sponsor&checkout[custom][seats]=${seats}` +
      `&checkout[custom_price]=${seats * SEAT_PRICE_CENTS}` +
      (user.email ? `&checkout[email]=${encodeURIComponent(user.email)}` : "");
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `${SPONSOR_CHECKOUT}${sep}${params}`;
  }

  async function apply() {
    if (busy) return;
    setBusy(true);
    try {
      await requestScholarship(reason.trim());
      setSent(true);
      setMine(await myScholarship());
    } catch {
      // RPC xətası — istifadəçiyə səhv ümid vermirik
    } finally {
      setBusy(false);
    }
  }

  const available = stats?.seats_available ?? 0;

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-8">
        {waiting && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <span className="text-sm font-bold text-fg">Ödənişin qəbul olundu — havuza yazılır…</span>
          </div>
        )}

        {/* Hero */}
        <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-brand p-6 text-white shadow-lg">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm">
            <Mascot size={64} mood="love" disk={false} />
          </span>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/85">
              <HeartHandshake size={14} /> Birlikdə
            </div>
            <h1 className="mt-1 text-2xl font-extrabold">Bir şagirdin təhsilini hədiyyə et</h1>
            <p className="mt-1 text-sm text-white/90">
              Ödədiyin hər yer — imkanı olmayan bir şagirdin bir illik pulsuz Imparo Plus-ı deməkdir.
            </p>
          </div>
        </div>

        {/* Şəffaflıq */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat Icon={Users} value={stats?.sponsors ?? 0} label="Sponsor" />
          <Stat Icon={Gift} value={stats?.seats_funded ?? 0} label="Bağışlanan yer" />
          <Stat Icon={GraduationCap} value={stats?.students_helped ?? 0} label="Pulsuz oxuyan" />
        </div>
        <p className="mt-2 text-center text-xs text-muted">
          Hazırda <span className="font-bold text-fg">{available}</span> boş yer var — bu rəqəm real
          ödənişlərdən və verilmiş burslardan avtomatik hesablanır.
        </p>

        {/* Sponsor ol */}
        <section className="mt-6 rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-lg font-extrabold text-fg">Sponsor ol</h2>
          <p className="mt-1 text-sm text-muted">
            Neçə şagirdə dəstək olmaq istədiyini seç. Ödəniş birdəfəlikdir, abunə deyil.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {SEAT_OPTIONS.map((o) => (
              <button
                key={o.seats}
                onClick={() => setSeats(o.seats)}
                className={`rounded-2xl border-2 p-3 text-left transition ${
                  seats === o.seats ? "border-brand bg-brand/5" : "border-line hover:border-brand/40"
                }`}
              >
                <div className="font-extrabold text-fg">{o.label}</div>
                <div className="text-xs text-muted">{o.note}</div>
              </button>
            ))}
          </div>

          {user ? (
            <button
              onClick={sponsor}
              className="mt-4 w-full rounded-2xl bg-brand py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
            >
              {SPONSOR_CHECKOUT ? `${seats} şagirdə dəstək ol` : "Maraqlanıram"}
            </button>
          ) : (
            <Link
              href="/login"
              className="mt-4 block rounded-2xl bg-brand py-3 text-center font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
            >
              Sponsor olmaq üçün daxil ol
            </Link>
          )}

          {!SPONSOR_CHECKOUT && (
            <p className="mt-2 text-center text-xs text-muted">
              Ödəniş kanalı hazırlanır — marağın qeyd olundu, hazır olanda xəbər veriləcək.
            </p>
          )}

          {/* Kart/m10 ilə birbaşa köçürmə (0059) */}
          {user && (
            <ManualPayBox
              kind="sponsor"
              plan="sponsor"
              amountCents={seats * SEAT_PRICE_CENTS}
              title="Kartla və ya m10 ilə dəstək ol"
              onDone={() => sponsorStats().then(setStats)}
            />
          )}
        </section>

        {/* Burs müraciəti */}
        <section className="mt-4 rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-lg font-extrabold text-fg">İmkanın yoxdursa</h2>
          <p className="mt-1 text-sm text-muted">
            Plus abunəsini ödəyə bilmirsənsə, burs üçün müraciət et. Müraciətlər əl ilə yoxlanılır,
            heç bir kart məlumatı tələb olunmur.
          </p>

          {!user ? (
            <Link
              href="/login"
              className="mt-3 inline-block rounded-2xl border-2 border-line px-5 py-2.5 font-bold text-fg hover:border-brand"
            >
              Müraciət üçün daxil ol
            </Link>
          ) : mine?.status === "approved" ? (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 font-bold text-emerald-600">
              <Check size={18} /> Bursun təsdiqlənib — Plus hesabında aktivdir.
            </div>
          ) : mine?.status === "pending" || sent ? (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 font-bold text-amber-600">
              <Clock size={18} /> Müraciətin növbədədir. Cavab hesabında görünəcək.
            </div>
          ) : (
            <>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Bir neçə cümlə ilə vəziyyətini yaz (məcburi deyil)."
                className="mt-3 w-full resize-none rounded-2xl border-2 border-line bg-ink px-4 py-3 text-fg outline-none focus:border-brand"
              />
              <button
                onClick={apply}
                disabled={busy}
                className="mt-2 w-full rounded-2xl border-2 border-brand py-3 font-extrabold uppercase tracking-wide text-brand transition hover:bg-brand/5 disabled:opacity-50"
              >
                {busy ? "Göndərilir…" : "Burs üçün müraciət et"}
              </button>
              {mine?.status === "rejected" && (
                <p className="mt-2 text-xs text-muted">
                  Əvvəlki müraciətin rədd edilmişdi — yenidən müraciət edə bilərsən.
                </p>
              )}
            </>
          )}

          <p className="mt-3 text-xs text-muted">
            Müəlliminsə: sinif səhifəsindən şagirdinə zəmanət verə bilərsən — belə müraciətlər
            növbədə öndə olur.
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-muted">
          Sponsorluq haqqında sualın var? <Link href="/yardim" className="font-bold text-brand hover:underline">Yardım</Link>
        </p>
      </main>
    </div>
  );
}

function Stat({
  Icon, value, label,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4 text-center">
      <Icon size={20} className="mx-auto text-brand" />
      <div className="mt-1 text-xl font-extrabold text-fg">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}
