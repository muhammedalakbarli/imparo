import type { Metadata } from "next";

// Fənn səhifələri saytın ən dəyərli açıq məzmunudur ("5-ci sinif riyaziyyat"
// kimi axtarışlar buraya düşür), ona görə başlıq/təsvir hər fənn üçün ayrıca
// qurulur — hamısına eyni ümumi başlıq düşsəydi, Google onları bir-birindən
// ayıra bilməzdi.
//
// `@/lib/content` DİNAMİK idxal olunur: statik idxal bütün seed məzmununu
// Worker-in başlanğıc yoluna salır və CPU limitini keçirir (Error 1102).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { getSubject } = await import("@/lib/content");
    const subject = getSubject(slug);
    if (!subject) return { title: "Fənn tapılmadı" };

    const lessonCount = subject.units.reduce((n, u) => n + u.lessons.length, 0);
    const title = `${subject.grade}-ci sinif ${subject.name}`;
    const description =
      `${subject.grade}-ci sinif ${subject.name} proqramı: ${subject.units.length} bölmə, ` +
      `${lessonCount} interaktiv dərs. Pulsuz məşq et, tərəqqini izlə.`;

    return {
      title,
      description,
      alternates: { canonical: `/subjects/${slug}` },
      openGraph: { title: `${title} · Imparo`, description, url: `/subjects/${slug}` },
    };
  } catch {
    // Məzmun yüklənməsə səhifə yenə açılsın — metadata olmaması səhifəni sındırmır.
    return {};
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
