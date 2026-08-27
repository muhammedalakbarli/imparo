// POST /api/auth/signup — ad + email + parol ilə qeydiyyat.
// Uğurlu olsa session cookie qoyulur (email təsdiqi söndürülübsə).
// IP-ə görə saatlıq tavan (bax migration 0038) — Supabase-in öz email-rate-limit-i üzərinə əlavə qat.

import { createClient } from "@/lib/supabase/server";
import { ok, fail, readJson } from "@/lib/api/http";

interface Body {
  name?: string;
  email?: string;
  password?: string;
}

function clientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
}

export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  if (!body) return fail("Yanlış JSON gövdəsi");

  const { name, email, password } = body;
  if (!email || !password) return fail("email və password tələb olunur");
  if (password.length < 6) return fail("Parol ən azı 6 simvol olmalıdır");

  const supabase = await createClient();
  const ip = clientIp(req);

  const { data: allowed } = await supabase.rpc("check_signup_rate", { p_ip: ip });
  if (allowed === false) {
    return fail("Çox sayda qeydiyyat cəhdi. Bir az sonra yenidən cəhd et.", 429);
  }
  try {
    await supabase.rpc("log_security_event", { p_kind: "signup_attempt", p_ip: ip, p_detail: { email } });
  } catch {
    // sükutla ötür
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name ?? "" } },
  });
  if (error) return fail(error.message, 400);

  return ok(
    {
      user: data.user
        ? { id: data.user.id, email: data.user.email, name: name ?? "" }
        : null,
      needsEmailConfirm: !data.session,
    },
    201,
  );
}
