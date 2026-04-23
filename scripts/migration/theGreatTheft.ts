/**
 * @fileoverview Script to migrate data from the SRD provided under OGL by WOTC to the Damocles system.
 * This is a one-time-use script intended to be run in a Node.js environment with access to the SRD PDF and the Damocles (Library of Ikuisuus) codebase.
 * The purpose of this script is to backfill missing rules and feats from the SRD into the Damocles codebase.
 * The script will split the PDF into individual pages, and through a CRON and the copilot-sdk, it will instantiate agents using the GPT-4.1 model to read, summarize, and classify the content.
 * Each agent will then create a branch in the repository, and add the new content, following the naming pattern of `theft-<page-number>-<content-type>-<content-name>`, where content type is either "feat" or "rule", and content name is the name of the feat or rule being added.
 * The agents will then create a pull request for each branch, which can be reviewed and merged by the maintainers of the repository.
 *
 * @module scripts/migration/theGreatTheft
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import {
  CopilotClient,
  PermissionRequestResult,
  SessionConfig
} from '@github/copilot-sdk';
import { PDF } from '@libpdf/core';
import { exec } from 'child_process';
import fs from 'fs/promises';
import cron from 'node-cron';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SRD = path.resolve('scripts', 'core', 'SRD-OGL_V5.1.pdf');
const OUTPUT_DIR = path.resolve('scripts', 'migration', 'output');
const STATE_FILE = path.resolve('scripts', 'migration', 'state.json');
const CONTENT_ROOT = path.resolve('src', 'content', 'en');
const FEAT_DIR = path.join(CONTENT_ROOT, 'character-creation', 'feats');
const RULE_DIR = path.join(CONTENT_ROOT, 'rules');

const log = createLogger({ script: 'theGreatTheft' });

/**
 * Tracks which SRD pages have already been processed across cron cycles.
 *
 * @property {number} totalPages - Total number of pages extracted from the PDF.
 * @property {number[]} processedPages - Page numbers that have already been committed.
 */
interface MigrationState {
  totalPages: number;
  processedPages: number[];
}

/**
 * Structured output produced by the classification agent for a single SRD page.
 *
 * @property {'feat' | 'rule' | 'skip'} classification - Content type, or "skip" for non-content pages.
 * @property {string} slug - Kebab-case filename slug (without extension).
 * @property {string} mdxContent - Full MDX file content ready to write to disk.
 */
interface AgentResult {
  classification: 'feat' | 'rule' | 'skip';
  slug: string;
  mdxContent: string;
}

/**
 * Loads the migration state from disk, or returns a default empty state if none exists.
 */
const loadState = async (): Promise<MigrationState> => {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(raw) as MigrationState;
  } catch {
    return { totalPages: 0, processedPages: [] };
  }
};

/**
 * Persists the migration state to disk.
 *
 * @param {MigrationState} state - The current state to write.
 */
const saveState = async (state: MigrationState): Promise<void> => {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
};

/**
 * Builds the full classification and formatting prompt for the GPT-4.1 agent.
 * Embeds Damocles MDX format templates for feats and rules so the agent can
 * produce correctly-structured output without external tooling.
 *
 * @param {number} pageNumber - The SRD page number being processed.
 * @param {string} pageText - Raw extracted text from that page.
 */
