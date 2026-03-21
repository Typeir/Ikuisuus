/**
 * Dependency Graph Utilities
 *
 * @fileoverview Provides topological sorting for MDX component dependency graphs
 * using Kahn's algorithm. Detects circular dependencies.
 *
 * @module findReusableMdxOutliers/dependencyGraph
 * @version 1.0.0
 * @since 3.0.0
 */

/**
 * Performs a topological sort on the dependency graph using Kahn's algorithm.
 * Returns outlier names ordered so that dependencies compile before dependents.
 *
 * @param deps - Map of outlier name → set of outlier names it depends on
 * @returns Topologically sorted array of outlier names
 * @throws Error if a circular dependency is detected
 */
export const topologicalSort = (deps: Map<string, Set<string>>): string[] => {
  const inDegree = new Map<string, number>();
  for (const name of deps.keys()) {
    inDegree.set(name, 0);
  }
  for (const [, edges] of deps) {
    for (const dep of edges) {
      if (inDegree.has(dep)) {
        inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [name, degree] of inDegree) {
    if (degree === 0) queue.push(name);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const dep of deps.get(current) ?? []) {
      if (!inDegree.has(dep)) continue;
      const newDegree = (inDegree.get(dep) ?? 1) - 1;
      inDegree.set(dep, newDegree);
      if (newDegree === 0) queue.push(dep);
    }
  }

  if (sorted.length !== deps.size) {
    const remaining = [...deps.keys()].filter((n) => !sorted.includes(n));
    throw new Error(
      `Circular dependency detected among: ${remaining.join(', ')}`,
    );
  }

  return sorted;
};
