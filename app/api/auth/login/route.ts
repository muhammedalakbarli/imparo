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
