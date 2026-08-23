// Valideyn hesabatı — tokenlə açılan, YALNIZ OXUNAN səhifə.
//
// Sessiya tələb olunmur: valideynin Imparo hesabı yoxdur. Token 128 bitlikdir.
// Səhifə indeksləşdirilmir (robots.ts + aşağıdakı metadata) — uşaq datasıdır.
//
// Server komponentdir: məlumat `parent_report_data` funksiyasından service_role
// ilə gəlir. Həmin funksiya `authenticated` rola VERİLMƏYİB, yəni bu səhifədən
// başqa yolla ona çatmaq olmur.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import {
  accuracy,
  formatDuration,
  formatRange,
  hasActivity,
  type ReportData,
} from "@/lib/parentReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Həftəlik hesabat",
  robots: { index: false, follow: false },
};

const DAY = 24 * 60 * 60 * 1000;

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ d?: string; tesdiq?: string }>;
}) {
  const { token } = await params;
  const { d, tesdiq } = await searchParams;
  const days = d === "30" ? 30 : 7;

  const admin = await adminClient();
  const { data: row } = await admin
    .from("parent_reports")
    .select("user_id, unsub_token")
    .eq("view_token", token)
    .maybeSingle();

  if (!row) notFound();

  // Bakı vaxtı ilə bu gün 00:00-a qədər (bugünkü yarımçıq gün daxil edilmir ki,
  // valideyn günorta baxanda "bu gün az məşq edib" kimi yanlış təəssürat almasın).
  const nowBaku = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Baku" }));
  nowBaku.setHours(0, 0, 0, 0);
  const to = new Date(nowBaku.getTime() - 4 * 60 * 60 * 1000);
  const from = new Date(to.getTime() - days * DAY);

  const { data } = await admin.rpc("parent_report_data", {
    p_user_id: row.user_id,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });

  const r = data as ReportData | null;
  if (!r) notFound();

  const name = r.child?.trim() || "Uşağınız";
  const acc = accuracy(r);
  const active = hasActivity(r);

  return (
    <main className="force-light min-h-screen bg-ink">
      <header className="border-b border-line/60">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <span className="text-lg font-extrabold text-brand">Imparo</span>
          <span className="text-xs font-bold text-muted">Valideyn hesabatı</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-10">
        {tesdiq === "1" && (
          <div className="mb-6 rounded-2xl border border-brand/30 bg-brand/10 px-5 py-4 text-sm font-bold text-fg">
            ✓ Təsdiqləndi. Bundan sonra hər bazar günü həftəlik hesabat bu ünvana gələcək.
          </div>
        )}

        <h1 className="text-3xl font-extrabold text-fg sm:text-4xl">{name}</h1>
        <p className="mt-1 text-sm text-muted">
          {formatRange(r.from, r.to)}
          {r.grade ? ` · ${r.grade}-ci sinif` : ""}
        </p>

        <div className="mt-5 flex gap-2">
          {[7, 30].map((n) => (
            <a
              key={n}
              href={`?d=${n}`}
              className={`rounded-xl px-4 py-2 text-sm font-extrabold transition-colors ${
                days === n ? "bg-brand text-white" : "border border-line text-muted hover:text-fg"
              }`}
            >
              {n} gün
            </a>
          ))}
        </div>

        {!active ? (
          <p className="mt-8 rounded-3xl border border-line bg-panel px-6 py-8 text-center leading-relaxed text-muted">
            Bu dövrdə {name} Imparo-da məşq etmədi. Bir dərs cəmi 5–10 dəqiqə çəkir.
          </p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <Stat value={formatDuration(r.seconds)} label="məşq vaxtı" />
              <Stat value={String(r.lessons)} label="dərs" />
              <Stat value={String(r.tasks)} label="tapşırıq" />
            </div>

            <p className="mt-6 leading-relaxed text-muted">
              <b className="text-fg">{r.activeDays} gün</b> məşq etdi, tapşırıqların{" "}
              <b className="text-fg">{acc}%</b>-ini düzgün həll etdi.
              {r.streak > 0 && (
                <>
                  {" "}
                  Hazırkı seriya: <b className="text-fg">{r.streak} gün</b>.
                </>
              )}
            </p>

            {r.subjects.length > 0 && (
              <>
                <h2 className="mt-10 text-xl font-extrabold text-fg">Fənlər üzrə</h2>
                <div className="mt-4 space-y-4">
                  {r.subjects.map((s) => (
                    <div key={s.name}>
                      <div className="flex items-baseline justify-between">
                        <span className="font-extrabold text-fg">{s.name}</span>
                        <span className="text-sm font-bold text-muted">
                          {s.pct}% · {s.tasks} tapşırıq
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {(r.improved || r.weakest) && (
              <div className="mt-10 space-y-3">
                {r.improved && (
                  <Note icon="📈" title="Ən böyük inkişaf">
                    {r.improved.subject} — əvvəlki dövrə görə +{r.improved.delta} faiz bənd.
                  </Note>
                )}
                {r.weakest && (
                  <Note icon="🎯" title="Diqqət tələb edir">
                    {r.weakest.unit} — bu mövzuda düzgün cavab nisbəti {r.weakest.pct}%.
                  </Note>
                )}
              </div>
            )}
          </>
        )}

        <p className="mt-12 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          Bu səhifəni yalnız linki olan şəxs görə bilir.{" "}
          <a
            href={`/api/parent/unsubscribe?token=${row.unsub_token}`}
            className="font-bold underline"
          >
            Həftəlik məktubları dayandır
          </a>
          .
        </p>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-3 py-5 text-center">
      <div className="text-xl font-extrabold text-brand sm:text-2xl">{value}</div>
      <div className="mt-1 text-xs font-bold text-muted">{label}</div>
    </div>
  );
}

function Note({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-5 py-4">
      <div className="text-sm font-extrabold text-fg">
        {icon} {title}
      </div>
      <div className="mt-1 text-sm leading-relaxed text-muted">{children}</div>
    </div>
  );
}
