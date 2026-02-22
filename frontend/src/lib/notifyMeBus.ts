export type NotifyMePayload = {
  productId: number;
  productName: string;
};

const EVENT_NAME = "shop:notifyMeOpen";

export function emitNotifyMeOpen(payload: NotifyMePayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<NotifyMePayload>(EVENT_NAME, { detail: payload }));
}

export function onNotifyMeOpen(handler: (payload: NotifyMePayload) => void) {
  if (typeof window === "undefined") return () => {};

  const fn = (e: Event) => {
    const ce = e as CustomEvent<NotifyMePayload>;
    if (!ce?.detail) return;
    handler(ce.detail);
  };

  window.addEventListener(EVENT_NAME, fn as any);
  return () => window.removeEventListener(EVENT_NAME, fn as any);
}