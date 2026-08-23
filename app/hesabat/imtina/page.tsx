import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Məktublar dayandırıldı", robots: { index: false } };

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const done = s === "ok";

  return (
    <main className="force-light flex min-h-screen items-center justify-center bg-ink px-5">
      <div className="w-full max-w-md rounded-3xl border border-line bg-panel p-8 text-center">
        <div className="text-4xl">{done ? "✓" : "🔗"}</div>
        <h1 className="mt-4 text-2xl font-extrabold text-fg">
          {done ? "Məktublar dayandırıldı" : "Link işləmir"}
        </h1>
        <p className="mt-3 leading-relaxed text-muted">
          {done
            ? "Bu ünvana artıq həftəlik hesabat göndərilməyəcək və ünvan sistemdən silindi. Fikrinizi dəyişsəniz, uşağınız Ayarlar bölməsindən onu yenidən əlavə edə bilər."
            : "Bu link köhnəlib və ya artıq istifadə olunub."}
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
