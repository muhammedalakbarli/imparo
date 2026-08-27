"use client";

// Landing (marketinq) səhifəsi — Duolingo-səviyyəli: animasiyalı hero (üzən blob-lar,
// stagger giriş), scroll-reveal bölmələr, count-up statistika, rəngli fənn kartları,
// oyunlaşdırma vurğuları, "necə işləyir" addımları. Öz indigo brendimiz + Zefi mascotu.
// Bütün hərəkət prefers-reduced-motion / .no-anim ilə söndürülür.

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Check,
  Star,
  Flame,
  Trophy,
  Award,
  Sparkles,
  Smartphone,
  Apple,
  Play,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { useContent } from "@/components/ContentProvider";
import { useT } from "@/lib/i18n";
import { useCountUp } from "@/lib/useCountUp";
import Logo from "@/components/Logo";
import Mascot from "@/components/Mascot";
import ZefiMascot from "@/components/ZefiMascot";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SiteFooter from "@/components/SiteFooter";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

export default function LandingPage() {
  const router = useRouter();
  const t = useT();
  const { subjects } = useContent();

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) router.replace("/dashboard");
    });
  }, [router]);

  // Vitrin rəqəmləri YUVARLAQ göstərilir: "666 dərs" səliqəsiz görünür, "650+" isə
  // həm təmiz, həm dürüstdür (real say həmişə göstərilən rəqəmdən çoxdur).
  // Addım rəqəmin böyüklüyünə uyğunlaşır: 666 → 650, 11 693 → 10 000.
  function niceFloor(n: number): number {
    if (n < 10) return n;
    const step = Math.pow(10, Math.floor(Math.log10(n))) / 2;
    return Math.floor(n / step) * step;
  }

  // Fənn sayı ADINA görə təkrarsızdır: bazada hər sinif üçün ayrıca sətir var
  // (26 sətir), amma şagird üçün bu, 5 fərqli fənn deməkdir.
  const subjectCount = new Set(subjects.map((s) => s.name)).size;

  // Sandıqlar "dərs" sayılmır — onların tapşırığı yoxdur. Əvvəl sayılırdı və
  // ana səhifə 750+ göstərirdi, halbuki 110-u boş sandıqdır (bax subjectMeta).
  const totalLessons = subjects.reduce(
    (n, s) =>
      n +
      s.units.reduce((m, u) => m + u.lessons.filter((l) => l.tasks.length > 0).length, 0),
    0,
  );
  const totalTasks = subjects.reduce(
    (n, s) =>
      n +
      s.units.reduce(
        (m, u) =>
          m + u.lessons.reduce((k, l) => k + l.tasks.length + (l.bonusTasks?.length ?? 0), 0),
        0,
      ),
    0,
  );

  return (
    <div className="force-light relative min-h-screen overflow-hidden bg-ink">
      <Blobs />

      {/* Naviqasiya (sticky, blur) */}
      <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="text-lg font-extrabold text-brand">
              Imparo
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="rounded-2xl border-2 border-line px-4 py-2 text-sm font-bold text-fg btn-pop btn-pop-ghost hover:border-brand"
            >
              {t("home.login")}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5">
        {/* ── Hero (Duolingo üslubu — böyük mərkəzi) ── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center py-14 text-center sm:py-24"
        >
          {/* Mascot — böyük, mərkəzdə, dekorativ dairə arxada */}
          <motion.div variants={fadeUp} className="relative flex items-center justify-center">
            {/* Dekorativ dairə — Zefi içində (işıqlı mod dizaynı) */}
            <span
              className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand/20 to-accent/15 sm:w-96"
              aria-hidden
            />
            <span className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-2xl sm:h-64 sm:w-64" aria-hidden />
            <Mascot size={260} mood="wave" />
            <span className="twinkle pointer-events-none absolute left-4 top-8 text-amber-300 sm:left-0" aria-hidden>
              <Sparkles size={24} fill="currentColor" strokeWidth={0} />
            </span>
            <span className="twinkle pointer-events-none absolute bottom-10 right-4 text-amber-300 sm:right-0" style={{ animationDelay: "1s" }} aria-hidden>
              <Sparkles size={18} fill="currentColor" strokeWidth={0} />
            </span>
            <span className="xp-pop absolute left-0 top-10 rounded-2xl bg-accent px-3 py-1.5 text-sm font-extrabold text-white shadow-lg">
              +10 XP
            </span>
            <span className="absolute bottom-12 right-0 rounded-2xl bg-brand px-3 py-1.5 text-sm font-extrabold text-white shadow-lg">
              {t("home.aferin")}
            </span>
          </motion.div>

          {/* Mesaj */}
          <motion.h1
            variants={fadeUp}
            className="mt-10 max-w-3xl text-4xl font-extrabold leading-tight text-fg sm:text-6xl"
          >
            {t("home.hero1")}
            <span className="gradient-pan bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
              {t("home.hero2")}
            </span>
            {t("home.hero3")}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-xl text-lg text-muted sm:text-xl">
            {t("home.heroBody")}
          </motion.p>

          {/* CTA — mərkəzi, geniş (Duolingo kimi) */}
          <motion.div variants={fadeUp} className="mt-9 flex w-full max-w-sm flex-col gap-3">
            <Link
              href="/onboarding"
              className="rounded-2xl bg-brand px-8 py-4 text-lg font-extrabold uppercase tracking-wide text-white shadow-lg shadow-brand/25 btn-pop hover:bg-brand-dark"
            >
              {t("home.ctaStart")}
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border-2 border-line bg-panel px-8 py-4 text-lg font-extrabold uppercase tracking-wide text-fg btn-pop btn-pop-ghost hover:border-brand"
            >
              {t("home.haveAccount")}
            </Link>
          </motion.div>
        </motion.section>

        {/* ── Statistika (count-up) ── */}
        <Reveal className="grid grid-cols-3 gap-4 pb-6">
          <StatCard value={subjectCount} label={t("home.stat.subjects")} />
          <StatCard value={niceFloor(totalLessons)} suffix="+" label={t("home.stat.lessons")} />
          <StatCard value={niceFloor(totalTasks)} suffix="+" label={t("home.stat.tasks")} />
        </Reveal>


        {/* ── Niyə Imparo — növbələşən bölmələr ── */}
        <section className="space-y-16 py-6 sm:space-y-24">
          <Row reverse={false} tag={t("home.r1.tag")} title={t("home.r1.title")} body={t("home.r1.body")} media={<GameMedia />} />
          <Row reverse={true} tag={t("home.r2.tag")} title={t("home.r2.title")} body={t("home.r2.body")} media={<PathMedia />} />
          <Row reverse={false} tag={t("home.r3.tag")} title={t("home.r3.title")} body={t("home.r3.body")} media={<SubjectsMedia />} />
        </section>

        {/* ── Oyunlaşdırma vurğuları ── */}
        <Reveal className="py-14 sm:py-20">
          <SectionHead title={t("home.feat.title")} />
          <motion.div variants={stagger} className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FeatureChip Icon={Star} tint="text-brand" label={t("home.feat.xp")} />
            <FeatureChip Icon={Flame} tint="text-orange-500" label={t("home.feat.streak")} />
            <FeatureChip Icon={Trophy} tint="text-brand" label={t("home.feat.league")} />
            <FeatureChip Icon={Award} tint="text-brand" label={t("home.feat.badge")} />
          </motion.div>
        </Reveal>

        {/* ── İstənilən yerdə öyrən (app-yükləmə) ── */}
        <Reveal className="pb-14 sm:pb-20">
          <div className="grid items-center gap-8 rounded-3xl border border-line bg-gradient-to-br from-brand/10 to-accent/5 p-8 sm:p-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-extrabold text-fg sm:text-4xl">{t("home.app.title")}</h2>
              <p className="mt-3 text-lg text-muted lg:max-w-md">{t("home.app.body")}</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <StoreBadge Icon={Apple} top="Download on the" bottom="App Store" soon={t("home.app.soon")} />
                <StoreBadge Icon={Play} top="Get it on" bottom="Google Play" soon={t("home.app.soon")} />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                {/* Telefon ekranı — həmişə işıqlı (ağ/krem), tünd rejimdə də */}
                <div className="flex h-64 w-40 items-center justify-center rounded-[2.2rem] border-4 border-fg/80 bg-gradient-to-br from-white to-[#FFF4DF] shadow-2xl">
                  <Mascot size={110} mood="celebrate" />
                </div>
                <span className="absolute -right-3 -top-3 rounded-2xl bg-brand px-3 py-1.5 text-sm font-extrabold text-white shadow-lg">
                  <Smartphone size={16} className="inline" /> PWA
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Necə işləyir ── */}
        <Reveal className="pb-14 sm:pb-20">
          <SectionHead title={t("home.how.title")} />
          <motion.div variants={stagger} className="mt-8 grid gap-4 sm:grid-cols-3">
            <StepCard n={1} tint="from-brand to-brand-dark" title={t("home.how.s1.t")} desc={t("home.how.s1.d")} />
            <StepCard n={2} tint="from-brand to-brand-dark" title={t("home.how.s2.t")} desc={t("home.how.s2.d")} />
            <StepCard n={3} tint="from-brand to-brand-dark" title={t("home.how.s3.t")} desc={t("home.how.s3.d")} />
          </motion.div>
        </Reveal>

      </main>

      {/* ── Son CTA — TAM EN ──
          Qəsdən <main>-in (max-w-6xl) KƏNARINDADIR: narıncı zolaq cihazın bir
          kənarından o birinə uzansın. Daxili məzmun isə eyni max-w-6xl ilə
          məhdudlaşır ki, geniş ekranda mətn kənardan-kənara dartılmasın.
          Küncləri yumru DEYİL: ekran kənarına dayanan yumru künc kəsik görünür. */}
      <Reveal className="mt-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-dark px-5 py-16 text-center">
          <span className="twinkle pointer-events-none absolute left-[8%] top-8 text-white/60" aria-hidden>
            <Sparkles size={22} fill="currentColor" strokeWidth={0} />
          </span>
          <span
            className="twinkle pointer-events-none absolute right-[10%] top-16 text-white/50"
            style={{ animationDelay: "0.9s" }}
            aria-hidden
          >
            <Sparkles size={16} fill="currentColor" strokeWidth={0} />
          </span>
          <div className="mx-auto grid max-w-6xl grid-cols-2 items-center gap-6 sm:grid-cols-[auto_1fr_auto] sm:gap-8">
            {/* Sol — salamlayan Zefi. Kiçik ekranda sıra ilə mətndən SONRA gəlir
                (order-2), yəni telefonda əvvəl mesaj oxunur, sonra maskotlar. */}
            <div className="order-2 flex origin-bottom justify-center sm:order-1 lg:scale-125">
              <ZefiMascot emotion="welcome" size={148} disk={false} />
            </div>

            {/* Mərkəz — mesaj. Zefi kənara keçdiyi üçün burada yer boşaldı,
                başlıq da ona görə xeyli böyüdü. */}
            <div className="order-1 col-span-2 text-center sm:order-2 sm:col-span-1">
              <h2 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                {t("home.finalTitle")}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-white/90 sm:text-lg">
                {t("home.finalBody")}
              </p>
              {/* Yuxarıdakı hero düyməsi ilə eyni yerə: əvvəl sınayır, qeydiyyat sonra. */}
              <Link
                href="/onboarding"
                className="mt-8 inline-block rounded-2xl bg-white px-8 py-4 text-lg font-extrabold uppercase tracking-wide text-brand btn-pop [--pop:#c9c2f5] hover:bg-white/90"
              >
                {t("home.ctaStart")}
              </Link>
            </div>

            {/* Sağ — hədiyyəli Zefi */}
            <div className="order-3 flex origin-bottom justify-center lg:scale-125">
              <ZefiMascot emotion="gift" size={148} disk={false} />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Alt — Duolingo üslubu böyük footer */}
      <SiteFooter />
    </div>
  );
}

