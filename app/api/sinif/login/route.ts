// POST /api/sinif/login — sinif kodu + şagird + 4 rəqəmli PIN ilə giriş.
//   { code, ref, pin } → { status: "ok" } (sessiya cookie-ləri qoyulur)
//                      | { status: "wrong", remaining } | { status: "locked", retry_after }
//                      | { status: "not_found" | "ip_limited" }
//
// Axın: verify_student_pin (PIN + blok + IP limiti, atomik) → service_role ilə həmin
// hesab üçün birdəfəlik giriş tokeni (generateLink — HEÇ BİR məktub göndərmir) →
// token serverdə sessiyaya çevrilir və cookie kimi yazılır. PIN Supabase parolu deyil.

import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ok, fail, readJson } from "@/lib/api/http";
import { clientIp } from "@/lib/api/clientIp";
import { isRef, normalizeClassCode } from "@/lib/managedStudents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Verify =
  | { status: "ok"; user_id: string; email: string }
  | { status: "wrong"; remaining: number }
  | { status: "locked"; retry_after: number }
  | { status: "not_found" | "ip_limited" };

export async function POST(req: Request) {
  const body = await readJson<{ code?: string; ref?: string; pin?: string }>(req);
  const code = normalizeClassCode(body?.code ?? "");
  const ref = (body?.ref ?? "").toUpperCase();
  const pin = body?.pin ?? "";
  if (code.length < 4 || !isRef(ref) || !/^\d{4}$/.test(pin)) return ok({ status: "not_found" });

  const admin = await adminClient();
  const { data, error } = await admin.rpc("verify_student_pin", {
    p_code: code, p_ref: ref, p_pin: pin, p_ip: clientIp(req),
  });
  if (error) {
    console.error("sinif/login verify:", error.message);
    return fail("Xəta baş verdi", 500);
  }
  const v = data as Verify;
  if (v.status !== "ok") return ok(v);

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: v.email });
  const tokenHash = link?.properties?.hashed_token;
  if (linkErr || !tokenHash) {
    console.error("sinif/login link:", linkErr?.message);
    return fail("Giriş alınmadı, yenidən cəhd et", 500);
  }

  const supabase = await createClient();
  const { error: otpErr } = await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash });
  if (otpErr) {
    console.error("sinif/login otp:", otpErr.message);
    return fail("Giriş alınmadı, yenidən cəhd et", 500);
  }
  return ok({ status: "ok" });
}
