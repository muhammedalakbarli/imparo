// POST /api/auth/login — email + parol ilə giriş. Uğurlu olsa session cookie qoyulur.

import { createClient } from "@/lib/supabase/server";
import { ok, fail, readJson } from "@/lib/api/http";

interface Body {
  email?: string;
  password?: string;
}

export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  if (!body) return fail("Yanlış JSON gövdəsi");

  const { email, password } = body;
  if (!email || !password) return fail("email və password tələb olunur");

  const supabase = await createClient();

  // IP-ə görə saatlıq tavan (0040) — saytdakı giriş formu ilə eyni qayda.
  // Əvvəl bu yoxlama yalnız brauzer tərəfində idi, bu marşrut isə onu keçirdi.
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";
  if (ip) {
    const { data: allowed } = await supabase.rpc("check_login_rate", { p_ip: ip });
    if (allowed === false) return fail("Çox sayda giriş cəhdi. Bir az sonra yenidən cəhd et.", 429);
    try {
      await supabase.rpc("log_security_event", { p_kind: "login_attempt", p_ip: ip, p_detail: { email } });
    } catch {
      // jurnal girişi bloklamamalıdır
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return fail(error.message, 401);

  return ok({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: (data.user.user_metadata?.name as string) ?? "",
    },
  });
}
