"use client";

import * as React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isValidEmail(input: string): boolean {
  const s = input.trim();
  if (s.length < 6 || s.length > 190) return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  return re.test(s);
}

function fireAuthOpen(payload: { mode: "login" | "register"; reason: "notify"; productId: number; productName: string }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("shop:auth:open", { detail: payload }));
}

export function NotifyMeModal({ open, onClose, productId, productName }: Props) {
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [note, setNote] = React.useState("");

  const [status, setStatus] = React.useState<"idle" | "sending" | "ok" | "err" | "need_auth">("idle");
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  const [mounted, setMounted] = React.useState(false);
  const [phase, setPhase] = React.useState<"enter" | "exit">("enter");

  const [shake, setShake] = React.useState(false);
  const [successPulse, setSuccessPulse] = React.useState(false);

  const EXIT_MS = 900;
  const AUTO_CLOSE_MS = 4500;

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      setPhase("enter");

      setEmail("");
      setPhone("");
      setNote("");
      setStatus("idle");
      setErrMsg(null);
      setShake(false);
      setSuccessPulse(false);
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

  const emailOk = isValidEmail(email);
  const canSend = emailOk && status !== "sending" && status !== "ok";

  async function onSubmit() {
    // ✅ Ako nema ID (ili je 0) — NE tehnička poruka, nego auth flow (kako si tražio)
    if (!productId || productId <= 0) {
      setStatus("need_auth");
      setErrMsg("Morate biti ulogovani da bismo sačuvali obaveštenje.");
      setShake(true);
      window.setTimeout(() => setShake(false), 520);

      // opciono: odmah otvori login
      fireAuthOpen({ mode: "login", reason: "notify", productId: 0, productName });
      return;
    }

    if (!canSend) {
      setShake(true);
      window.setTimeout(() => setShake(false), 520);

      if (!emailOk) {
        setStatus("err");
        setErrMsg("Unesi validan email (npr. ime@domen.com).");
      }
      return;
    }

    setStatus("sending");
    setErrMsg(null);
    setShake(false);
    setSuccessPulse(false);

    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          product_id: productId,
          email: email.trim(),
          phone: phone.trim() || null,
          note: note.trim() || null,
          source: "listing",
        }),
      });

      // 401 / Unauthenticated => auth flow
      if (res.status === 401) {
        setStatus("need_auth");
        setErrMsg("Morate biti ulogovani da bismo sačuvali obaveštenje.");

        setShake(true);
        window.setTimeout(() => setShake(false), 520);

        fireAuthOpen({ mode: "login", reason: "notify", productId, productName });
        return;
      }

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        const msgRaw = (json && (json.message || json.error)) || "Nešto nije u redu. Pokušaj ponovo.";
        const msg = String(msgRaw);

        // fallback: ako backend vrati 200/4xx sa tekstom "Unauthenticated."
        if (msg.toLowerCase().includes("unauthenticated")) {
          setStatus("need_auth");
          setErrMsg("Morate biti ulogovani da bismo sačuvali obaveštenje.");
          setShake(true);
          window.setTimeout(() => setShake(false), 520);
          fireAuthOpen({ mode: "login", reason: "notify", productId, productName });
          return;
        }

        setStatus("err");
        setErrMsg(msg);

        setShake(true);
        window.setTimeout(() => setShake(false), 520);
        return;
      }

      setStatus("ok");
      setErrMsg(null);

      setSuccessPulse(true);
      window.setTimeout(() => setSuccessPulse(false), 900);

      setTimeout(() => onClose(), AUTO_CLOSE_MS);
    } catch (e: any) {
      setStatus("err");
      setErrMsg(e?.message ? String(e.message) : "Network greška.");

      setShake(true);
      window.setTimeout(() => setShake(false), 520);
    }
  }

  const overlayCls = cx(
    "fixed inset-0 z-[90] bg-black/60",
    phase === "enter" ? "animate-micOverlayIn" : "animate-micOverlayOut"
  );

  const panelWrapCls = "fixed inset-0 z-[91] flex items-center justify-center px-3";

  const panelCls = cx(
    "mic-card w-full max-w-[560px] p-5",
    "shadow-[0_34px_110px_rgba(0,0,0,0.42)]",
    "will-change-transform",
    phase === "enter" ? "animate-micPanelIn" : "animate-micPanelOut",
    shake && "animate-micShake",
    successPulse && "animate-micSuccessPulse"
  );

  const labelCls = "text-[12px] font-semibold text-black/70";
  const hintCls = "mt-1 text-[11px] mic-muted-2";

  // ✅ sivi border + professional “soft” input look
  const inputFancy =
    "mt-2 w-full rounded-xl border px-4 py-3 text-[13px] outline-none transition " +
    "bg-[rgba(15,23,42,0.02)] text-[rgb(var(--text))] " +
    "border-[rgb(var(--border))] " +
    "placeholder:text-black/35 " +
    "hover:bg-[rgba(15,23,42,0.03)] hover:border-[rgb(var(--border-strong))] " +
    "focus:bg-white focus:border-[rgb(var(--border-strong))] focus:shadow-[0_0_0_4px_rgba(15,23,42,0.06)]";

  const textareaFancy = cx(inputFancy, "min-h-[110px] resize-none");
  const emailErrorInline = status !== "sending" && status !== "ok" && email.trim() !== "" && !emailOk;

  // ✅ Close button: MIC-ish ghost (no border)
  const closeBtn =
    "inline-flex items-center justify-center rounded-xl px-4 " +
    "h-9 text-[12px] font-semibold " +
    "bg-black/[0.04] text-[rgb(var(--text))] " +
    "shadow-[0_1px_0_rgba(15,23,42,0.06)] " +
    "transition hover:bg-black/[0.06] hover:shadow-[0_6px_18px_rgba(15,23,42,0.10)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  // ✅ Auth button: primary MIC yellow
  const authBtn =
    "inline-flex items-center justify-center rounded-xl px-4 " +
    "h-9 text-[12px] font-semibold text-white " +
    "bg-[rgb(var(--accent))] shadow-[0_10px_24px_rgba(0,0,0,0.16)] " +
    "transition hover:bg-[rgb(var(--accent-600))] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20";

  return (
    <>
      <style>{`
        @keyframes micOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes micOverlayOut { from { opacity: 1; } to { opacity: 0; } }

        @keyframes micPanelIn {
          0%   { opacity: 0; transform: translateY(34px) scale(0.82); }
          55%  { opacity: 1; transform: translateY(-10px) scale(1.06); }
          78%  { opacity: 1; transform: translateY(0px)  scale(0.99); }
          100% { opacity: 1; transform: translateY(0px)  scale(1.0); }
        }

        @keyframes micPanelOut {
          from { opacity: 1; transform: translateY(0px) scale(1.0); }
          to   { opacity: 0; transform: translateY(18px) scale(0.965); }
        }

        @keyframes micShake {
          0% { transform: translateX(0); }
          12% { transform: translateX(-6px); }
          24% { transform: translateX(6px); }
          36% { transform: translateX(-5px); }
          48% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          72% { transform: translateX(3px); }
          84% { transform: translateX(-1px); }
          100% { transform: translateX(0); }
        }

        @keyframes micSuccessPulse {
          0% { box-shadow: 0 34px 110px rgba(0,0,0,0.42), 0 0 0 rgba(245,158,11,0); }
          35% { box-shadow: 0 34px 110px rgba(0,0,0,0.42), 0 0 0 10px rgba(245,158,11,0.16); }
          70% { box-shadow: 0 34px 110px rgba(0,0,0,0.42), 0 0 0 0px rgba(245,158,11,0.00); }
          100% { box-shadow: 0 34px 110px rgba(0,0,0,0.42), 0 0 0 0px rgba(245,158,11,0.00); }
        }

        .animate-micOverlayIn { animation: micOverlayIn 170ms ease-out both; }
        .animate-micOverlayOut { animation: micOverlayOut 260ms ease-in both; }

        .animate-micPanelIn { animation: micPanelIn 460ms cubic-bezier(.16,1.05,.22,1.0) both; transform-origin: 50% 60%; }
        .animate-micPanelOut { animation: micPanelOut ${EXIT_MS}ms cubic-bezier(.2,.8,.2,1) both; }

        .animate-micShake { animation: micShake 520ms ease-in-out both; }
        .animate-micSuccessPulse { animation: micSuccessPulse 900ms ease-out both; }
      `}</style>

      <button type="button" className={overlayCls} onClick={onClose} aria-label="Zatvori" />

      <div className={panelWrapCls} role="dialog" aria-modal="true" aria-label="Obavesti me">
        <div className={panelCls} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold">Obavesti me</div>
              <div className="mt-1 text-[12px] mic-muted line-clamp-2">{productName}</div>
            </div>

            <button type="button" className={closeBtn} onClick={onClose} title="Zatvori" disabled={status === "sending"}>
              Zatvori
            </button>
          </div>

          <div className="mt-4 grid gap-4">
            <div>
              <div className={labelCls}>Email</div>
              <input
                className={cx(
                  inputFancy,
                  emailErrorInline && "border-red-300 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"
                )}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="npr. ime@domen.com"
                inputMode="email"
                autoComplete="email"
                disabled={status === "sending" || status === "ok" || status === "need_auth"}
              />
              <div className={hintCls}>Koristimo ga samo da te obavestimo kad proizvod bude dostupan.</div>
              {emailErrorInline ? (
                <div className="mt-1 text-[11px] text-red-600 font-semibold">Email nije validan.</div>
              ) : null}
            </div>

            <div>
              <div className={labelCls}>Telefon (opciono)</div>
              <input
                className={inputFancy}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="npr. +381 60 123 456"
                inputMode="tel"
                autoComplete="tel"
                disabled={status === "sending" || status === "ok" || status === "need_auth"}
              />
            </div>

            <div>
              <div className={labelCls}>Napomena (opciono)</div>
              <textarea
                className={textareaFancy}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Npr. želim obaveštenje za 2 komada / preferiram Viber…"
                disabled={status === "sending" || status === "ok" || status === "need_auth"}
              />
            </div>

            {status === "err" && errMsg ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {errMsg}
              </div>
            ) : null}

            {status === "need_auth" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                Morate biti ulogovani da bismo sačuvali obaveštenje.
              </div>
            ) : null}

            {status === "ok" ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
                Bićete obavešteni ✅ kada proizvod ponovo bude dostupan.
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="text-[11px] mic-muted-2">
                {status === "need_auth"
                  ? "Morate biti ulogovani — izaberite Uloguj se ili Registruj se."
                  : "Klikom na “Pošalji” čuvamo prijavu u bazi."}
              </div>

              {status === "need_auth" ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={authBtn}
                    onClick={() => fireAuthOpen({ mode: "login", reason: "notify", productId, productName })}
                    title="Uloguj se"
                  >
                    Uloguj se
                  </button>

                  <button
                    type="button"
                    className={closeBtn}
                    onClick={() => fireAuthOpen({ mode: "register", reason: "notify", productId, productName })}
                    title="Registruj se"
                  >
                    Registruj se
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={cx(
                    canSend ? "mic-btn-primary" : "mic-btn",
                    "h-10 px-5 text-[12px]",
                    !canSend && "opacity-50"
                  )}
                  onClick={onSubmit}
                  disabled={!canSend}
                >
                  {status === "sending" ? "Šaljem…" : "Pošalji"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}