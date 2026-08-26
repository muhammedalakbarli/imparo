// Worker büdcə mühafizi — "Error 1102: Worker exceeded resource limits"-in
// təkrarlanmasının qarşısını alır.
//
// NİYƏ LAZIM OLDU
// /api/subjects, /api/subjects/{id} və /api/lessons/{id} hamısı bütün məzmun
// ağacını (~11 700 tapşırıq) çəkib sonra demək olar hamısını atırdı. Node-da bu
// sadəcə yavaş idi (~0.8 s) — ona görə lokal inkişafda, testlərdə və build-də
// HEÇ NƏ xəbərdarlıq etmirdi. Cloudflare Worker-in CPU büdcəsində isə ölümcül idi:
// canlıda üç marşrut da 500/503 qaytarırdı (outcome=exceededCpu). Səbəb tapşırıq
// sətirlərinin böyüməsi idi (izah mətnləri + skill etiketləri) — yəni KOD
// dəyişmədən, yalnız MƏZMUN böyüdüyü üçün marşrutlar bir gün sınır.
//
// NƏYİ ÖLÇÜR
// Worker daxilində CPU ölçmək mümkün deyil: Cloudflare-də `Date.now()` və
// `performance.now()` sinxron icra ərzində donur (Spectre müdafiəsi). Ona görə
// mühafiz CPU-nun ƏSAS SÜRÜCÜSÜNÜ ölçür — sorğu yolunun Supabase-dən endirdiyi
// bayt həcmini və subrequest sayını. JSON parse + obyekt qurma CPU-su bu həcmə
// düz mütənasibdir, üstəlik subrequest sayının özü də Worker limitidir.
//
// NECƏ ÖLÇÜR
// Supabase URL-i lokal sayğac proxy-sinə yönləndirilir, `next dev` işə salınır,
// sonra hər marşrut ARDICIL çağırılır. Ardıcıl olduğu üçün hansı PostgREST
// sorğusunun hansı marşruta aid olduğu birmənalıdır — kod tərəfə heç bir
// instrumentasiya əlavə etmək lazım gəlmir, ona görə ölçmə ilə real davranış
// arasında sürüşmə (drift) mümkün deyil.
//
// ÜÇ YOXLAMA
//   1. ƏHATƏ    — app/api altındakı HƏR marşrut bu faylda elan olunmalıdır.
//                 Yeni marşrut büdcəsiz əlavə edilə bilməz.
//   2. BÜDCƏ    — hər marşrutun endirdiyi bayt/subrequest limitdən aşağı olmalıdır.
//   3. SMOKE    — deploy-dan sonra canlı marşrutlar 5xx qaytarmamalıdır.
//
// İSTİFADƏ
//   npm run guard          — əhatə + büdcə (deploy-dan ƏVVƏL)
//   npm run guard:smoke    — canlı yoxlama (deploy-dan SONRA)
//   npm run guard -- --measure  — cari həcmləri göstər (büdcə təyin etmək üçün)

import { config } from "dotenv";
import { spawn, type ChildProcess } from "node:child_process";
import http from "node:http";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

config({ path: ".env.local" });

// ── Büdcə reyestri ────────────────────────────────────────────────────────────
//
// `probe` — dinamik seqmentləri doldurulmuş real yol. Yoxdursa marşrut ölçülmür
// və `skip` SƏBƏBİ məcburidir (POST, webhook, sirr tələb edən cron və s.).
//
// Limitlər cari ölçmənin təxminən iki qatıdır: məzmun böyüdükcə xəbərdarlıq
// gəlsin, amma adi artım yalançı həyəcan yaratmasın.

