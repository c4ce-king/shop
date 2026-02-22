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

function isValidEmail(s: string) {
  const t = s.trim();
  return t.length >= 5 && t.includes("@");
}

export function NotifyMeModal({ open, onClose, productId, productName }: Props) {
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [note, setNote] = React.useState("");

  const [status, setStatus] = React.useState<"idle" | "sending" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setEmail("");
    setPhone("");
    setNote("");
    setStatus("idle");
    setErrMsg(null);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSend = isValidEmail(email) && status !== "sending";

  async function onSubmit() {
    if (!canSend) return;

    setStatus("sending");
    setErrMsg(null);

    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          product_id: productId,
          email: email.trim(),
          phone: phone.trim() || null,
          note: note.trim() || null,
          source: "pdp",
        }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        const msg =
          (json && (json.message || json.error)) ||
          "Nešto nije u redu. Pokušaj ponovo.";
        setStatus("err");
        setErrMsg(String(msg));
        return;
      }

      setStatus("ok");
      setErrMsg(null);

      // UX: zatvori brzo posle success-a
      setTimeout(() => onClose(), 900);
    } catch (e: any) {
      setStatus("err");
      setErrMsg(e?.message ? String(e.message) : "Network greška.");
    }
  }

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Zatvori"
      />

      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2">
        <div className="mic-card p-4 shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold">Obavesti me</div>
              <div className="mt-1 text-[12px] mic-muted line-clamp-2">
                {productName}
              </div>
            </div>

            <button
              type="button"
              className="mic-btn h-8 px-3 text-[12px]"
              onClick={onClose}
              title="Zatvori"
              disabled={status === "sending"}
            >
              Zatvori
            </button>
          </div>

          <div className="mt-3 grid gap-3">
            <div>
              <div className="text-[12px] font-semibold text-black/70">Email</div>
              <input
                className="mic-input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="npr. pera@email.com"
                inputMode="email"
                autoComplete="email"
                disabled={status === "sending" || status === "ok"}
              />
            </div>

            <div>
              <div className="text-[12px] font-semibold text-black/70">Telefon (opciono)</div>
              <input
                className="mic-input mt-1"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="npr. +3816..."
                inputMode="tel"
                autoComplete="tel"
                disabled={status === "sending" || status === "ok"}
              />
            </div>

            <div>
              <div className="text-[12px] font-semibold text-black/70">Napomena (opciono)</div>
              <textarea
                className={cx("mic-input mt-1", "h-[88px] py-2")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ako imaš dodatni zahtev..."
                disabled={status === "sending" || status === "ok"}
              />
            </div>

            {status === "err" && errMsg ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-2 text-[12px] text-red-700">
                {errMsg}
              </div>
            ) : null}

            {status === "ok" ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-[12px] text-emerald-800">
                Sačuvano ✅ Javićemo ti kada bude dostupno.
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="text-[11px] mic-muted-2">
                Unos ostaje samo za obaveštenje o dostupnosti.
              </div>

              <button
                type="button"
                className={cx(
                  canSend ? "mic-btn-primary" : "mic-btn",
                  "h-9 px-4 text-[12px]",
                  !canSend && "opacity-50"
                )}
                onClick={onSubmit}
                disabled={!canSend}
              >
                {status === "sending" ? "Šaljem…" : "Pošalji"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}