const buildPrompt = (pageNumber: number, pageText: string): string => `\
You are a content migration agent for the Library of Ikuisuus, a D&D 5e-compatible \
tabletop RPG system called Damocles.

Your task is to read the following raw SRD text from page ${pageNumber} and:
1. Classify it as one of: "feat", "rule", or "skip".
   - "skip": table of contents, credits, legal text, artwork descriptions, blank pages, chapter headers without mechanics.
   - "feat": a player character feat granting ability score increases or named benefits.
   - "rule": any mechanical system, procedure, action, condition, or interaction rule.
2. Extract a kebab-case slug for the content name (e.g. "sharpshooter", "special-actions").
3. Rewrite the content as a Damocles MDX file following the exact canonical format below.

---

## Feat Format (classification = "feat")

File location: src/content/en/character-creation/feats/<slug>.mdx

\`\`\`mdx
# Feat Name

_Prerequisite: **Prerequisite here** (omit this line entirely if no prerequisite)_

One sentence of flavor grounded in Damocles cosmology. Magic draws from specific \
power sources: Arkhé, Väkis, Fold energy, tombsteel resonance. No generic fantasy \
language ("arcane energy", "blessed by the gods").

---

Increase your **[Ability] score by 1**, to a maximum of **20**. \
(omit if the feat grants no ability score increase)

When you take this feat, you gain the following benefits:

- **Benefit Name.** Precise mechanical description with no lore prose.
- **Benefit Name.** Precise mechanical description.
\`\`\`

Feat rules:
- Flavor sentence is mandatory and must be Damocles-grounded.
- All benefit text is dry and mechanically precise — no flavor in benefit bullets.
- Use bold for all mechanical terms (ability names, condition names, action types).

---

## Rule Format (classification = "rule")

File location: src/content/en/rules/<slug>.mdx

\`\`\`mdx
# Rule or System Name

## Overview

Brief description of what this rule governs. One to three sentences maximum.

## Mechanics

Precise mechanical definitions. Use bullet lists for discrete cases.  
Use markdown tables for structured numerical data.

## Interactions

How this rule interacts with other systems, conditions, or actions.  
Omit this section if there are no notable interactions.
\`\`\`

Rule rules:
- Dry format ONLY — no lore prose anywhere.
- Every word must be mechanically meaningful.
- Do NOT add flavor text.
- Separate subsystems within the same page using horizontal rules (---).

---

## Output Format

Respond with ONLY a JSON object in this exact schema. No prose before or after it.

\`\`\`json
{
  "classification": "feat" | "rule" | "skip",
  "slug": "kebab-case-name",
  "mdxContent": "full MDX content here (empty string if skip)"
}
\`\`\`

---

## Raw SRD Text (Page ${pageNumber})

${pageText}`;

/**
 * Parses the agent's raw response string into a structured AgentResult.
 * Extracts the JSON block from a fenced code block if present.
 *
 * @param {string} raw - The raw response string from the agent.
 */
const parseAgentResponse = (raw: string): AgentResult | null => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenced ? fenced[1] : raw;
  try {
    return JSON.parse(jsonStr.trim()) as AgentResult;
  } catch {
    return null;
  }
};

/**
 * Returns the absolute content directory path for a given classification.
 *
 * @param {'feat' | 'rule'} classification - The content type.
 */
const resolveContentDir = (classification: 'feat' | 'rule'): string =>
  classification === 'feat' ? FEAT_DIR : RULE_DIR;

/**
 * Commits a file to a new git branch using a temporary worktree, so the
 * current workspace branch is never altered. The worktree is removed after push.
 *
 * @param {string} branchName - The new branch name to create.
 * @param {string} absoluteFilePath - Absolute path where the file will live in the repo.
 * @param {string} fileContent - File content to write and commit.
 */
const commitToBranch = async (
  branchName: string,
  absoluteFilePath: string,
  fileContent: string,
): Promise<void> => {
  const worktreeDir = path.join(os.tmpdir(), `theft-worktree-${Date.now()}`);
  const repoRoot = path.resolve('.');
  const relativeFilePath = path.relative(repoRoot, absoluteFilePath);

  try {
    await execAsync(`git worktree add -b "${branchName}" "${worktreeDir}"`);

    const destFile = path.join(worktreeDir, relativeFilePath);
    await fs.mkdir(path.dirname(destFile), { recursive: true });
    await fs.writeFile(destFile, fileContent, 'utf-8');

    await execAsync(`git -C "${worktreeDir}" add "${relativeFilePath}"`);
    await execAsync(
      `git -C "${worktreeDir}" commit -m "feat(theft): add ${path.basename(absoluteFilePath)} from SRD page"`,
    );
    await execAsync(`git -C "${worktreeDir}" push origin "${branchName}"`);
  } finally {
    await execAsync(`git worktree remove --force "${worktreeDir}"`).catch(
      () => undefined,
    );
  }
};

