/**
 * Spell File Operations
 *
 * @fileoverview File read/write operations for spell MDX files
 * @module scripts/migration/spellRefactorSwarmCSV/files
 * @author GitHub Copilot
 * @version 1.0.0
 * @since 1.0.0
 */

import fs from 'fs-extra';
import path from 'path';

const SPELLS_DIR = path.resolve('src/content/en/spells');

export function spellFileExists(slug: string): boolean {
  return fs.existsSync(path.join(SPELLS_DIR, `${slug}.mdx`));
}

export function readSpellFile(slug: string): string {
  return fs.readFileSync(path.join(SPELLS_DIR, `${slug}.mdx`), 'utf-8');
}

export function writeSpellFile(slug: string, content: string): void {
  fs.writeFileSync(path.join(SPELLS_DIR, `${slug}.mdx`), content, 'utf-8');
}

export function deleteSpellFile(slug: string): void {
  const mdxPath = path.join(SPELLS_DIR, `${slug}.mdx`);
  const metaPath = path.join(SPELLS_DIR, `${slug}.metadata.json`);

  if (fs.existsSync(mdxPath)) {
    fs.removeSync(mdxPath);
  }
  if (fs.existsSync(metaPath)) {
    fs.removeSync(metaPath);
  }
}

export function renameSpellFiles(oldSlug: string, newSlug: string): void {
  const oldPath = path.join(SPELLS_DIR, `${oldSlug}.mdx`);
  const newPath = path.join(SPELLS_DIR, `${newSlug}.mdx`);
  const oldMetaPath = path.join(SPELLS_DIR, `${oldSlug}.metadata.json`);
  const newMetaPath = path.join(SPELLS_DIR, `${newSlug}.metadata.json`);

  fs.moveSync(oldPath, newPath, { overwrite: true });
  if (fs.existsSync(oldMetaPath)) {
    fs.moveSync(oldMetaPath, newMetaPath, { overwrite: true });
  }
}
