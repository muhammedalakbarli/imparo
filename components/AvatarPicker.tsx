"use client";

// Avatar seçici — personaj + fon rəngi. Seçim dəyişəndə onChange ilə konfiq qaytarır.

import Avatar, { AVATAR_CHARS, AVATAR_BGS, type AvatarConfig } from "./Avatar";

export default function AvatarPicker({
  value,
  onChange,
}: {
  value: AvatarConfig;
  onChange: (c: AvatarConfig) => void;
}) {
  return (
    <div>
      {/* Önizləmə */}
      <div className="flex justify-center">
        <Avatar config={value} size={96} />
      </div>

      {/* Personaj */}
      <div className="mt-5 text-xs font-bold uppercase tracking-wide text-muted">
        Personaj
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {AVATAR_CHARS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange({ ...value, char: c })}
            className={`rounded-2xl border-2 p-1 transition ${
              value.char === c ? "border-brand" : "border-line hover:border-brand/50"
            }`}
          >
            <Avatar config={{ char: c, bg: value.bg }} size={44} />
          </button>
        ))}
      </div>

      {/* Fon rəngi */}
      <div className="mt-5 text-xs font-bold uppercase tracking-wide text-muted">
        Fon rəngi
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {AVATAR_BGS.map((bg) => (
          <button
            key={bg}
            type="button"
            aria-label={bg}
            onClick={() => onChange({ ...value, bg })}
            className={`h-10 w-10 rounded-full border-2 transition ${
              value.bg === bg ? "border-fg scale-110" : "border-line"
            }`}
            style={{ background: bg }}
          />
        ))}
      </div>
    </div>
  );
}
