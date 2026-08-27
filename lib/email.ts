// E-poçt göndərmə — Resend HTTP API üzərindən.
//
// NİYƏ Cloudflare Email Routing YOX: Email Routing yalnız QƏBUL edir (gələn
// məktubu Gmail-ə yönləndirir), göndərmə imkanı vermir. Worker-də SMTP də yoxdur
// (TCP soketi yoxdur), ona görə göndərmə mütləq HTTP API üzərindən olmalıdır.
//
// QURAŞDIRMA (bir dəfəlik, istifadəçi özü edir):
//   1. resend.com-da hesab aç, `mail.imparo.app` ALT DOMENİNİ təsdiqlə.
//      Alt domen QƏSDƏNDİR: kök domenin SPF qeydi Email Routing tərəfindən
//      "Locked" vəziyyətdədir, ona toxunmaq gələn məktubu sındıra bilər.
//   2. wrangler secret put RESEND_API_KEY
//
// Açar yoxdursa funksiya `false` qaytarır və heç nə göndərmir — çağıran tərəf
// bunu jurnala yazır. Səssiz uğursuzluq YOXDUR.

import { getCloudflareContext } from "@opennextjs/cloudflare";

export const MAIL_FROM = "Imparo <hesabat@mail.imparo.app>";
export const MAIL_REPLY_TO = "destek@imparo.app";

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** RFC 8058 — poçt client-lərinin "imtina et" düyməsi üçün. */
  unsubscribeUrl?: string;
}

export type SendResult = { ok: true; id?: string } | { ok: false; error: string };

export async function sendEmail(mail: Mail): Promise<SendResult> {
  const { env } = await getCloudflareContext({ async: true });
  const key = env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "missing_resend_key" };

  const headers: Record<string, string> = {};
  if (mail.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${mail.unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [mail.to],
        reply_to: MAIL_REPLY_TO,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(Object.keys(headers).length ? { headers } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `resend_${res.status}: ${body.slice(0, 200)}` };
    }
    const json = (await res.json()) as { id?: string };
    return { ok: true, id: json.id };
  } catch (err) {
    return { ok: false, error: `fetch_failed: ${String(err).slice(0, 200)}` };
  }
}