interface RouteBudget {
  /** app/api altındakı yol, məs. "subjects/[id]" */
  route: string;
  /** Ölçmə üçün real URL yolu; yoxdursa `skip` izah etməlidir. */
  probe?: string;
  /** Supabase-dən enən maksimum cəmi bayt. */
  maxBytes?: number;
  /** Supabase-ə gedən maksimum subrequest sayı. */
  maxRequests?: number;
  /** Gözlənilən HTTP status (default 200). Məs. sessiyasız /api/auth/me → 401. */
  expectStatus?: number;
  /** Ölçülmürsə SƏBƏBİ (məcburi — "sonra baxarıq" qeydi qalmasın deyə). */
  skip?: string;
}

const BUDGETS: RouteBudget[] = [
  // ── Məzmun marşrutları — 1102-nin yarandığı yer. Ən sıx nəzarət buradadır.
  {
    route: "subjects",
    probe: "/api/subjects",
    // Ölçülən: 46.5 KB / 3 sorğu. Düzəlişdən əvvəl bu marşrut ~3 MB endirirdi.
    maxBytes: 150_000,
    maxRequests: 6,
  },
  {
    route: "subjects/[id]",
    probe: "/api/subjects/riyaziyyat-3",
    // Ölçülən: 16.8 KB / 4 sorğu. Tapşırıqlardan yalnız `data->bonus` çəkildiyi
    // üçün izah mətnləri böyüsə də bu rəqəm artmır.
    maxBytes: 60_000,
    maxRequests: 10,
  },
  {
    route: "lessons/[id]",
    probe: "/api/lessons/ry3-min-l1",
    // Ölçülən: 6.6 KB / 2 sorğu. Bu marşrut tam tapşırıq sətirlərini çəkir, ona
    // görə 5-8-ci siniflərə izah yazıldıqca artacaq — yer buraxılıb.
    maxBytes: 50_000,
    maxRequests: 6,
  },

  // ── Digər GET marşrutları
  { route: "openapi", probe: "/api/openapi", maxBytes: 20_000, maxRequests: 2 },
  { route: "client-ip", probe: "/api/client-ip", maxBytes: 20_000, maxRequests: 2 },
  {
    route: "leaderboard",
    probe: "/api/leaderboard",
    // Ölçülən: 2.6 KB / 1 sorğu. İstifadəçi sayı artdıqca böyüyəcək.
    maxBytes: 100_000,
    maxRequests: 8,
  },
  {
    route: "auth/me",
    probe: "/api/auth/me",
    // Sessiyasız çağırılır — 401 DÜZGÜN cavabdır, marşrutun sağ olduğunu göstərir.
    expectStatus: 401,
    maxBytes: 20_000,
    maxRequests: 4,
  },

  // ── Ölçülməyənlər — hər biri üçün səbəb yazılmalıdır.
  { route: "auth/login", skip: "POST — parol tələb edir" },
  { route: "auth/logout", skip: "POST — sessiya tələb edir" },
  { route: "auth/signup", skip: "POST — hesab yaradır" },
  { route: "progress", skip: "GET/POST — giriş etmiş sessiya tələb edir" },
  { route: "parent/email", skip: "POST — giriş etmiş sessiya tələb edir" },
  { route: "parent/verify", skip: "GET — birdəfəlik token tələb edir" },
  { route: "parent/unsubscribe", skip: "GET — birdəfəlik token tələb edir" },
  { route: "tts", skip: "GET — audio qaytarır, xarici servis çağırır" },
  { route: "cron/reminders", skip: "CRON_SECRET tələb edir, bildiriş göndərir" },
  { route: "cron/parent-report", skip: "CRON_SECRET tələb edir, e-poçt göndərir" },
  { route: "webhooks/lemonsqueezy", skip: "POST — imzalı webhook" },
];

// ── Əhatə yoxlaması ───────────────────────────────────────────────────────────

function discoverRoutes(dir: string, prefix = ""): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...discoverRoutes(full, prefix ? `${prefix}/${entry}` : entry));
    } else if (entry === "route.ts") {
      found.push(prefix);
    }
  }
  return found;
}

