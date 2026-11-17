// POST /api/sinif/roster — giriş ekranı: sinif koduna görə şagird siyahısı.
//   { code } → { status: "ok", class: { name, grade }, students: [{ ref, name }] }
//            | { status: "not_found" | "rate_limited" }
//
// Adlar YALNIZ "Aysel M." formatındadır (public_name, 0064) — girişsiz ekranda uşağın
// tam adı görünmür. IP başına sorğu limiti RPC-nin içindədir (kod təxmin etməyə qarşı).
// RPC service_role-a açıqdır, ona görə bu route vasitəçidir: IP-ni etibarlı mənbədən verir.

import { adminClient } from "@/lib/supabase/admin";
import { ok, fail, readJson } from "@/lib/api/http";
import { clientIp } from "@/lib/api/clientIp";
import { normalizeClassCode } from "@/lib/managedStudents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson<{ code?: string }>(req);
  const code = normalizeClassCode(body?.code ?? "");
  if (code.length < 4) return ok({ status: "not_found" });

  const admin = await adminClient();
  const { data, error } = await admin.rpc("class_login_roster", { p_code: code, p_ip: clientIp(req) });
  if (error) {
    console.error("sinif/roster:", error.message);
    return fail("Xəta baş verdi", 500);
  }
  return ok(data);
}
