// Fənnin vizual nişanı — ikon + öz rəngi. Məzmunda fənnin `icon` sahəsi sadəcə hərfdir
// ("R", "A"), seçicidə tək "R" uşağa heç nə demirdi. Slug prefiksinə görə seçilir,
// yeni fənn əlavə olunanda tanınmasa hərfə qayıdır.

import {
  Calculator, BookOpenText, Languages, ShieldCheck, PiggyBank, Bot, LockKeyhole,
  type LucideIcon,
} from "lucide-react";

const VISUALS: { prefix: string; Icon: LucideIcon; color: string }[] = [
  { prefix: "riyaziyyat", Icon: Calculator, color: "#f47b3a" },
  { prefix: "azerbaycan-dili", Icon: BookOpenText, color: "#ff6b5e" },
  { prefix: "ingilis-dili", Icon: Languages, color: "#2fb170" },
  { prefix: "reqemsal-tehlukesizlik", Icon: ShieldCheck, color: "#0ea5e9" },
  { prefix: "maliyye-savadliligi", Icon: PiggyBank, color: "#e9a23b" },
  { prefix: "suni-intellekt", Icon: Bot, color: "#8b5cf6" },
  { prefix: "kibertehlukesizlik", Icon: LockKeyhole, color: "#4f46e5" },
];

export function subjectVisual(slug: string) {
  return VISUALS.find((v) => slug.startsWith(v.prefix)) ?? null;
}

export default function SubjectBadge({
  slug,
  fallback,
  size = 40,
  muted = false,
}: {
  slug: string;
  fallback: string;
  size?: number;
  /** Seçilməmiş fənn (açılan siyahıda): açıq fon + rəngli ikon. */
  muted?: boolean;
}) {
  const v = subjectVisual(slug);
  const color = v?.color ?? "#f47b3a";
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl font-bold"
      style={{
        width: size,
        height: size,
        background: muted ? `${color}1f` : color,
        color: muted ? color : "#fff",
        fontSize: size * 0.45,
      }}
      aria-hidden
    >
      {v ? <v.Icon size={Math.round(size * 0.52)} strokeWidth={2.4} /> : fallback}
    </span>
  );
}
