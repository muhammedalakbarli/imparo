// GET /api/auth/me — cari giriş etmiş istifadəçi. Session yoxdursa 401.

import { ok, fail, currentUser } from "@/lib/api/http";

export async function GET() {
  const user = await currentUser();
  if (!user) return fail("Autentifikasiya tələb olunur", 401);
  return ok({
    id: user.id,
    email: user.email,
    name: (user.user_metadata?.name as string) ?? "",
  });
}
