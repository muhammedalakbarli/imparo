// POST /api/mekteb/students — müəllim sinfinə e-poçtsuz şagird hesabları yaradır.
//   { classId, names: string[] }  (bir sorğuda ən çox STUDENT_CHUNK ad)
//   → { created: [{ user_id, name, ref, pin }], failed: string[] }
//
// Hesab yaratmaq service_role tələb edir (auth.admin.createUser), ona görə server
// route-dur; sahiblik burada yoxlanılır: təsdiqlənmiş müəllim + sinif onundur.
//
// Niyə hissələrlə: Cloudflare Workers pulsuz planında bir sorğu ən çox 50 alt-sorğu
// edə bilər. Hər şagird = 1 createUser; sonra 3 toplu insert. 15 şagird ≈ 22 alt-sorğu,
// səhv halında geri qaytarma (silmə) üçün də yer qalır. Client 30 adı 2 sorğuya bölür.

import { adminClient } from "@/lib/supabase/admin";
import { ok, fail, readJson, currentUser } from "@/lib/api/http";
import {
  STUDENT_CHUNK, genPin, genRef, parseStudentNames, randomPassword, syntheticEmail,
} from "@/lib/managedStudents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PER_CLASS = 100;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Autentifikasiya tələb olunur", 401);

  const body = await readJson<{ classId?: string; names?: unknown }>(req);
  const classId = body?.classId ?? "";
  if (!UUID.test(classId)) return fail("classId düzgün deyil");
  if (!Array.isArray(body?.names)) return fail("names massiv olmalıdır");
  const { names } = parseStudentNames((body.names as unknown[]).map(String).join("\n"));
  if (names.length === 0) return fail("Ad yoxdur");
  if (names.length > STUDENT_CHUNK) return fail(`Bir dəfəyə ən çox ${STUDENT_CHUNK} ad`);

  const admin = await adminClient();
  const [{ data: cls }, { data: teacher }, { count }] = await Promise.all([
    admin.from("classes").select("id, grade, teacher_id").eq("id", classId).maybeSingle(),
    admin.from("teachers").select("user_id").eq("user_id", user.id).maybeSingle(),
    admin.from("managed_students").select("user_id", { count: "exact", head: true }).eq("class_id", classId),
  ]);
  if (!cls || cls.teacher_id !== user.id || !teacher) return fail("Bu sinif sizin deyil", 403);
  if ((count ?? 0) + names.length > MAX_PER_CLASS) {
    return fail(`Bir sinifdə ən çox ${MAX_PER_CLASS} şagird hesabı ola bilər`);
  }

  const created: { user_id: string; name: string; ref: string; pin: string }[] = [];
  const failed: string[] = [];
  for (const name of names) {
    const ref = genRef();
    const { data, error } = await admin.auth.admin.createUser({
      email: syntheticEmail(ref),
      password: randomPassword(),
      email_confirm: true,
      user_metadata: {
        name,
        grade: cls.grade,
        onboarded: true, // şagird onboardingi yox — müəllim sinfi artıq bilir
        role: "student",
        managed: true,
        guardianConsent: true, // hesabı müəllim açıb (məktəb nəzarəti)
      },
      // app_metadata-nı yalnız server yaza bilər — "müəllimin hesabı" bayrağı etibarlıdır.
      app_metadata: { managed_class: classId },
    });
    if (error || !data.user) {
      console.error("mekteb/students createUser:", error?.message);
      failed.push(name);
      continue;
    }
    created.push({ user_id: data.user.id, name, ref, pin: genPin() });
  }

  if (created.length > 0) {
    const [ms, pr, cm] = await Promise.all([
      admin.from("managed_students").insert(
        created.map((c) => ({
          user_id: c.user_id, class_id: classId, ref: c.ref, full_name: c.name, pin: c.pin, created_by: user.id,
        })),
      ),
      admin.from("profiles").upsert(
        created.map((c) => ({ id: c.user_id, name: c.name, grade: cls.grade })),
        { onConflict: "id" },
      ),
      admin.from("class_members").insert(created.map((c) => ({ class_id: classId, user_id: c.user_id }))),
    ]);
    if (ms.error || pr.error || cm.error) {
      // Yarımçıq hesab qalmasın: bu partiyada yaradılanların hamısını geri al.
      console.error("mekteb/students insert:", ms.error?.message, pr.error?.message, cm.error?.message);
      await Promise.all(created.map((c) => admin.auth.admin.deleteUser(c.user_id)));
      return fail("Hesablar yaradılmadı, yenidən cəhd edin", 500);
    }
  }

  return ok({ created, failed });
}
