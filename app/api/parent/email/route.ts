// Valideyn e-poçtu — şagird tərəfindən idarə olunur.
//   GET    → cari vəziyyət (ünvan + təsdiqlənibmi)
//   POST   → ünvanı təyin et/dəyiş və TƏSDİQ məktubu göndər
//   DELETE → ünvanı sil (hesabatlar dayanır)
//
// Yazı `set_parent_email` RPC-sindən keçir (parent_reports-a birbaşa insert
// bağlıdır) — belə olmasa şagird özünə istənilən token təyin edib başqasının
// hesabatını aça bilərdi.

import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { ok, fail, readJson, currentUser } from "@/lib/api/http";
import { sendEmail } from "@/lib/email";
import { renderVerifyEmail } from "@/lib/parentReport";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return fail("Autentifikasiya tələb olunur", 401);

  const supabase = await createClient();
  const { data } = await supabase
    .from("parent_reports")
    .select("email, verified_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return ok({
    email: data?.email ?? null,
    verified: Boolean(data?.verified_at),
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Autentifikasiya tələb olunur", 401);

  const body = await readJson<{ email?: string }>(req);
  const email = body?.email?.trim();
  if (!email) return fail("E-poçt ünvanı tələb olunur");

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_parent_email", { p_email: email });
  if (error) {
    return fail(error.message.includes("invalid email") ? "E-poçt ünvanı düzgün deyil" : "Yadda saxlanmadı");
  }

  // Tokeni yalnız server görür — client-ə qaytarılsaydı, uşaq valideyni
  // gözləmədən özü təsdiqləyə bilərdi və təsdiq mexanizmi mənasız olardı.
  const admin = await adminClient();
  const { data: row } = await admin
    .from("parent_reports")
    .select("verify_token")
    .eq("user_id", user.id)
    .maybeSingle();

  const token = row?.verify_token;
  if (!token) return fail("Təsdiq linki yaradılmadı", 500);

  const { data: profile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const mail = renderVerifyEmail(
    profile?.name ?? "",
    `${SITE_URL}/api/parent/verify?token=${token}`,
  );
  const sent = await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });

  if (!sent.ok) {
    // Ünvan yadda qalır (təsdiqlənməmiş halda), amma istifadəçiyə DÜZÜNÜ deyirik —
    // "göndərildi" yazıb heç nə göndərməmək ən pis variantdır.
    return ok({ saved: true, mailed: false, reason: sent.error }, 202);
  }
  return ok({ saved: true, mailed: true });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return fail("Autentifikasiya tələb olunur", 401);

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_parent_email");
  if (error) return fail("Silinmədi");
  return ok({ removed: true });
}