function checkCoverage(): string[] {
  const onDisk = discoverRoutes("app/api").sort();
  const declared = new Set(BUDGETS.map((b) => b.route));
  const problems: string[] = [];

  for (const r of onDisk) {
    if (!declared.has(r)) {
      problems.push(
        `Marşrut büdcəsizdir: app/api/${r}/route.ts\n` +
          `  → scripts/guard.ts-dəki BUDGETS siyahısına əlavə et: ya probe+limit ver, ya da skip səbəbi yaz.`,
      );
    }
  }
  for (const b of BUDGETS) {
    if (!onDisk.includes(b.route)) {
      problems.push(`Büdcə var, marşrut yoxdur: "${b.route}" — BUDGETS-dən silinməlidir.`);
    }
    if (!b.probe && !b.skip) {
      problems.push(`"${b.route}" nə probe, nə skip səbəbi var — biri məcburidir.`);
    }
    if (b.probe && (b.maxBytes === undefined || b.maxRequests === undefined)) {
      problems.push(`"${b.route}" probe var, amma limit yoxdur (maxBytes/maxRequests).`);
    }
  }
  return problems;
}

// ── Sayğac proxy ──────────────────────────────────────────────────────────────

interface Counter {
  requests: number;
  bytes: number;
  paths: Map<string, { n: number; bytes: number }>;
}

function newCounter(): Counter {
  return { requests: 0, bytes: 0, paths: new Map() };
}

function startProxy(
  upstream: string,
  counter: { current: Counter },
): Promise<{ port: number; close: () => Promise<void> }> {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", upstream);
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "string" && k !== "host" && k !== "connection") headers.set(k, v);
    }

    try {
      const upstreamRes = await fetch(url, {
        method: req.method,
        headers,
        body: chunks.length ? Buffer.concat(chunks) : undefined,
        redirect: "manual",
      });
      const body = Buffer.from(await upstreamRes.arrayBuffer());

      const c = counter.current;
      c.requests += 1;
      c.bytes += body.byteLength;
      // Sorğu sətri çox uzun ola bilər — yalnız cədvəl adını saxlayırıq.
      const table = (req.url ?? "").split("?")[0];
      const prev = c.paths.get(table) ?? { n: 0, bytes: 0 };
      c.paths.set(table, { n: prev.n + 1, bytes: prev.bytes + body.byteLength });

      res.writeHead(upstreamRes.status, {
        "content-type": upstreamRes.headers.get("content-type") ?? "application/json",
        "content-range": upstreamRes.headers.get("content-range") ?? "",
      });
      res.end(body);
    } catch (err) {
      res.writeHead(502);
      res.end(String(err));
    }
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({
        port,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}

// ── Next dev ──────────────────────────────────────────────────────────────────

async function waitFor(url: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url);
      if (r.status < 500) return true;
    } catch {
      /* hələ qalxmayıb */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function startNext(port: number, supabaseUrl: string): ChildProcess {
  // `detached: true` — `npx next dev` öz alt proseslərini yaradır. Yalnız örtüyü
  // öldürsək `next-server` yaşayır və portu tutur; NÖVBƏTİ işləmə həmin köhnə
  // (proxy-yə bağlı OLMAYAN) serverə düşür və ölçmə səssizcə sıfır göstərir.
  // Ona görə proses qrupu yaradılır və bütöv qrup öldürülür.
  return spawn("npx", ["next", "dev", "--port", String(port)], {
    detached: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      // Turbopack-in ilk kompilyasiyası uzun çəkir; ölçmə ondan sonra başlayır.
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: "ignore",
  });
}

function killTree(child: ChildProcess): void {
  if (child.pid === undefined) return;
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    try {
      child.kill("SIGKILL");
    } catch {
      /* onsuz da ölüb */
    }
  }
}

/** Port məşğuldursa ölçmə başqa (yad) serverə düşər — əvvəlcədən dayandırırıq. */
function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = http.createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(port, "127.0.0.1");
  });
}

// ── Büdcə rejimi ──────────────────────────────────────────────────────────────

