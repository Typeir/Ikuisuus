/**
 * CSV Parser and Spell File Utilities
 *
 * @fileoverview Parsing and file manipulation utilities for spell refactoring
 * @module scripts/migration/spellRefactorSwarmCSV/utils
 * @author GitHub Copilot
 * @version 1.0.0
 * @since 1.0.0
 */

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function isCompleteCSVLine(line: string): boolean {
  let quoteCount = 0;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\\' && !escaped) {
      escaped = true;
    } else if (line[i] === '"' && !escaped) {
      quoteCount++;
    } else {
      escaped = false;
    }
  }

  return quoteCount % 2 === 0;
}

export function splitSpellNames(nameString: string): string[] {
  return nameString
    .split(',')
    .map((n) => n.trim())
    .filter((n) => n && !n.startsWith('---'));
}

export function extractH1(content: string): string | null {
  const match = content.match(/^#\s+(.+?)$/m);
  return match ? match[1] : null;
}

export function updateH1(content: string, newTitle: string): string {
  return content.replace(/^#\s+.+?$/m, `# ${newTitle}`);
}

export function updateYAMLSource(content: string, source: string): string {
  if (content.startsWith('---')) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      let yaml = match[1];
      if (yaml.includes('source:')) {
        yaml = yaml.replace(/source:\s*.*?$/m, `source: ${source}`);
      } else {
        yaml += `\nsource: ${source}`;
      }
      return content.replace(/^---\n[\s\S]*?\n---/, `---\n${yaml}\n---`);
    }
  }
  return `---\nsource: ${source}\n---\n\n${content}`;
}

export function extractDescription(content: string): string | null {
  const h1Match = content.match(/^#\s+.+?$/m);
  if (!h1Match) return null;

  const h1End = (h1Match.index ?? 0) + h1Match[0].length;
  const afterH1 = content.substring(h1End);

  const blockquoteMatch = afterH1.match(/^[\s\n]*>/m);
  if (!blockquoteMatch) {
    return afterH1.trim();
  }

  const beforeBlockquote = afterH1.substring(0, blockquoteMatch.index);
  return beforeBlockquote.trim();
}

export function updateDescription(content: string, newDescription: string): string {
  const h1Match = content.match(/^#\s+.+?$/m);
  if (!h1Match) return content;

  const h1End = (h1Match.index ?? 0) + h1Match[0].length;
  const beforeH1 = content.substring(0, h1End);
  const afterH1 = content.substring(h1End);

  const blockquoteMatch = afterH1.match(/^[\s\n]*(>)/m);
  if (!blockquoteMatch) {
    return beforeH1 + '\n\n' + newDescription;
  }

  const blockquoteStart = (blockquoteMatch.index ?? 0);
  const rest = afterH1.substring(blockquoteStart);
  return beforeH1 + '\n\n' + newDescription + '\n\n' + rest;
}
