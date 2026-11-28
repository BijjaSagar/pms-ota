// Tab / section switch: snap the page to the top (no visible scrolling) and fade the new content in,
// so the switch feels like opening a fresh page instead of landing somewhere in the middle of it.
export function showFromTop(panel) {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, behavior: 'auto' });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !panel?.animate) return;
  panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
}