interface Measured {
  route: string;
  probe: string;
  status: number;
  bytes: number;
  requests: number;
  budget: RouteBudget;
}

async function runBudget(measureOnly: boolean): Promise<number> {
  const upstream = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!upstream) {
    console.error("NEXT_PUBLIC_SUPABASE_URL yoxdur (.env.local yüklənməyib?)");
    return 1;
  }

  const appPortCheck = 3987;
  if (!(await portIsFree(appPortCheck))) {
    console.error(
      `\nPort ${appPortCheck} məşğuldur — ölçmə yad serverə düşərdi.\n` +
        `  Həmin portdakı prosesi dayandır və yenidən işlət.`,
    );
    return 1;
  }

  const counter = { current: newCounter() };
  const proxy = await startProxy(upstream, counter);
  const proxyUrl = `http://127.0.0.1:${proxy.port}`;
  const appPort = 3987;
  const next = startNext(appPort, proxyUrl);

  const results: Measured[] = [];
  let exitCode = 0;

  try {
    const up = await waitFor(`http://127.0.0.1:${appPort}/api/openapi`, 180_000);
    if (!up) {
      console.error("next dev qalxmadı (180 s)");
      return 1;
    }

    const probes = BUDGETS.filter((b) => b.probe);

    // İSTİLƏŞDİRMƏ: Turbopack hər marşrutu ilk çağırışda kompilyasiya edir və o
    // zaman əlavə sorğular gedə bilər. Ölçmə yalnız isti haldan sonra aparılır.
    for (const b of probes) {
      await fetch(`http://127.0.0.1:${appPort}${b.probe}`).catch(() => {});
    }

    for (const b of probes) {
      counter.current = newCounter();
      let status = 0;
      try {
        const res = await fetch(`http://127.0.0.1:${appPort}${b.probe}`);
        status = res.status;
        await res.arrayBuffer();
      } catch {
        status = 0;
      }
      // Supabase sorğuları cavab qaytarıldıqdan sonra da bitə bilər — qısa fasilə.
      await new Promise((r) => setTimeout(r, 300));
      const c = counter.current;
      results.push({
        route: b.route,
        probe: b.probe!,
        status,
        bytes: c.bytes,
        requests: c.requests,
        budget: b,
      });
    }
  } finally {
    killTree(next);
    await proxy.close();
  }

  // Ölçmənin ÖZÜNÜN sağlamlığı: məzmun marşrutları mütləq Supabase-ə getməlidir.
  // Hamısı sıfırdırsa proxy dövrədən çıxıb (port məşğuldur, env ötürülməyib və s.) —
  // belə halda "yaşıl" nəticə yalandır, ona görə açıq şəkildə uğursuz sayılır.
  const contentRoutes = results.filter((r) =>
    ["subjects", "subjects/[id]", "lessons/[id]"].includes(r.route),
  );
  if (contentRoutes.length && contentRoutes.every((r) => r.requests === 0)) {
    console.error(
      "\nÖlçmə etibarsızdır: məzmun marşrutlarının heç biri Supabase-ə sorğu göndərmədi.\n" +
        "  Proxy dövrədən kənarda qalıb — nəticə \"yaşıl\" görünsə də heç nə yoxlanmayıb.",
    );
    return 1;
  }

  // ── Hesabat
  const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
  console.log("\nMarşrut büdcələri (Supabase-dən enən həcm):\n");
  console.log(
    `  ${"marşrut".padEnd(18)}${"status".padEnd(8)}${"həcm".padEnd(12)}${"limit".padEnd(12)}${"sorğu".padEnd(8)}limit`,
  );
  console.log("  " + "─".repeat(70));

  for (const r of results) {
    const overBytes = r.budget.maxBytes !== undefined && r.bytes > r.budget.maxBytes;
    const overReq =
      r.budget.maxRequests !== undefined && r.requests > r.budget.maxRequests;
    const want = r.budget.expectStatus ?? 200;
    const bad = overBytes || overReq || r.status !== want;
    const mark = bad ? "✗" : "✓";
    console.log(
      `${mark} ${r.route.padEnd(18)}${String(r.status).padEnd(8)}${kb(r.bytes).padEnd(12)}${kb(r.budget.maxBytes ?? 0).padEnd(12)}${String(r.requests).padEnd(8)}${r.budget.maxRequests}`,
    );

    if (measureOnly) continue;

    if (r.status !== want) {
      console.error(
        `\n  ${r.route}: ${r.probe} → status ${r.status || "cavab yoxdur"}, gözlənilən ${want}.`,
      );
      exitCode = 1;
    }
    if (overBytes) {
      console.error(
        `\n  ${r.route}: ${kb(r.bytes)} endirir, limit ${kb(r.budget.maxBytes!)}.\n` +
          `  Bu marşrut ehtiyacından çox məlumat çəkir — Worker-də CPU limitini aşa bilər (Error 1102).\n` +
          `  Sorğunu daralt (yalnız lazım olan sütun/sətir) və ya limiti şüurlu şəkildə qaldır.`,
      );
      // Ən ağır cədvəli göstər ki, hara baxmaq lazım olduğu bilinsin.
      exitCode = 1;
    }
    if (overReq) {
      console.error(
        `\n  ${r.route}: ${r.requests} subrequest, limit ${r.budget.maxRequests}.\n` +
          `  Worker-in subrequest limiti var — səhifələmə/parçalama sayını azalt.`,
      );
      exitCode = 1;
    }
  }

  if (measureOnly) {
    console.log("\n(yalnız ölçmə — büdcə pozuntusu yoxlanılmadı)");
    return 0;
  }
  return exitCode;
}

