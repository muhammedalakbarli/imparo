// POST /api/teacher/notify — müəllim qeydiyyatı məktubları.
//   { kind: "request" }            → giriş etmiş istifadəçinin gözləyən müraciəti haqda ADMİN-ə məktub
//   { kind: "approved", uid }      → admin təsdiqindən sonra MÜƏLLİMƏ "hesabınız hazırdır" məktubu
//
// Hər məktub bir dəfə gedir: əvvəlcə izləmə sütunu ŞƏRTLƏ yazılır (`notified_at` /
// `welcomed_at` is null), yalnız həmin yeniləmə sətir qaytarsa məktub göndərilir.
// Beləliklə iki paralel sorğu (və ya düyməni təkrar basmaq) ikinci məktub yaratmır.
// Göndərmə alınmasa sütun geri açılır ki, növbəti cəhd yenidən yoxlasın.

import { adminClient } from "@/lib/supabase/admin";
import { ok, fail, readJson, currentUser } from "@/lib/api/http";
import { sendEmail, ADMIN_NOTIFY_TO } from "@/lib/email";
import { renderTeacherRequestEmail, renderTeacherWelcomeEmail } from "@/lib/teacherMail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Autentifikasiya tələb olunur", 401);

  const body = await readJson<{ kind?: string; uid?: string }>(req);
  const admin = await adminClient();

  // ── Yeni müraciət → admin-ə ────────────────────────────────────────────────
  if (body?.kind === "request") {
    const { data: claimed } = await admin
      .from("teacher_requests")
      .update({ notified_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "pending")
      .is("notified_at", null)
      .select("school, subject, note")
      .maybeSingle();
    if (!claimed) return ok({ mailed: false, reason: "nothing_to_notify" });

    const { data: profile } = await admin.from("profiles").select("name").eq("id", user.id).maybeSingle();
    const mail = renderTeacherRequestEmail({
      name: profile?.name || (user.user_metadata?.name as string) || "",
      email: user.email ?? "",
      school: claimed.school,
      subject: claimed.subject,
      note: claimed.note,
      provider: (user.app_metadata?.provider as string) || "email",
    });
    const sent = await sendEmail({ to: ADMIN_NOTIFY_TO, ...mail });
    if (!sent.ok) {
      await admin.from("teacher_requests").update({ notified_at: null }).eq("user_id", user.id);
      console.error("teacher/notify request:", sent.error);
      return ok({ mailed: false, reason: sent.error }, 202);
    }
    return ok({ mailed: true });
  }

  // ── Təsdiq → müəllimə ──────────────────────────────────────────────────────
  if (body?.kind === "approved") {
    const uid = body.uid ?? "";
    if (!UUID.test(uid)) return fail("uid düzgün deyil");

    const { data: isAdmin } = await admin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!isAdmin) return fail("Yalnız admin", 403);

    const { data: claimed } = await admin
      .from("teachers")
      .update({ welcomed_at: new Date().toISOString() })
      .eq("user_id", uid)
      .is("welcomed_at", null)
      .select("user_id")
      .maybeSingle();
    if (!claimed) return ok({ mailed: false, reason: "already_welcomed_or_not_teacher" });

    const { data: target } = await admin.auth.admin.getUserById(uid);
    const email = target?.user?.email;
    if (!email) {
      await admin.from("teachers").update({ welcomed_at: null }).eq("user_id", uid);
      return ok({ mailed: false, reason: "no_email" }, 202);
    }
    const { data: profile } = await admin.from("profiles").select("name").eq("id", uid).maybeSingle();
    const mail = renderTeacherWelcomeEmail(profile?.name || (target.user?.user_metadata?.name as string) || "");
    const sent = await sendEmail({ to: email, ...mail });
    if (!sent.ok) {
      await admin.from("teachers").update({ welcomed_at: null }).eq("user_id", uid);
      console.error("teacher/notify approved:", sent.error);
      return ok({ mailed: false, reason: sent.error }, 202);
    }
    return ok({ mailed: true });
  }

  return fail("kind: request | approved");
}
