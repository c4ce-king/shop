"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Props = {
  open: boolean;
  onClose: () => void;
  onAuthed?: () => void; // callback after success
};

export function AuthModal({ open, onClose, onAuthed }: Props) {
  const auth = useAuth();

  const [tab, setTab] = React.useState<"login" | "register">("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [mounted, setMounted] = React.useState(false);
  const [phase, setPhase] = React.useState<"enter" | "exit">("enter");

  const EXIT_MS = 500;

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      setPhase("enter");
      setErr(null);
      setBusy(false);
      setTab("login");
      setName("");
      setEmail("");
      setPass("");
    } else if (mounted) {
      setPhase("exit");
      const t = window.setTimeout(() => setMounted(false), EXIT_MS);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const inputFancy =
    "mt-2 w-full rounded-xl border px-4 py-3 text-[13px] outline-none transition " +
    "bg-[rgba(15,23,42,0.02)] " +
    "border-[rgb(var(--border))] placeholder:text-black/35 " +
    "hover:bg-[rgba(15,23,42,0.03)] hover:border-[rgb(var(--border-strong))] " +
    "focus:bg-white focus:border-[rgb(var(--border-strong))] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.06)]";

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      if (tab === "login") {
        await auth.login(email, pass);
      } else {
        await auth.register(name, email, pass);
      }
      onAuthed?.();
      onClose();
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Greška.");
    } finally {
      setBusy(false);
    }
  }

  const overlayCls = cx(
    "fixed inset-0 z-[90] bg-black/60",
    phase === "enter" ? "animate-micOverlayIn" : "animate-micOverlayOut"
  );

  const panelCls = cx(
    "mic-card w-full max-w-[520px] p-5 shadow-[0_34px_110px_rgba(0,0,0,0.42)]",
    phase === "enter" ? "animate-micPanelIn" : "animate-micPanelOut"
  );

  return (
    <>
      <style>{`
        @keyframes micOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes micOverlayOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes micPanelIn {
          0% { opacity: 0; transform: translateY(26px) scale(0.90); }
          60% { opacity: 1; transform: translateY(-8px) scale(1.03); }
          100% { opacity: 1; transform: translateY(0px) scale(1.0); }
        }
        @keyframes micPanelOut {
          from { opacity: 1; transform: translateY(0px) scale(1.0); }
          to { opacity: 0; transform: translateY(14px) scale(0.97); }
        }
        .animate-micOverlayIn { animation: micOverlayIn 170ms ease-out both; }
        .animate-micOverlayOut { animation: micOverlayOut 240ms ease-in both; }
        .animate-micPanelIn { animation: micPanelIn 420ms cubic-bezier(.16,1.05,.22,1.0) both; }
        .animate-micPanelOut { animation: micPanelOut ${EXIT_MS}ms cubic-bezier(.2,.8,.2,1) both; }
      `}</style>

      <button type="button" className={overlayCls} onClick={onClose} aria-label="Zatvori" />

      <div className="fixed inset-0 z-[91] flex items-center justify-center px-3" role="dialog" aria-modal="true">
        <div className={panelCls} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] font-semibold">Nalog</div>
              <div className="mt-1 text-[12px] mic-muted">Uloguj se da aktiviraš obaveštenje.</div>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl px-4 h-9 text-[12px] font-semibold bg-black/[0.04] hover:bg-black/[0.06] transition"
              onClick={onClose}
              disabled={busy}
            >
              Zatvori
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className={cx(
                "h-9 px-4 rounded-xl text-[12px] font-semibold transition",
                tab === "login" ? "bg-black text-white" : "bg-black/[0.04] hover:bg-black/[0.06]"
              )}
              onClick={() => setTab("login")}
              disabled={busy}
            >
              Login
            </button>
            <button
              type="button"
              className={cx(
                "h-9 px-4 rounded-xl text-[12px] font-semibold transition",
                tab === "register" ? "bg-black text-white" : "bg-black/[0.04] hover:bg-black/[0.06]"
              )}
              onClick={() => setTab("register")}
              disabled={busy}
            >
              Registracija
            </button>
          </div>

          <div className="mt-4 grid gap-4">
            {tab === "register" ? (
              <div>
                <div className="text-[12px] font-semibold text-black/70">Ime (opciono)</div>
                <input className={inputFancy} value={name} onChange={(e) => setName(e.target.value)} placeholder="npr. Pera" disabled={busy} />
              </div>
            ) : null}

            <div>
              <div className="text-[12px] font-semibold text-black/70">Email</div>
              <input className={inputFancy} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@domen.com" disabled={busy} />
            </div>

            <div>
              <div className="text-[12px] font-semibold text-black/70">Lozinka</div>
              <input className={inputFancy} type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Minimum 8 karaktera" disabled={busy} />
            </div>

            {err ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{err}</div>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className={cx(busy ? "mic-btn" : "mic-btn-primary", "h-10 px-5 text-[12px]", busy && "opacity-70")}
                onClick={submit}
                disabled={busy}
              >
                {busy ? "Radim…" : tab === "login" ? "Uloguj se" : "Napravi nalog"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}