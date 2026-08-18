/**
 * @fileoverview Pre-compiled regex patterns for MDX content parsing.
 * @description Heading, properties, and charge-mechanic patterns centralized.
 *
 * @module lib/metadata/parsingPatterns
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Heading detection patterns.
 *
 * @property {RegExp} h1 - H1 heading: "# Title"
 */
export const HEADING = {
  h1: /^#\s+/,
} as const;

/**
 * Properties section extraction patterns.
 *
 * @property {RegExp} section - "## Properties" section with optional prefix
 * @property {RegExp} bulletItem - Bullet property: "- **Key**: Value"
 * @property {RegExp} weight - Weight value: "2.5 lbs"
 * @property {RegExp} keyBullets - Global key-value bullets
 */
export const PROPERTIES = {
  section:
    /##\s+(Item\s+|Weapon\s+|Armor\s+)?Properties\s*\n([\s\S]*?)(?=\n##|\n---|\n$)/i,
  bulletItem: /^[-*]\s+\*\*(.+?)(?::)?\*\*\s*:?\s*(.+?)\s*$/gm,
  weight: /([\d.]+)\s*lbs?\.?/i,
  weightPer: /\bper\s+(\d+)\s*$/,
  keyBullets: /^-\s*\*\*([^*]+)\*\*\s*:\s*(.+?)\s*$/gim,
} as const;

/**
 * Charge mechanic patterns.
 *
 * @property {RegExp} initial - "holds 10 charges"
 * @property {RegExp} recovery - "regains 1d6+1 charges each dawn"
 * @property {RegExp} depletion - "becomes inert", "cannot be recharged", "burns away"
 */
export const CHARGES = {
  initial: /holds?\s+(?:up to\s+)?(\d+d\d+|\d+)\s+charges/i,
  recovery:
    /(?:regain|recover)(?:ing|s)?\s+(\d+\s*\+\s*\d+d\d+|\d+d\d+|\d+)\s+charges?\s+(?:at|each)\s+(\w+)/i,
  depletion: /becomes?\s+inert|cannot be recharged|burns? away/i,
} as const;

/**
 * Shared text processing patterns for markdown stripping and splitting.
 *
 * @property {RegExp} carriageReturn - Carriage return for stripping
 * @property {RegExp} bold - Capturing bold: "**text**" → group 1 = content
 * @property {RegExp} boldStrip - Non-capturing bold strip: removes "**"
 * @property {RegExp} italic - Italic: "*text*" → group 1 = content
 * @property {RegExp} underscoreItalic - Underscore italic: "_text_" → group 1
 * @property {RegExp} inlineCode - Inline code: "`code`" → group 1
 * @property {RegExp} markdownLink - Markdown link: "[text](url)" → group 1 = text
 * @property {RegExp} markdownFormatChars - Markdown format characters for bulk strip
 * @property {RegExp} underscore - Underscore character strip
 * @property {RegExp} italicWrap - Italic/bold wrappers at start/end of a line
 * @property {RegExp} lineSplit - Line-terminator split
 * @property {RegExp} horizontalRule - Horizontal rule line "---"
 * @property {RegExp} whitespaceCollapse - Collapse whitespace to single space
 * @property {RegExp} underscoreLeading - Leading underscore
 * @property {RegExp} underscoreTrailing - Trailing underscore
 * @property {RegExp} collapsibleTag - Collapsible JSX tag
 * @property {RegExp} frontmatterBlock - Leading YAML frontmatter block including both `---` delimiters
 * @property {RegExp} nonLineBreak - Every character that is not a line terminator
 */