// ── Smoke rejimi ──────────────────────────────────────────────────────────────
//
// Canlı yoxlama imparo.app-dan YOX, workers.dev hostundan aparılır: imparo.app
// zonasında Bot Fight Mode datamərkəz/skript trafikini bloklayır (cron-lar da elə
// buna görə workers.dev-dən çağırılır). middleware.ts /api/ yollarını qəsdən
// yönləndirmir, ona görə API marşrutları oradan birbaşa cavab verir.

const SMOKE_HOST = "https://imparo.m-alakbarli2007.workers.dev";

async function runSmoke(): Promise<number> {
  const probes = BUDGETS.filter((b) => b.probe);
  let exitCode = 0;

  console.log(`\nCanlı smoke — ${SMOKE_HOST}\n`);
  for (const b of probes) {
    let status = 0;
    let ms = 0;
    const t0 = Date.now();
    try {
      const res = await fetch(`${SMOKE_HOST}${b.probe}`, {
        signal: AbortSignal.timeout(30_000),
      });
      status = res.status;
      await res.arrayBuffer();
    } catch {
      status = 0;
    }
    ms = Date.now() - t0;

    const bad = status === 0 || status >= 500;
    console.log(`${bad ? "✗" : "✓"} ${b.probe!.padEnd(34)}${status || "timeout"}  ${ms} ms`);
    if (bad) {
      console.error(
        `  ${b.probe} → ${status || "cavab yoxdur"}. Worker limitini aşmış ola bilər (Error 1102).`,
      );
      exitCode = 1;
    }
  }
  return exitCode;
}

// ── Giriş nöqtəsi ─────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const smoke = args.includes("--smoke");
  const measureOnly = args.includes("--measure");

  if (smoke) {
    process.exit(await runSmoke());
  }

  const coverage = checkCoverage();
  if (coverage.length) {
    console.error("\nƏhatə yoxlaması uğursuz:\n");
    for (const p of coverage) console.error("  " + p + "\n");
    process.exit(1);
  }
  console.log(`Əhatə: ${BUDGETS.length} marşrutun hamısı elan olunub ✓`);

  process.exit(await runBudget(measureOnly));
}

void main();
