// /subjects/[slug] — bütün fənn ünvanları build zamanı hazırlanır.
//
// NİYƏ VACİBDİR: bu marşrut əvvəl hər sorğuda Worker-də render olunurdu (client
// komponent + dinamik seqment, generateStaticParams yox). Canlıda ölçüldü —
// sorğuların bir hissəsi `outcome: exceededCpu` ilə ölürdü, istifadəçi "Error 1102"
// görürdü. IndexNow ilə həmin 24 ünvan gəziciyə göndəriləndən sonra yük artdı və
// problem üzə çıxdı. İndi səhifələr ASSETS-dən statik verilir.
//
// Slug siyahısı `lib/generated/subject-slugs.ts`-dən gəlir — onu prebuild yaradır.
// "@/lib/content" BURADA İDXAL EDİLƏ BİLMƏZ: 2.1 MB Worker yükünə düşər.

import { Suspense } from "react";
import { SUBJECT_SLUGS } from "@/lib/generated/subject-slugs";
import { PageSkeleton } from "@/components/Skeleton";
import SubjectPageClient from "./SubjectPageClient";

export function generateStaticParams() {
  return SUBJECT_SLUGS.map((slug) => ({ slug }));
}

// Siyahıda olmayan slug üçün 404 — naməlum ünvanlar Worker-i işə salmasın.
export const dynamicParams = false;

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Suspense MƏCBURİDİR: klient hissəsi ?onboarding=1 üçün useSearchParams()
  // çağırır və o, sərhədsiz prerender-i dayandırır ("CSR bailout"). Sərhəd
  // sayəsində HTML build zamanı hazırlanır, parametrdən asılı hissə isə
  // brauzerdə oturur.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SubjectPageClient slug={slug} />
    </Suspense>
  );
}