export const TEXT = {
  carriageReturn: /\r/g,
  bold: /\*\*(.+?)\*\*/g,
  boldStrip: /\*\*/g,
  italic: /\*(.+?)\*/g,
  underscoreItalic: /_(.+?)_/g,
  inlineCode: /`(.+?)`/g,
  markdownLink: /\[([^\]]+)\]\([^)]*\)/g,
  markdownFormatChars: /[*_`~]/g,
  underscore: /_/g,
  italicWrap: /^[_*]+|[_*]+$/g,
  lineSplit: /\r?\n/,
  horizontalRule: /^\s*---\s*$/,
  whitespaceCollapse: /\s+/g,
  underscoreLeading: /^_/,
  underscoreTrailing: /_$/,
  collapsibleTag: /^<\/?Collapsible/i,
  frontmatterBlock:
    /^(?:[^\S\r\n]*\r?\n)*[^\S\r\n]*---[^\S\r\n]*\r?\n[\s\S]*?\r?\n[^\S\r\n]*---[^\S\r\n]*(?=\r?\n|$)/,
  nonLineBreak: /[^\r\n]/g,
} as const;

/**
 * Slug and path generation patterns.
 *
 * @property {RegExp} nonAlpha - Non-alphanumeric characters → hyphens
 * @property {RegExp} edgeHyphens - Leading/trailing hyphens
 * @property {RegExp} mdxExtension - ".mdx" file extension
 * @property {RegExp} contentTypeSuffix - Content type suffixes (.sheet, .specialization, etc.)
 * @property {RegExp} nonAlphaKeepSpaces - Non-alpha preserving spaces and hyphens
 * @property {RegExp} multiHyphens - Multiple consecutive hyphens
 * @property {RegExp} singleEdgeHyphens - Single leading/trailing hyphens
 * @property {RegExp} titleCase - First letter of each word
 * @property {RegExp} hyphensUnderscores - Hyphens and underscores to spaces
 * @property {RegExp} parentheses - Parentheses characters
 * @property {RegExp} pathBackslash - Backslash path separator
 * @property {RegExp} pathSeparatorLeading - Leading path separators (/ or \)
 * @property {RegExp} pathSeparator - Single path separator (/ or \)
 */
export const SLUG = {
  nonAlpha: /[^a-z0-9]+/g,
  edgeHyphens: /^-+|-+$/g,
  mdxExtension: /\.mdx$/i,
  contentTypeSuffix:
    /\.(sheet|specialization|list|reference|heirloom|trinket|bloodline|lore)$/,
  nonAlphaKeepSpaces: /[^a-z0-9\s-]/g,
  multiHyphens: /-+/g,
  singleEdgeHyphens: /^-|-$/g,
  titleCase: /\b\w/g,
  hyphensUnderscores: /[-_]/g,
  parentheses: /[()]/g,
  pathBackslash: /\\/g,
  pathSeparatorLeading: /^[/\\]+/,
  pathSeparator: /[/\\]/,
} as const;

/**
 * List splitting patterns for comma, semicolon, and conjunction delimiters.
 *
 * @property {RegExp} commaStrip - Strip commas from numbers
 * @property {RegExp} commaSplit - Split on comma with optional whitespace
 * @property {RegExp} commaOrSemicolon - Split on comma or semicolon
 * @property {RegExp} andSplit - Split on "and" or comma
 * @property {RegExp} orSplit - Split on comma or "or"
 * @property {RegExp} orPrefix - Leading "or" prefix
 * @property {RegExp} andOrSplit - Split on comma or "and"
 * @property {RegExp} commaWhitespace - Comma with optional surrounding whitespace
 */
export const LIST = {
  commaStrip: /,/g,
  commaSplit: /,\s*/,
  commaOrSemicolon: /[,;]/,
  andSplit: /\s+and\s+|,\s*/,
  orSplit: /,\s*|\s+or\s+/,
  orPrefix: /^or\s+/i,
  andOrSplit: /,\s*|\s+and\s+/,
  commaWhitespace: /\s*,\s*/,
} as const;

/**
 * Dice expression patterns for `[% ... %]` wrapped roll syntax.
 *
 * @property {RegExp} wrapped - Match `[% ... %]` delimited dice expressions
 * @property {RegExp} innerDice - Extract dice notation from within a wrapped expression
 */
export const DICE = {
  wrapped: /\[%\s*(.*?)\s*%\]/g,
  innerDice: /(\d+d\d+)/,
} as const;

/**
 * General-purpose utility patterns.
 *
 * @property {RegExp} numericExtract - Extract first numeric value
 * @property {RegExp} regexEscape - Escape regex special characters
 * @property {RegExp} quotesStrip - Strip surrounding quotes
 */
export const UTILITY = {
  numericExtract: /(\d+)/,
  regexEscape: /[.*+?^${}()|[\]\\]/g,
  quotesStrip: /^["']|["']$/g,
} as const;
