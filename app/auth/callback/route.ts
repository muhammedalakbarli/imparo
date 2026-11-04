// OAuth qayıdış route-u — Google-dan gələn kodu sessiyaya çevirir, sonra yönləndirir.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// `next` yalnız saytın DAXİLİ yolu ola bilər. Yoxlanılmasa açıq yönləndirmə
// (open redirect) yaranır: `${origin}${next}` birləşməsində `next=.evil.com`
// → "https://imparo.app.evil.com", `next=@evil.com` → "https://imparo.app@evil.com"
// — hər ikisi brauzeri başqa sayta aparır.
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/dashboard";
  }
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Müəllim hesabı (bax lib/teacher.ts) adi girişdə şagird panelinə yox,
      // müəllim panelinə düşür. Yalnız naviqasiyadır — icazəni server yoxlayır.
      const dest =
        next === "/dashboard" && data.user?.user_metadata?.role === "teacher" ? "/mekteb/muellim" : next;
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  // Kod yoxdursa və ya mübadilə alınmadısa → girişə (xəta nişanı ilə).
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
