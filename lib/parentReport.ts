// Valideyn hesabatı — məlumat tipləri, formatlama və məktub şablonu.
//
// Məktub HTML-i QƏSDƏN köhnə üsuldadır (cədvəl + inline stil): Gmail, Outlook və
// mail.ru flexbox/grid, <style> bloku və CSS dəyişənlərini ya tamamilə atır, ya da
// yarımçıq tətbiq edir. Saytın Tailwind sinifləri burada işləməz.

import { SITE_URL } from "@/lib/site";

export interface SubjectStat {
  name: string;
  pct: number;
  tasks: number;
}

export interface ReportData {
  from: string;
  to: string;
  child: string | null;
  grade: number | null;
  streak: number;
  seconds: number;
  tasks: number;
  correct: number;
  activeDays: number;
  lessons: number;
  subjects: SubjectStat[];
  improved: { subject: string; delta: number } | null;
  weakest: { unit: string; pct: number } | null;
}

const BRAND = "#e8622c";
const INK = "#3b2a24";
const MUTED = "#7d6a62";
const LINE = "#f0e0cd";
const PANEL = "#fff8ee";

export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} dəqiqə`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} saat` : `${h} saat ${rest} dəqiqə`;
}

// Ay adları ƏLLƏ yazılıb, `toLocaleDateString("az-AZ", { month: "long" })` ilə YOX.
// Səbəb: Cloudflare Workers runtime-ında az-AZ lokalının ay adları yoxdur və
// ICU geri düşərək "M08" qaytarır — valideynə gedən məktubun mövzusunda
// "M08 16 – M08 22" yazılırdı. Lokal Node-da düzgün göründüyü üçün yalnız
// real göndərişdə üzə çıxdı.
const AY = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr",
];

export function formatRange(from: string, to: string): string {
  const t = new Date(to);
  t.setDate(t.getDate() - 1); // `to` daxil deyil — göstəriləndə son günü geri al

  // Bakı vaxtına görə gün/ay. en-CA hər yerdə "YYYY-MM-DD" verir və ICU-dan asılı deyil.
  const parts = (d: Date) => {
    const [, m, day] = d
      .toLocaleDateString("en-CA", { timeZone: "Asia/Baku" })
      .split("-")
      .map(Number);
    return `${day} ${AY[m - 1]}`;
  };

  return `${parts(new Date(from))} – ${parts(t)}`;
}

export function accuracy(d: ReportData): number {
  return d.tasks > 0 ? Math.round((100 * d.correct) / d.tasks) : 0;
}

