"use client";

// Promise əsaslı təsdiq dialoqu — window.confirm() əvəzi (peşəkar modal).
// İstifadə: const confirm = useConfirm(); if (await confirm({ title, message, danger })) { ... }

import { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle } from "lucide-react";

type ConfirmOpts = { title: string; message?: string; confirmText?: string; danger?: boolean };
type Resolver = (v: boolean) => void;

const Ctx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const [resolver, setResolver] = useState<{ fn: Resolver } | null>(null);

  const confirm = useCallback((o: ConfirmOpts) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => setResolver({ fn: resolve }));
  }, []);

  const close = (v: boolean) => { resolver?.fn(v); setResolver(null); setOpts(null); };

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {opts && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => close(false)}>
          <div className="w-full max-w-sm rounded-[12px] bg-panel p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              {opts.danger && (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-red-500/10 text-red-500">
                  <AlertTriangle size={20} />
                </span>
              )}
              <div>
                <h2 className="text-lg font-bold text-fg">{opts.title}</h2>
                {opts.message && <p className="mt-1 text-sm text-muted">{opts.message}</p>}
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => close(true)}
                className={`flex-1 rounded-[10px] px-4 py-2.5 font-semibold text-white btn-pop ${opts.danger ? "bg-red-500 hover:bg-red-600 [--pop:#b91c1c]" : "bg-brand hover:bg-brand-dark"}`}
              >
                {opts.confirmText ?? "Təsdiq et"}
              </button>
              <button onClick={() => close(false)} className="rounded-[10px] border border-line px-4 py-2.5 font-bold text-fg hover:border-brand">
                Ləğv et
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