// ── Fon blob-ları (dekorativ, kliklənməz) ──
function Blobs() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="blob-float absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl" />
      <div
        className="blob-float absolute right-[-60px] top-40 h-80 w-80 rounded-full bg-accent/15 blur-3xl"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="blob-float absolute bottom-24 left-1/4 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
        style={{ animationDelay: "6s" }}
      />
    </div>
  );
}

// ── Scroll-reveal örtük ──
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function SectionHead({ title, body }: { title: string; body?: string }) {
  return (
    <motion.div variants={fadeUp} className="text-center">
      <h2 className="text-3xl font-extrabold text-fg sm:text-4xl">{title}</h2>
      {body && <p className="mx-auto mt-3 max-w-lg text-muted">{body}</p>}
    </motion.div>
  );
}

// Minlik ayırıcısı ƏL İLƏ qoyulur: `toLocaleString("az")` lokalda "10.000",
// Cloudflare Workers-də isə (ICU məhdud olduğu üçün en-ə düşərək) "10,000" verirdi —
// yəni rəqəm mühitdən asılı görünürdü. Dar boşluq hər yerdə eyni və AZ tipoqrafiyasına uyğundur.
function groupThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
}

function StatCard({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const n = useCountUp(value, 1200);
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-line bg-panel/80 py-5 text-center backdrop-blur-sm"
    >
      <div className="text-3xl font-extrabold text-brand sm:text-4xl">
        {groupThousands(n)}
        {suffix}
      </div>
      <div className="text-sm text-muted">{label}</div>
    </motion.div>
  );
}


