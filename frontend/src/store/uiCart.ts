"use client";

import * as React from "react";

export type Id = string | number;

type StoreState = {
  cart: Set<string>;
  wishlist: Set<string>;
  compare: Set<string>;
};

type StoreApi = {
  get: () => StoreState;
  set: (next: StoreState) => void;
  subscribe: (fn: () => void) => () => void;

  addCart: (id: Id) => void;
  removeCart: (id: Id) => void;
  toggleWishlist: (id: Id) => void;
  toggleCompare: (id: Id) => void;
  clearAll: () => void;
};

function toKey(id: Id) {
  return String(id);
}

function cloneState(s: StoreState): StoreState {
  return {
    cart: new Set(s.cart),
    wishlist: new Set(s.wishlist),
    compare: new Set(s.compare),
  };
}

// Minimal, dependency-free store (zustand-like API, ali bez paketa)
const store: StoreApi = (() => {
  let state: StoreState = {
    cart: new Set<string>(),
    wishlist: new Set<string>(),
    compare: new Set<string>(),
  };

  const listeners = new Set<() => void>();

  const api: StoreApi = {
    get: () => state,
    set: (next) => {
      state = next;
      for (const l of listeners) l();
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    addCart: (id) => {
      const k = toKey(id);
      const next = cloneState(state);
      next.cart.add(k);
      api.set(next);
    },
    removeCart: (id) => {
      const k = toKey(id);
      const next = cloneState(state);
      next.cart.delete(k);
      api.set(next);
    },
    toggleWishlist: (id) => {
      const k = toKey(id);
      const next = cloneState(state);
      if (next.wishlist.has(k)) next.wishlist.delete(k);
      else next.wishlist.add(k);
      api.set(next);
    },
    toggleCompare: (id) => {
      const k = toKey(id);
      const next = cloneState(state);
      if (next.compare.has(k)) next.compare.delete(k);
      else next.compare.add(k);
      api.set(next);
    },
    clearAll: () => {
      api.set({ cart: new Set(), wishlist: new Set(), compare: new Set() });
    },
  };

  return api;
})();

export function useUiCart<T>(selector: (s: StoreState) => T): T {
  const getSnapshot = React.useCallback(() => selector(store.get()), [selector]);
  const subscribe = React.useCallback((fn: () => void) => store.subscribe(fn), []);

  // @ts-expect-error - TS typing is OK at runtime
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const uiCart = store;