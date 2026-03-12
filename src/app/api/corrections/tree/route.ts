/**
 * @fileoverview Content Tree API
 * @description Returns the directory tree of the content repository for a given locale.
 * Used by the MDX editor's FileTreeSelect to provide a folder picker for new file paths.
 *
 * @module app/api/corrections/tree/route
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Corrections:Tree' });

/**
 * Tree node representing a folder or file in the content directory.
 *
 * @property {string} name - Display name
 * @property {string} path - Full relative path (e.g. `"en/monsters"` or `"en/monsters/aboleth.sheet.mdx"`)
 * @property {TreeNode[]} children - Nested children (empty for files)
 * @property {boolean} [isFile] - True for file nodes
 */
interface TreeNode {
  /** Display name */
  name: string;
  /** Relative path */
  path: string;
  /** Nested children */
  children: TreeNode[];
  /** True for file nodes */
  isFile?: boolean;
}

/**
 * Builds a nested tree from the flat list of tree entries returned by
 * the GitHub Git Trees API.
 *
 * @param {Array<{ path: string; type: string }>} entries - Flat tree entries
 * @param {string} prefix - Path prefix to filter by (e.g. `"en/"`)
 * @returns {TreeNode[]} Nested tree structure
 */
function buildTree(
  entries: { path: string; type: string }[],
  prefix: string,
): TreeNode[] {
  const filtered = entries
    .filter(
      (e) =>
        e.path.startsWith(prefix) &&
        (e.type === 'tree' || (e.type === 'blob' && e.path.endsWith('.mdx'))),
    )
    .map((e) => ({
      relPath: e.path.slice(prefix.length),
      fullPath: e.path,
      type: e.type,
    }))
    .filter((p) => p.relPath.length > 0 && !p.relPath.startsWith('.'));

  const root: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  const dirs = filtered.filter((e) => e.type === 'tree');
  dirs.sort((a, b) => a.relPath.localeCompare(b.relPath));

  for (const { relPath, fullPath } of dirs) {
    const parts = relPath.split('/');
    const name = parts[parts.length - 1];
    const node: TreeNode = { name, path: fullPath, children: [] };
    nodeMap.set(relPath, node);

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = nodeMap.get(parentPath);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  const files = filtered.filter((e) => e.type === 'blob');
  files.sort((a, b) => a.relPath.localeCompare(b.relPath));

  for (const { relPath, fullPath } of files) {
    const parts = relPath.split('/');
    const name = parts[parts.length - 1];
    const fileNode: TreeNode = {
      name,
      path: fullPath,
      children: [],
      isFile: true,
    };

    if (parts.length === 1) {
      root.push(fileNode);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = nodeMap.get(parentPath);
      if (parent) {
        parent.children.push(fileNode);
      }
    }
  }

  return root;
}

/**
 * GET handler - returns the content directory tree for a locale.
 *
 * @param {NextRequest} req - Incoming request with `?locale=en` query param
 * @returns {Promise<NextResponse>} JSON response with tree structure
 *
 * @example
 * ```
 * GET /api/corrections/tree?locale=en
 * → { tree: [{ name: "monsters", path: "en/monsters", children: [...] }, ...] }
 * ```
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const locale = req.nextUrl.searchParams.get('locale') || 'en';

  const owner = process.env.CONTENT_REPO_OWNER;
  const repo = process.env.CONTENT_REPO_NAME;
  const token = process.env.GITHUB_PAT;

  if (!owner || !repo || !token) {
    log.error('Missing GitHub configuration');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    );
  }

  try {
    const branch = process.env.CONTENT_REPO_BRANCH || 'main';
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const body = await res.text();
      log.error(`GitHub Trees API error ${res.status}: ${body}`);
      return NextResponse.json(
        { error: `GitHub API error: ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const tree = buildTree(data.tree || [], `${locale}/`);

    return NextResponse.json({ tree });
  } catch (err) {
    log.error('Failed to fetch content tree', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to fetch content tree' },
      { status: 500 },
    );
  }
}
