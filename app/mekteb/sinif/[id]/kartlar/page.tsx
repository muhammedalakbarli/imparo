"use client";

// Şagird giriş kartları — çap üçün (A4-də 8 kart). PDF: çap pəncərəsində "PDF kimi saxla".
// Kartda: sinif kodu, şagirdin adı, 4 rəqəmli PIN və QR. QR şagirdi seçilmiş halda
// giriş ekranına aparır; PIN QR-da YOXDUR (URL tarixçəyə/analitikaya düşür) — uşaq onu
// kartdan oxuyub yazır. Kart fiziki olaraq uşağa verilir, ona görə tam ad yazılır.

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuthUser } from "@/lib/useAuthUser";
import { classManagedStudents, teacherClasses, type ManagedStudent, type TeacherClass } from "@/lib/schools";
import { studentLoginUrl } from "@/lib/managedStudents";
import { gradeLabel } from "@/lib/grade";
import { SITE_URL } from "@/lib/site";
import Logo from "@/components/Logo";
import { PageSkeleton } from "@/components/Skeleton";

export default function CardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, ready } = useAuthUser();
  const [cls, setCls] = useState<TeacherClass | null | undefined>(undefined);
  const [list, setList] = useState<ManagedStudent[] | null>(null);

  useEffect(() => {
    if (!user) return;
    teacherClasses().then((cs) => setCls(cs.find((c) => c.id === id) ?? null));
    classManagedStudents(id).then(setList);
  }, [user, id]);

  if (!ready || cls === undefined || list === null) return <PageSkeleton />;
  if (!cls) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-center text-muted">
        Sinif tapılmadı. <Link href="/mekteb/muellim" className="font-bold text-brand">Siniflərim</Link>
      </main>
    );
  }

  return (
    <div className="force-light min-h-screen bg-white print:bg-white">
      {/* Alət zolağı — kağıza düşmür */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href={`/mekteb/sinif/${id}`} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft size={16} /> {cls.name}
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">PDF üçün: çap pəncərəsində “PDF kimi saxla”</span>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={list.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-[#e8622c] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              <Printer size={16} /> Çap et
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-6 print:max-w-none print:p-0">
        {list.length === 0 ? (
          <p className="text-center text-slate-500">
            Hələ şagird hesabı yoxdur. <Link href={`/mekteb/sinif/${id}`} className="font-bold text-[#e8622c]">Əlavə et</Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-3">
            {list.map((s) => (
              <article
                key={s.user_id}
                className="flex break-inside-avoid gap-4 rounded-2xl border-2 border-dashed border-slate-300 p-4 text-slate-900"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Logo size={22} />
                    <span className="text-sm font-extrabold text-[#e8622c]">Imparo</span>
                    <span className="text-xs text-slate-500">· sinif girişi</span>
                  </div>
                  <div className="mt-2 text-lg font-extrabold leading-tight">{s.full_name}</div>
                  <div className="text-xs text-slate-500">
                    {cls.name} · {gradeLabel(cls.grade)}
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-slate-500">Sinif kodu</dt>
                    <dd className="font-mono font-extrabold tracking-wider">{cls.code}</dd>
                    <dt className="text-slate-500">PIN</dt>
                    <dd className="font-mono text-xl font-extrabold tracking-[0.3em] text-[#e8622c]">{s.pin}</dd>
                  </dl>
                  <div className="mt-2 text-[11px] text-slate-500">imparo.app/sinif</div>
                </div>
                <div className="flex shrink-0 flex-col items-center justify-center">
                  <QRCodeSVG value={studentLoginUrl(SITE_URL, cls.code, s.ref)} size={104} level="M" />
                  <span className="mt-1 text-[10px] text-slate-500">Kamera ilə oxut</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