function FeatureChip({
  Icon,
  tint,
  label,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tint: string;
  label: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-panel p-5 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-panel-2">
        <Icon size={26} className={tint} />
      </span>
      <span className="text-sm font-bold text-fg">{label}</span>
    </motion.div>
  );
}

// App Store / Google Play badge (rəsmi tətbiq hələ yoxdur → "Tezliklə").
function StoreBadge({
  Icon,
  top,
  bottom,
  soon,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  top: string;
  bottom: string;
  soon: string;
}) {
  return (
    <div className="relative flex cursor-default items-center gap-3 rounded-2xl bg-fg px-5 py-2.5 text-ink opacity-90">
      <Icon size={26} />
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wide opacity-70">{top}</span>
        <span className="block text-base font-extrabold">{bottom}</span>
      </span>
      <span className="absolute -right-2 -top-2 rounded-full bg-brand px-2 py-0.5 text-[9px] font-extrabold uppercase text-white shadow">
        {soon}
      </span>
    </div>
  );
}

function StepCard({ n, tint, title, desc }: { n: number; tint: string; title: string; desc: string }) {
  return (
    <motion.div variants={fadeUp} className="rounded-2xl border border-line bg-panel p-6 text-center">
      <span
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tint} text-xl font-extrabold text-white shadow-md`}
      >
        {n}
      </span>
      <div className="mt-4 font-extrabold text-fg">{title}</div>
      <div className="mt-1 text-sm text-muted">{desc}</div>
    </motion.div>
  );
}

// ── Növbələşən bölmə sətri (illüstrasiya + mətn), scroll-reveal ──
function Row({
  media,
  tag,
  title,
  body,
  reverse,
}: {
  media: ReactNode;
  tag: string;
  title: string;
  body: string;
  reverse: boolean;
}) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className={`flex flex-col items-center gap-8 lg:gap-14 ${
        reverse ? "lg:flex-row-reverse" : "lg:flex-row"
      }`}
    >
      <motion.div variants={fadeUp} className="w-full lg:w-1/2">
        {media}
      </motion.div>
      <motion.div variants={fadeUp} className="w-full text-center lg:w-1/2 lg:text-left">
        <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand ring-1 ring-brand/20">
          {tag}
        </span>
        <h2 className="mt-3 text-2xl font-extrabold text-fg sm:text-3xl">{title}</h2>
        <p className="mt-3 text-lg leading-relaxed text-muted">{body}</p>
      </motion.div>
    </motion.div>
  );
}

// Panel: oyunlaşdırma
function GameMedia() {
  const t = useT();
  return (
    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-line bg-brand/5">
      <div>
        <Mascot size={150} mood="celebrate" />
      </div>
      <span className="xp-pop absolute left-6 top-6 rounded-2xl bg-accent px-3 py-1.5 text-sm font-extrabold text-white shadow">
        +10 XP
      </span>
      <span className="absolute bottom-6 right-6 rounded-2xl bg-brand px-3 py-1.5 text-sm font-extrabold text-white shadow">
        {t("home.streakBadge")}
      </span>
      <span className="twinkle pointer-events-none absolute right-10 top-10 text-amber-300" aria-hidden>
        <Sparkles size={18} fill="currentColor" strokeWidth={0} />
      </span>
    </div>
  );
}

// Panel: öyrənmə yolu (mini path, 3D düyünlər)
function PathMedia() {
  const nodes = [
    { done: true },
    { done: true },
    { done: false, current: true },
    { done: false },
  ];
  return (
    <div className="flex aspect-[4/3] items-center justify-center rounded-3xl border border-line bg-accent/10">
      <div className="flex items-center gap-2">
        {nodes.map((n, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-extrabold text-white ${
                n.done ? "bg-emerald-500" : n.current ? "node-bob bg-amber-500" : "bg-panel-2 text-muted"
              }`}
              style={{
                boxShadow: n.done
                  ? "0 5px 0 0 #15803d"
                  : n.current
                    ? "0 5px 0 0 #c98703"
                    : "0 5px 0 0 var(--color-line)",
              }}
            >
              {n.done ? <Check size={22} strokeWidth={3} /> : n.current ? <Star size={22} fill="currentColor" /> : i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Panel: fənlər. Giriş etməmiş vitrin — fənləri adına görə təkrarsız göstəririk.
function SubjectsMedia() {
  const { subjects } = useContent();
  const unique = subjects.filter((s, i, arr) => arr.findIndex((x) => x.name === s.name) === i);
  return (
    <div className="flex aspect-[4/3] flex-col justify-center gap-3 rounded-3xl border border-line bg-brand/5 p-8">
      {unique.map((s) => (
        <div
          key={s.name}
          className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            {s.icon}
          </span>
          <span className="font-bold text-fg">{s.name}</span>
        </div>
      ))}
    </div>
  );
}
