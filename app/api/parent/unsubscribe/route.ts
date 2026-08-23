// Valideyn imtinası. GET — məktubdakı link; POST — RFC 8058 "One-Click"
// (Gmail/Outlook öz "Unsubscribe" düyməsi ilə birbaşa POST atır).
//
// Sətir tamamilə SİLİNİR: "söndürülmüş" vəziyyət saxlamaq valideynin ünvanını
// bizdə lazımsız yerə qoyub saxlamaq deməkdir.

import { adminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function unsubscribe(token: string | null): Promise<boolean> {
  if (!token) return false;
  const admin = await adminClient();
  const { data } = await admin
    .from("parent_reports")
    .delete()
    .eq("unsub_token", token)
    .select("user_id")
    .maybeSingle();
  return Boolean(data);
}

export async function GET(req: Request) {
  const done = await unsubscribe(new URL(req.url).searchParams.get("token"));
  return Response.redirect(`${SITE_URL}/hesabat/imtina?s=${done ? "ok" : "link"}`, 302);
}

export async function POST(req: Request) {
  await unsubscribe(new URL(req.url).searchParams.get("token"));
  // One-Click üçün cavab gövdəsi əhəmiyyətsizdir, yalnız 2xx tələb olunur.
  return new Response(null, { status: 204 });
}
