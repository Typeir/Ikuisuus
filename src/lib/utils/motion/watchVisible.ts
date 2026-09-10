/**
 * @fileoverview Reports when an element comes near the screen.
 * @module lib/utils/motion/watchVisible
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * One observer, and what each element it watches asked to be told.
 *
 * @property {IntersectionObserver} observer - The shared observer.
 * @property {WeakMap<Element, (near: boolean) => void>} told - Who to tell, by element.
 * @property {number} watched - How many elements it still holds.
 */
interface Registry {
  observer: IntersectionObserver;
  told: WeakMap<Element, (near: boolean) => void>;
  watched: number;
}

/** One registry per margin, since the margin is what an observer is built with. */
const registries = new Map<string, Registry>();

/**
 * Builds the registry for one margin, or hands back the one already standing.
 *
 * @param {string} margin - How far outside the screen still counts as near.
 * @returns {Registry} The registry.
 */
function registryFor(margin: string): Registry {
  const standing = registries.get(margin);
  if (standing) return standing;

  const told = new WeakMap<Element, (near: boolean) => void>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        told.get(entry.target)?.(entry.isIntersecting);
      }
    },
    { rootMargin: margin },
  );

  const built: Registry = { observer, told, watched: 0 };
  registries.set(margin, built);
  return built;
}

/**
 * Watches one element and says when it comes near the screen.
 *
 * @description Every element watched at the same margin shares one observer.
 * A page holds a stat block for each thing a creature can do, and each of them
 * asks this question of itself; one observer per asker is a construction cost
 * paid while the page is still arriving, and it is the same question every
 * time.
 *
 * @param {Element | null} el - The element to watch.
 * @param {(near: boolean) => void} told - Given the answer on every change.
 * @param {string} [margin] - How far outside the screen still counts as near.
 * @returns {() => void} Stops watching.
 */
export function watchVisible(
  el: Element | null,
  told: (near: boolean) => void,
  margin = '0px',
): () => void {
  if (!el) return () => {};

  /* Without an observer to ask, everything counts as near: content nobody can
     defer is better than content nobody can see. */
  if (typeof IntersectionObserver === 'undefined') {
    told(true);
    return () => {};
  }

  const registry = registryFor(margin);
  registry.told.set(el, told);
  registry.observer.observe(el);
  registry.watched += 1;

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    registry.observer.unobserve(el);
    registry.told.delete(el);
    registry.watched -= 1;
    if (registry.watched === 0) {
      registry.observer.disconnect();
      registries.delete(margin);
    }
  };
}
