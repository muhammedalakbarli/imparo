// Müəllim qeydiyyatı məktubları — saf funksiyalar (testlənir, server import edir).
//   1. Admin-ə: "yeni müəllim müraciəti" — təsdiq səhifəsinə birbaşa link.
//   2. Müəllimə: "hesabınız təsdiqləndi" — ilk sinfi yaratmağa birbaşa link.
// Müəllim böyükdür — mətn "siz" formasındadır (uşaq interfeysindəki "sən" yox).

import { SITE_URL } from "./site";

const BRAND = "#e8622c";
const INK = "#3b2a24";
const MUTED = "#7d6a62";
const LINE = "#f0e0cd";

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function frame(title: string, bodyHtml: string, cta: { href: string; label: string }, foot: string): string {
  return `<!doctype html>
<html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#fdf6ea;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fdf6ea;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:20px;">
        <tr><td style="padding:28px;">
          <div style="font:800 20px/1.2 Arial,Helvetica,sans-serif;color:${BRAND};">Imparo</div>
          <h1 style="margin:14px 0 10px;font:800 22px/1.3 Arial,Helvetica,sans-serif;color:${INK};">${esc(title)}</h1>
          ${bodyHtml}
          <a href="${esc(cta.href)}" style="display:inline-block;margin-top:6px;background:${BRAND};color:#ffffff;text-decoration:none;font:800 14px/1 Arial,Helvetica,sans-serif;padding:14px 22px;border-radius:14px;">
            ${esc(cta.label)}
          </a>
          <p style="margin:20px 0 0;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:${MUTED};">${foot}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const P = (html: string) =>
  `<p style="margin:0 0 14px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:${INK};">${html}</p>`;

export interface TeacherRequestMail {
  name: string;
  email: string;
  school: string | null;
  subject: string | null;
  note: string | null;
  /** auth provayderi: "google" → ünvan sübut olunub; "email" → sübut olunmayıb */
  provider: string;
}

export function renderTeacherRequestEmail(r: TeacherRequestMail) {
  const url = `${SITE_URL}/admin/muellimler`;
  const verified = r.provider !== "email";
  const who = r.name.trim() || r.email;
  const rows: [string, string][] = [
    ["Ad", who],
    ["E-poçt", `${r.email} ${verified ? "(Google — ünvan təsdiqlənib)" : "(e-poçt/parol — ünvan SÜBUT OLUNMAYIB)"}`],
    ["Məktəb", r.school || "—"],
    ["Fənn", r.subject || "—"],
    ...(r.note ? ([["Qeyd", r.note]] as [string, string][]) : []),
  ];
  const table = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;font:400 14px/1.5 Arial,Helvetica,sans-serif;color:${INK};">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:3px 14px 3px 0;color:${MUTED};vertical-align:top;white-space:nowrap;">${esc(k)}</td><td style="padding:3px 0;">${esc(v)}</td></tr>`,
  )
  .join("\n")}
</table>`;

  return {
    subject: `Yeni müəllim müraciəti — ${who}`,
    html: frame(
      "Yeni müəllim müraciəti",
      P("Imparo-da müəllim hesabı üçün yeni müraciət var:") + table,
      { href: url, label: "Müraciətə bax" },
      "Təsdiq edəndə müəllimə avtomatik məktub gedəcək.",
    ),
    text:
      `Yeni müəllim müraciəti\n\n` +
      rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
      `\n\nTəsdiq üçün: ${url}`,
  };
}

export function renderTeacherWelcomeEmail(name: string) {
  const url = `${SITE_URL}/mekteb/muellim?yeni=1`;
  const hello = name.trim() ? `Hörmətli ${esc(name.trim())},` : "Salam,";
  return {
    subject: "Imparo — müəllim hesabınız təsdiqləndi",
    html: frame(
      "Müəllim hesabınız hazırdır",
      P(hello) +
        P(
          "Imparo-da müəllim hesabınız təsdiqləndi. İndi sinif yarada, kodu şagirdlərinizlə paylaşa " +
            "və kurikuluma uyğun dərslərdən tapşırıq verə bilərsiniz. Kimin etdiyini və sinfin hansı " +
            "bacarıqda ilişdiyini müəllim panelində görəcəksiniz.",
        ),
      { href: url, label: "İlk sinfinizi yaradın" },
      `Sualınız olsa, bu məktuba cavab yazın və ya <a href="mailto:destek@imparo.app" style="color:${MUTED};">destek@imparo.app</a> ünvanına yazın.`,
    ),
    text:
      `${name.trim() ? `Hörmətli ${name.trim()},` : "Salam,"}\n\n` +
      `Imparo-da müəllim hesabınız təsdiqləndi. İndi sinif yarada, kodu şagirdlərinizlə paylaşa və ` +
      `kurikuluma uyğun dərslərdən tapşırıq verə bilərsiniz.\n\n` +
      `İlk sinfinizi yaradın: ${url}\n\nSualınız olsa: destek@imparo.app`,
  };
}
