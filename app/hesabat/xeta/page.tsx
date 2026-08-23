import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Link işləmir", robots: { index: false } };

// Təsdiq/hesabat linki köhnəldikdə düşülən səhifə. Səbəbi QƏSDƏN ümumi yazılıb:
// "artıq təsdiqlənib" ilə "belə token yoxdur" fərqləndirilsəydi, token yoxlaması
// ilə mövcud abunələri sadalamaq mümkün olardı.
export default function ReportErrorPage() {
  return (
    <main className="force-light flex min-h-screen items-center justify-center bg-ink px-5">
      <div className="w-full max-w-md rounded-3xl border border-line bg-panel p-8 text-center">
        <div className="text-4xl">🔗</div>
        <h1 className="mt-4 text-2xl font-extrabold text-fg">Link işləmir</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Bu link köhnəlib və ya artıq istifadə olunub. Uşağınız Imparo → Ayarlar bölməsindən
          e-poçt ünvanını yenidən qeyd etsə, yeni təsdiq məktubu göndəriləcək.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-2xl bg-brand px-6 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
        >
          Imparo-ya keç
        </Link>
      </div>
    </main>
  );
}
