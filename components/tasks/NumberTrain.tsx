// Ədəd qatarı: [ 5 ] → [ 6 ] → [ ? ] — kiçik sinif şagirdi sıranı GÖRÜR.
import { ArrowRight } from "lucide-react";
import type { TrainItem } from "@/lib/numberHints";

export default function NumberTrain({ items }: { items: TrainItem[] }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-hidden>
      {items.map((n, i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && <ArrowRight size={22} className="text-muted" strokeWidth={2.6} />}
          <span
            className={`flex h-14 min-w-14 items-center justify-center rounded-2xl px-3 text-3xl font-extrabold ${
              n === null
                ? "border-[3px] border-dashed border-brand bg-brand/10 text-brand"
                : "border-2 border-line bg-card text-fg shadow-[0_3px_0_0_var(--color-line)]"
            }`}
          >
            {n === null ? "?" : n}
          </span>
        </div>
      ))}
    </div>
  );
}
