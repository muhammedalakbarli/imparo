// OpenNext — Cloudflare Workers adapteri (Vercel-dən köçürmə).
// SSR + API route-lar Worker-də işləyir (nodejs_compat).
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  // Prerender edilmiş səhifələr `.open-next/cache/` altına düşür, `assets/`-ə YOX.
  // Keş təyin edilməsə Worker onları tapmır: `generateStaticParams` +
  // `dynamicParams = false` olan marşrut 404 qaytarır (canlıda /subjects/* belə sındı).
  // Bu override həmin faylları Workers static assets-dən oxuyur — R2/KV lazım deyil,
  // əlavə xərc yoxdur.
  //
  // Şərt: ISR/revalidation İŞLƏDİLMƏMƏLİDİR (bu keş yalnız oxuyur, yazmır).
  // Yoxlanıldı — layihədə `revalidate`, `revalidatePath`, `revalidateTag` yoxdur.
  // ISR lazım olsa bu override dəyişdirilməlidir.
  incrementalCache: staticAssetsIncrementalCache,
});