/** Hesabatda göstərməyə dəyəcək qədər fəaliyyət varmı? */
export function hasActivity(d: ReportData): boolean {
  return d.tasks > 0 || d.lessons > 0;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function bar(pct: number): string {
  const w = Math.max(0, Math.min(100, pct));
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:${LINE};border-radius:99px;">
    <tr><td style="width:${w}%;background:${BRAND};border-radius:99px;font-size:0;line-height:8px;height:8px;">&nbsp;</td><td style="font-size:0;line-height:8px;">&nbsp;</td></tr>
  </table>`;
}

function statCell(value: string, label: string): string {
  return `<td align="center" style="padding:14px 8px;background:${PANEL};border:1px solid ${LINE};border-radius:14px;">
    <div style="font:800 24px/1.1 Arial,Helvetica,sans-serif;color:${BRAND};">${esc(value)}</div>
    <div style="font:700 12px/1.4 Arial,Helvetica,sans-serif;color:${MUTED};padding-top:4px;">${esc(label)}</div>
  </td>`;
}

export interface ReportLinks {
  viewUrl: string;
  unsubUrl: string;
}

export function renderReportEmail(d: ReportData, links: ReportLinks) {
  const name = d.child?.trim() || "Uşağınız";
  const range = formatRange(d.from, d.to);
  const acc = accuracy(d);

  const subjectRows = d.subjects
    .map(
      (s) => `<tr><td style="padding:10px 0 4px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
          <td style="font:700 14px/1.4 Arial,Helvetica,sans-serif;color:${INK};">${esc(s.name)}</td>
          <td align="right" style="font:700 14px/1.4 Arial,Helvetica,sans-serif;color:${MUTED};">${s.pct}%</td>
        </tr></table>
        <div style="padding-top:6px;">${bar(s.pct)}</div>
      </td></tr>`,
    )
    .join("");

  const notes: string[] = [];
  if (d.improved) {
    notes.push(
      `<p style="margin:0 0 10px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:${INK};">
        📈 <b>Ən böyük inkişaf:</b> ${esc(d.improved.subject)} — keçən həftəyə görə +${d.improved.delta} faiz bənd.
      </p>`,
    );
  }
  if (d.weakest) {
    notes.push(
      `<p style="margin:0 0 10px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:${INK};">
        🎯 <b>Diqqət tələb edir:</b> ${esc(d.weakest.unit)} — bu mövzuda düzgün cavab nisbəti ${d.weakest.pct}%.
      </p>`,
    );
  }

  const empty = !hasActivity(d);
  const body = empty
    ? `<p style="margin:0 0 16px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:${INK};">
         ${esc(name)} bu həftə Imparo-da məşq etmədi. Bir dərs cəmi 5–10 dəqiqə çəkir —
         bəlkə birlikdə bir bölmə açasınız?
       </p>`
    : `
      <table role="presentation" cellpadding="0" cellspacing="6" width="100%" style="border-collapse:separate;margin:0 0 20px;">
        <tr>
          ${statCell(formatDuration(d.seconds), "məşq vaxtı")}
          ${statCell(String(d.lessons), "dərs")}
          ${statCell(String(d.tasks), "tapşırıq")}
        </tr>
      </table>

      <p style="margin:0 0 6px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:${INK};">
        Bu həftə <b>${d.activeDays} gün</b> məşq etdi, tapşırıqların <b>${acc}%</b>-ini düzgün həll etdi.
        ${d.streak > 0 ? `Hazırkı seriya: <b>${d.streak} gün</b>.` : ""}
      </p>

      ${
        subjectRows
          ? `<h2 style="margin:24px 0 0;font:800 16px/1.3 Arial,Helvetica,sans-serif;color:${INK};">Fənlər üzrə</h2>
             <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${subjectRows}</table>`
          : ""
      }

      ${notes.length ? `<div style="margin-top:24px;">${notes.join("")}</div>` : ""}
    `;

  const html = `<!doctype html>
<html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Imparo həftəlik hesabat</title></head>
<body style="margin:0;padding:0;background:#fdf6ea;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${esc(name)} bu həftə ${empty ? "məşq etmədi" : `${formatDuration(d.seconds)} məşq etdi`}.
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fdf6ea;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:20px;">
        <tr><td style="padding:28px 28px 0;">
          <div style="font:800 20px/1.2 Arial,Helvetica,sans-serif;color:${BRAND};">Imparo</div>
          <h1 style="margin:14px 0 2px;font:800 22px/1.3 Arial,Helvetica,sans-serif;color:${INK};">
            ${esc(name)} — həftəlik hesabat
          </h1>
          <p style="margin:0 0 20px;font:400 13px/1.5 Arial,Helvetica,sans-serif;color:${MUTED};">${esc(range)}</p>
        </td></tr>
        <tr><td style="padding:0 28px;">${body}</td></tr>
        <tr><td style="padding:26px 28px 30px;">
          <a href="${links.viewUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font:800 14px/1 Arial,Helvetica,sans-serif;padding:14px 22px;border-radius:14px;">
            Ətraflı hesabata bax
          </a>
        </td></tr>
        <tr><td style="padding:0 28px 26px;border-top:1px solid ${LINE};">
          <p style="margin:16px 0 0;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:${MUTED};">
            Bu məktubu ${esc(name)} Imparo hesabında sizin ünvanınızı qeyd etdiyi üçün alırsınız.
            <a href="${links.unsubUrl}" style="color:${MUTED};">Məktubları dayandır</a>.
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font:400 12px/1.5 Arial,Helvetica,sans-serif;color:${MUTED};">
        <a href="${SITE_URL}" style="color:${MUTED};">imparo.app</a>
      </p>
    </td></tr>
  </table>
</body></html>`;

  const text = empty
    ? `${name} — həftəlik hesabat (${range})\n\n${name} bu həftə Imparo-da məşq etmədi.\n\nƏtraflı: ${links.viewUrl}\nMəktubları dayandır: ${links.unsubUrl}`
    : [
        `${name} — həftəlik hesabat (${range})`,
        ``,
        `Məşq vaxtı: ${formatDuration(d.seconds)}`,
        `Tamamlanan dərs: ${d.lessons}`,
        `Həll edilən tapşırıq: ${d.tasks} (${acc}% düzgün)`,
        `Aktiv gün: ${d.activeDays}`,
        ...(d.subjects.length ? [``, `Fənlər üzrə:`, ...d.subjects.map((s) => `  ${s.name}: ${s.pct}%`)] : []),
        ...(d.improved ? [``, `Ən böyük inkişaf: ${d.improved.subject} (+${d.improved.delta} faiz bənd)`] : []),
        ...(d.weakest ? [`Diqqət tələb edir: ${d.weakest.unit} (${d.weakest.pct}%)`] : []),
        ``,
        `Ətraflı: ${links.viewUrl}`,
        `Məktubları dayandır: ${links.unsubUrl}`,
      ].join("\n");

  return {
    subject: `${name} — bu həftə Imparo-da (${range})`,
    html,
    text,
  };
}

export function reportLinks(viewToken: string, unsubToken: string): ReportLinks {
  return {
    viewUrl: `${SITE_URL}/hesabat/${viewToken}`,
    unsubUrl: `${SITE_URL}/api/parent/unsubscribe?token=${unsubToken}`,
  };
}

/** Təsdiq məktubu — uşağın datası göndərilməzdən ƏVVƏL valideyn təsdiqləməlidir. */
export function renderVerifyEmail(childName: string, verifyUrl: string) {
  const name = childName.trim() || "Uşağınız";
  const html = `<!doctype html>
<html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Imparo — hesabatı təsdiqlə</title></head>
<body style="margin:0;padding:0;background:#fdf6ea;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fdf6ea;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:20px;">
        <tr><td style="padding:28px;">
          <div style="font:800 20px/1.2 Arial,Helvetica,sans-serif;color:${BRAND};">Imparo</div>
          <h1 style="margin:14px 0 10px;font:800 22px/1.3 Arial,Helvetica,sans-serif;color:${INK};">Həftəlik hesabatı təsdiqləyin</h1>
          <p style="margin:0 0 18px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:${INK};">
            <b>${esc(name)}</b> Imparo hesabında bu ünvanı valideyn e-poçtu kimi qeyd etdi.
            Təsdiqləsəniz, hər bazar günü onun həftəlik öyrənmə hesabatını göndərəcəyik:
            nə qədər məşq edib, hansı fənlərdə irəliləyib, harada çətinlik çəkir.
          </p>
          <a href="${verifyUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font:800 14px/1 Arial,Helvetica,sans-serif;padding:14px 22px;border-radius:14px;">
            Təsdiqlə
          </a>
          <p style="margin:20px 0 0;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:${MUTED};">
            Bu ünvanı siz qeyd etməmisinizsə, məktubu nəzərə almayın — təsdiqlənməyənə qədər
            heç bir məlumat göndərilmir.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return {
    subject: "Imparo — həftəlik hesabatı təsdiqləyin",
    html,
    text:
      `${name} Imparo hesabında bu ünvanı valideyn e-poçtu kimi qeyd etdi.\n\n` +
      `Təsdiqləmək üçün: ${verifyUrl}\n\n` +
      `Bu ünvanı siz qeyd etməmisinizsə, məktubu nəzərə almayın — təsdiqlənməyənə qədər heç bir məlumat göndərilmir.`,
  };
}