/**
 * Main function to extract all SRD pages into individual text files and
 * initialize migration state. Run once before the cron job begins processing.
 */
const main = async () => {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const pdfBytes = await fs.readFile(SRD);
    const pdf = await PDF.load(pdfBytes);

    const pages = pdf.getPages();
    log.message(`${pages.length} pages loaded. Extracting text...`);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageText = await page.extractText();
      const pagePath = path.join(OUTPUT_DIR, `page-${i + 1}.txt`);
      await fs.writeFile(pagePath, pageText.text, 'utf-8');
      log.message(`Extracted text from page ${i + 1} to ${pagePath}`);
    }

    const state = await loadState();
    state.totalPages = pages.length;
    await saveState(state);

    log.message(
      `Extraction complete. Cron will process ${pages.length} pages in batches of 10.`,
    );
  } catch (error) {
    log.error('Error during PDF extraction', { error: String(error) });
  }
};

/**
 * Launches a single GPT-4.1 agent to classify and convert one SRD page,
 * then commits the result to a dedicated branch via git worktree.
 *
 * @param {number} pageNumber - The 1-based SRD page number to process.
 */
const launchAgent = async (pageNumber: number): Promise<void> => {
  const client = new CopilotClient();
  try {
    const pageText = await fs.readFile(
      path.join(OUTPUT_DIR, `page-${pageNumber}.txt`),
      'utf-8',
    );

    const session = await client.createSession({
      model: 'gpt-4.1',
      onPermissionRequest: function (): PermissionRequestResult {
        return { kind: 'approved' };
      } as any,
    } as SessionConfig);

    const response = await session.sendAndWait({
      prompt: buildPrompt(pageNumber, pageText),
    });

    const result = parseAgentResponse(response?.data.content ?? '');

    if (!result) {
      log.error(`Page ${pageNumber}: could not parse agent response.`);
      return;
    }

    if (result.classification === 'skip') {
      log.message(`Page ${pageNumber}: skipped (non-content page).`);
      return;
    }

    const contentDir = resolveContentDir(result.classification);
    const filePath = path.join(contentDir, `${result.slug}.mdx`);
    const branchName = `theft-${pageNumber}-${result.classification}-${result.slug}`;

    await commitToBranch(branchName, filePath, result.mdxContent);
    log.message(`Page ${pageNumber}: committed as branch "${branchName}".`);
  } catch (error) {
    log.error(`Error processing page ${pageNumber}`, { error: String(error) });
  } finally {
    await client.stop();
  }
};

/**
 * Cron job — fires every 10 minutes, picks the next batch of up to 10 unprocessed
 * pages, launches one agent per page in parallel, and advances the state cursor.
 */
cron.schedule('*/10 * * * *', async () => {
  try {
    const state = await loadState();

    if (state.totalPages === 0) {
      log.message(
        'No pages extracted yet. Run the script once to extract first.',
      );
      return;
    }

    const unprocessed = Array.from(
      { length: state.totalPages },
      (_, i) => i + 1,
    ).filter((page) => !state.processedPages.includes(page));

    if (unprocessed.length === 0) {
      log.message('All pages processed. Migration complete.');
      return;
    }

    const batch = unprocessed.slice(0, 10);
    log.message(
      `Processing batch of ${batch.length} pages: [${batch.join(', ')}]`,
    );

    await Promise.all(batch.map((pageNumber) => launchAgent(pageNumber)));

    state.processedPages.push(...batch);
    await saveState(state);

    log.message(
      `Batch complete. ${state.processedPages.length}/${state.totalPages} pages processed.`,
    );
  } catch (error) {
    log.error('Error during cron job execution', { error: String(error) });
  }
});

main();
