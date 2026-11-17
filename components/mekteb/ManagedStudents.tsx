"use client";

// Müəllim paneli · e-poçtsuz şagird hesabları (0065).
// Müəllim adları alt-alta yapışdırır → hər şagirdə hesab + 4 rəqəmli PIN yaranır →
// giriş kartları çap olunur. Şagird imparo.app/sinif-də sinif kodu + adı + PIN ilə girir.
// PIN müəllimə görünür (uşaqlar unudacaq) və bir kliklə yenilənir.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, Printer, RefreshCw, Trash2, UserPlus, Lock, Check, Pencil, X } from "lucide-react";
import {
  classManagedStudents, createManagedStudents, deleteManagedStudent, renameManagedStudent, resetStudentPin,
  type ManagedStudent,
} from "@/lib/schools";
import { MAX_NAMES_PER_PASTE, parseStudentNames } from "@/lib/managedStudents";
import { azShortDate } from "@/lib/azDate";

function fmtLogin(s: string | null): string {
  if (!s) return "Hələ daxil olmayıb";
  return azShortDate(s);
}

export default function ManagedStudents({
  classId,
  classCode,
  onChanged,
}: {
  classId: string;
  classCode: string;
  onChanged?: () => void;
}) {
  const [list, setList] = useState<ManagedStudent[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [fresh, setFresh] = useState<string | null>(null); // yeni PIN-i vurğulamaq üçün
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  // Ad şagird üçün kilidlidir (0067) — səhv yazılmış adı müəllim burada düzəldir.
  const [editing, setEditing] = useState<{ uid: string; name: string } | null>(null);
  const [renameErr, setRenameErr] = useState<string | null>(null);

  const load = useCallback(() => {
    classManagedStudents(classId).then(setList);
  }, [classId]);
  useEffect(load, [load]);

  const parsed = useMemo(() => parseStudentNames(text), [text]);
  const tooMany = parsed.names.length > MAX_NAMES_PER_PASTE;
  const open = adding || (list !== null && list.length === 0);

  async function create() {
    if (busy || parsed.names.length === 0 || tooMany) return;
    setBusy(true);
    setMsg(null);
    setProgress(`Yaradılır… 0/${parsed.names.length}`);
    const r = await createManagedStudents(classId, parsed.names, (d, t) => setProgress(`Yaradılır… ${d}/${t}`));
    setBusy(false);
    setProgress(null);
    if (r.error) {
      setMsg({ ok: false, text: `${r.created} hesab yaradıldı, qalanı alınmadı: ${r.error}` });
    } else if (r.failed.length) {
      setMsg({ ok: false, text: `${r.created} hesab yaradıldı. Alınmayanlar: ${r.failed.join(", ")}` });
    } else {
      setMsg({ ok: true, text: `${r.created} şagird hesabı hazırdır. İndi giriş kartlarını çap edin.` });
      setText("");
      setAdding(false);
    }
    load();
    onChanged?.();
  }

  async function reset(uid: string) {
    const pin = await resetStudentPin(uid).catch(() => null);
    if (!pin) return;
    setList((l) => l?.map((s) => (s.user_id === uid ? { ...s, pin, locked_until: null } : s)) ?? l);
    setFresh(uid);
    setTimeout(() => setFresh((f) => (f === uid ? null : f)), 4000);
  }

  async function rename() {
    if (!editing) return;
    const { uid, name } = editing;
    const clean = await renameManagedStudent(uid, name).catch(() => null);
    if (!clean) {
      setRenameErr(uid);
      return;
    }
    setRenameErr(null);
    setEditing(null);
    setList((l) => l?.map((s) => (s.user_id === uid ? { ...s, full_name: clean } : s)) ?? l);
    onChanged?.();
  }

  async function remove(uid: string) {
    await deleteManagedStudent(uid).catch(() => null);
    setConfirmDel(null);
    load();
    onChanged?.();
  }

  return (
    <section className="mt-6 rounded-2xl border border-line bg-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
            <KeyRound size={18} className="text-brand" /> E-poçtsuz şagird hesabları
          </h2>
          <p className="mt-1 text-sm text-muted">
            E-poçtu olmayan şagirdlər (1–4-cü siniflər) <b className="text-fg">imparo.app/sinif</b> ünvanında sinif
            kodu (<span className="font-mono font-bold text-brand">{classCode}</span>), öz adı və 4 rəqəmli PIN ilə
            daxil olur.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {list && list.length > 0 && (
            <Link
              href={`/mekteb/sinif/${classId}/kartlar`}
              className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-bold text-white hover:bg-brand-dark"
            >
              <Printer size={15} /> Giriş kartları
            </Link>
          )}
          {list && list.length > 0 && !adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 rounded-xl border-2 border-line px-3 py-2 text-sm font-bold text-fg hover:border-brand"
            >
              <UserPlus size={15} /> Əlavə et
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-4">
          <label htmlFor="ms-names" className="text-sm font-bold text-fg">
            Şagirdlərin adları — hər sətirdə bir nəfər
          </label>
          <textarea
            id="ms-names"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={"Aysel Məmmədova\nTural Həsənov\nNigar Əliyeva"}
            className="mt-1.5 w-full rounded-2xl border-2 border-line bg-ink px-4 py-3 font-mono text-sm text-fg outline-none focus:border-brand"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className={`text-sm ${tooMany ? "font-bold text-red-500" : "text-muted"}`}>
              {parsed.names.length} ad tanındı
              {parsed.skipped.length > 0 && ` · ${parsed.skipped.length} sətir buraxıldı (təkrar və ya boş)`}
              {tooMany && ` · bir dəfəyə ən çox ${MAX_NAMES_PER_PASTE}`}
            </p>
            <div className="flex gap-2">
              {adding && (
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-xl px-3 py-2 text-sm font-bold text-muted hover:text-fg"
                >
                  Ləğv et
                </button>
              )}
              <button
                type="button"
                onClick={create}
                disabled={busy || parsed.names.length === 0 || tooMany}
                className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                <UserPlus size={15} /> {progress ?? `Hesabları yarat (${parsed.names.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <p className={`mt-3 rounded-xl px-3.5 py-2 text-sm font-semibold ${msg.ok ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
          {msg.text}
        </p>
      )}

      {list && list.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line bg-panel-2 text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-bold">Şagird</th>
                <th className="px-3 py-2 font-bold">PIN</th>
                <th className="px-3 py-2 font-bold">Son giriş</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.user_id} className="border-b border-line/60 last:border-b-0">
                  <td className="px-3 py-2 font-semibold text-fg">
                    {editing?.uid === s.user_id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void rename();
                        }}
                        className="flex items-center gap-1"
                      >
                        <input
                          autoFocus
                          value={editing.name}
                          onChange={(e) => setEditing({ uid: s.user_id, name: e.target.value })}
                          onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                          maxLength={60}
                          aria-label="Şagirdin adı"
                          className="w-full min-w-0 rounded-lg border-2 border-line bg-card px-2 py-1 text-sm font-semibold text-fg outline-none focus:border-brand"
                        />
                        <button
                          type="submit"
                          disabled={editing.name.trim().length < 2}
                          aria-label="Yadda saxla"
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/10 disabled:opacity-40"
                        >
                          <Check size={15} strokeWidth={3} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          aria-label="Ləğv et"
                          className="rounded-lg p-1.5 text-muted hover:bg-panel-2"
                        >
                          <X size={15} />
                        </button>
                      </form>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        {s.full_name}
                        <button
                          type="button"
                          onClick={() => {
                            setEditing({ uid: s.user_id, name: s.full_name });
                            setRenameErr(null);
                          }}
                          title="Adı düzəlt"
                          aria-label={`${s.full_name} — adı düzəlt`}
                          className="rounded-md p-1 text-muted hover:bg-panel-2 hover:text-fg"
                        >
                          <Pencil size={12} />
                        </button>
                      </span>
                    )}
                    {renameErr === s.user_id && (
                      <span className="mt-0.5 block text-[11px] font-bold text-red-500">Ad dəyişmədi, yenidən yoxlayın</span>
                    )}
                    {s.locked_until && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                        <Lock size={10} /> Bloklanıb
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-lg px-2 py-1 font-mono text-base font-extrabold tracking-[0.2em] transition-colors ${
                        fresh === s.user_id ? "bg-emerald-500/15 text-emerald-600" : "text-brand"
                      }`}
                    >
                      {s.pin}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">{fmtLogin(s.last_login_at)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => reset(s.user_id)}
                      title="Yeni PIN ver (blok da açılır)"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-muted hover:bg-panel-2 hover:text-fg"
                    >
                      {fresh === s.user_id ? <Check size={14} className="text-emerald-600" /> : <RefreshCw size={14} />} PIN
                    </button>
                    {confirmDel === s.user_id ? (
                      <button
                        type="button"
                        onClick={() => remove(s.user_id)}
                        className="ml-1 rounded-lg bg-red-500 px-2 py-1.5 text-xs font-bold text-white hover:bg-red-600"
                      >
                        Silinsin? Bəli
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDel(s.user_id)}
                        title="Hesabı sil (irəliləyiş də silinir)"
                        className="ml-1 rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
