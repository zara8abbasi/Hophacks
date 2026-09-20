export const TREE_LAYERS_STORAGE_KEY = "hophacks-disposal-tree-layers";
export const MAX_TREE_LAYERS = 5;

export const TREE_LAYERS_CHANGED_EVENT = "hophacks-tree-layers-changed";

function readCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = sessionStorage.getItem(TREE_LAYERS_STORAGE_KEY);
  if (raw === null) return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_TREE_LAYERS);
}

export function getDisposalTreeLayerCount(): number {
  return readCount();
}

/** Bump stored layer count (capped at {@link MAX_TREE_LAYERS}). */
export function incrementDisposalTreeLayers(): number {
  const next = Math.min(readCount() + 1, MAX_TREE_LAYERS);
  sessionStorage.setItem(TREE_LAYERS_STORAGE_KEY, String(next));
  window.dispatchEvent(
    new CustomEvent(TREE_LAYERS_CHANGED_EVENT, { detail: next })
  );
  return next;
}
