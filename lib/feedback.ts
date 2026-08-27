// Sual rəyi (feedback) — istifadəçi sualla bağlı problem bildirir.
// task_feedback cədvəlinə yazır (RLS: yalnız öz adından; bax migration 0014).

import { createClient } from "./supabase/client";

export type FeedbackCategory = "wrong_answer" | "unclear" | "typo" | "other";

// Kateqoriya kodları → AZ etiketlər (UI və admin üçün ortaq).
export const FEEDBACK_LABELS: Record<FeedbackCategory, string> = {
  wrong_answer: "Cavab səhvdir",
  unclear: "Sual anlaşılmır",
  typo: "Yazı xətası",
  other: "Digər",
};

export async function submitTaskFeedback(
  taskId: string,
  category: FeedbackCategory,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Giriş tələb olunur." };
    const { error } = await supabase.from("task_feedback").insert({
      task_id: taskId,
      user_id: user.id,
      category,
      message: message.trim() || null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
