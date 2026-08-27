// GET /api/parent/verify?token=… — valideyn təsdiq linki.
// Sessiya TƏLƏB OLUNMUR: linki açan valideyndir, onun Imparo hesabı yoxdur.
// Token 128 bitlikdir və yalnız təsdiq üçün işləyir; təsdiqdən sonra null olur,
// yəni link təkrar istifadə edilə bilməz.

import { adminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return Response.redirect(`${SITE_URL}/hesabat/xeta?s=token`, 302);

  const admin = await adminClient();
  const { data, error } = await admin
    .from("parent_reports")
    .update({ verified_at: new Date().toISOString(), verify_token: null })
    .eq("verify_token", token)
    .select("view_token")
    .maybeSingle();

  if (error || !data) {
    // Artıq təsdiqlənib və ya link köhnəlib — ikisini fərqləndirmirik ki,
    // token yoxlaması ilə mövcud abunələri sadalamaq mümkün olmasın.
    return Response.redirect(`${SITE_URL}/hesabat/xeta?s=link`, 302);
  }

  return Response.redirect(`${SITE_URL}/hesabat/${data.view_token}?tesdiq=1`, 302);
}
