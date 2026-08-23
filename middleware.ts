// Host kanonikləşdirməsi: köhnə ünvanlar → imparo.app (301, path+query saxlanılır).
//
// İki köhnə host var və HƏR İKİSİ hələ də Worker-ə bağlıdır:
//   • www.imparo.app                        (wrangler.jsonc-də custom domain)
//   • imparo.m-alakbarli2007.workers.dev    (workers_dev qəsdən açıq saxlanılıb)
// Yönləndirilməsələr, eyni məzmun üç ünvanda açılır: Google bunu "duplicate
// content" kimi görür və reytinq üç domen arasında bölünür.
//
// Niyə middleware-də, Cloudflare qaydasında yox: bu, hostinqdən asılı olmayan,
// kodla versiyalanan, testə açıq həlldir.
//
// 301 (daimi): axtarış motorlarına və brauzer keşinə "kanonik ünvan budur"
// siqnalını verir — sonrakı ziyarətlərdə brauzer birbaşa apex-ə gedir.

import { NextResponse, type NextRequest } from "next/server";
import { LEGACY_HOSTS, SITE_HOST } from "@/lib/site";

export function middleware(req: NextRequest) {
  // Host başlığında port ola bilər (lokal/preview) — müqayisədən əvvəl atılır.
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (LEGACY_HOSTS.includes(host)) {
    const url = req.nextUrl.clone();
    url.host = SITE_HOST;
    url.protocol = "https";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  // Statik fayllara toxunmuruq (performans) — köhnə hosta girən şagird ilk HTML
  // yükləməsində artıq apex-ə keçir, sonrakı sorğular onsuz da apex-dən gedir.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
