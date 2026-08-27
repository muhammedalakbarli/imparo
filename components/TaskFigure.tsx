// Tapşırığın yanında göstərilən şəkil (illüstrasiya).
// Sualı uşaqlar üçün daha aydın və maraqlı edir.

import type { TaskFigure as Figure } from "@/lib/types";

function Bar({ parts, filled }: { parts: number; filled: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: parts }).map((_, i) => (
        <div
          key={i}
          className={`h-9 flex-1 rounded border-2 ${
            i < filled ? "border-brand bg-brand" : "border-line bg-panel-2"
          }`}
        />
      ))}
    </div>
  );
}

export default function TaskFigure({ figure }: { figure?: Figure }) {
  if (!figure) return null;

  let content = null;

  if (figure.kind === "fractionBar") {
    content = <Bar parts={figure.parts} filled={figure.filled} />;
  } else if (figure.kind === "compareBars") {
    content = (
      <div className="space-y-2">
        <Bar parts={figure.a.parts} filled={figure.a.filled} />
        <Bar parts={figure.b.parts} filled={figure.b.filled} />
      </div>
    );
  } else if (figure.kind === "dots") {
    const filled = figure.filled ?? 0;
    content = (
      <div className="mx-auto grid max-w-[280px] grid-cols-8 gap-1.5">
        {Array.from({ length: figure.total }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square rounded-full ${
              i < filled ? "bg-brand" : "bg-panel-2"
            }`}
          />
        ))}
      </div>
    );
  } else if (figure.kind === "emoji") {
    content = (
      <div className="flex flex-wrap justify-center gap-1.5 text-2xl">
        {figure.items.map((e, i) => (
          <span key={i}>{e}</span>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-ink/60 p-4">
      {content}
    </div>
  );
}
