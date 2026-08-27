import type { Metadata } from "next";
import { getSubjectMeta } from "@/lib/subjectMeta";

// Fənn səhifələri saytın ən dəyərli açıq məzmunudur ("5-ci sinif riyaziyyat"
// kimi axtarışlar buraya düşür), ona görə başlıq/təsvir hər fənn üçün ayrıca
// qurulur — hamısına eyni ümumi başlıq düşsəydi, Google onları ayırd edə bilməzdi.
//
// Məlumat `@/lib/subjectMeta`-dan gəlir, `@/lib/content`-dən YOX: content bütün
// seed məzmunudur və Worker paketini 3 MiB limitindən keçirir.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = getSubjectMeta(slug);
  if (!s) return { title: "Fənn tapılmadı" };

  const title = `${s.grade}-ci sinif ${s.name}`;
  const description =
    `${s.grade}-ci sinif ${s.name} proqramı: ${s.units} bölmə, ${s.lessons} interaktiv dərs. ` +
    `Pulsuz məşq et, tərəqqini izlə.`;

  return {
    title,
    description,
    alternates: { canonical: `/subjects/${slug}` },
    openGraph: { title: `${title} · Imparo`, description, url: `/subjects/${slug}` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
