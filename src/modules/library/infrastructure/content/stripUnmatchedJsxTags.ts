/**
 * @fileoverview Removes unmatched JSX/HTML tags from truncated MDX fragments.
 * @module modules/library/infrastructure/content/stripUnmatchedJsxTags
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

/**
 * Removes JSX/HTML element tags whose counterpart was lost during truncation.
 *
 * @param {string} source - Input text potentially containing unbalanced tags.
 * @returns {string} Input with unmatched open/close tags removed.
 */
export function stripUnmatchedJsxTags(source: string): string {
  const jsxTag = /<(\/?)([A-Za-z][A-Za-z0-9]*)\b[^>]*?(\/?)>/g;

  type Tag = {
    start: number;
    end: number;
    isClose: boolean;
    isSelf: boolean;
    name: string;
  };

  const tags: Tag[] = [];
  let match: RegExpExecArray | null;

  jsxTag.lastIndex = 0;
  while ((match = jsxTag.exec(source)) !== null) {
    tags.push({
      start: match.index,
      end: match.index + match[0].length,
      isClose: match[1] === '/',
      isSelf: match[3] === '/',
      name: match[2],
    });
  }

  const stack: number[] = [];
  const remove = new Set<number>();

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];

    if (tag.isSelf) {
      continue;
    }

    if (!tag.isClose) {
      stack.push(i);
      continue;
    }

    let foundAt = -1;
    for (let j = stack.length - 1; j >= 0; j--) {
      if (tags[stack[j]].name === tag.name) {
        foundAt = j;
        break;
      }
    }

    if (foundAt === -1) {
      remove.add(i);
      continue;
    }

    while (stack.length - 1 > foundAt) {
      remove.add(stack.pop()!);
    }

    stack.pop();
  }

  for (const index of stack) {
    remove.add(index);
  }

  if (remove.size === 0) {
    return source;
  }

  const sorted = [...remove].sort((a, b) => b - a);
  let output = source;

  for (const index of sorted) {
    const tag = tags[index];
    output = output.slice(0, tag.start) + output.slice(tag.end);
  }

  return output;
}
