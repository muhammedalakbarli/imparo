import Link from "next/link";
import Mascot from "@/components/Mascot";

export default function NotFound() {
  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink px-4 text-center">
      {/* Kədərli (worried) Zefi — 404 üçün ən uyğun poza */}
      <div className="relative">
        <Mascot size={180} mood="sad" />
        <span className="pointer-events-none absolute -right-2 top-2 rounded-2xl bg-brand px-3 py-1 text-lg font-extrabold text-white shadow-lg">
          404
        </span>
      </div>
      <h1 className="mt-4 text-3xl font-extrabold text-fg">Səhifə tapılmadı</h1>
      <p className="mt-2 max-w-sm text-muted">
        Axtardığın səhifə mövcud deyil və ya köçürülüb. Gəl Zefi ilə öyrənməyə qayıdaq.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-2xl bg-brand px-6 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
      >
        Ana səhifəyə qayıt
      </Link>
    </main>
  );
}
