/**
 * @fileoverview Agent launcher for the spell lore-refactor swarm.
 * Creates a GPT-4.1 session per spell, generates a Damocles lore description,
 * transforms the MDX, and writes the result to disk.
 *
 * @module scripts/migration/spellRefactorSwarm/agent
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import {
    CopilotClient,
    PermissionRequestResult,
    SessionConfig,
} from '@github/copilot-sdk';
import fs from 'fs/promises';
import {
    isAlreadyInBlockquote,
    isRulesText,
    parseSpellMdx,
    reconstructSpellMdx,
} from './parser';
import { buildPrompt } from './prompt';
import type { AgentResult, SpellRefactorEntry } from './types';

const log = createLogger({ component: 'SpellRefactorAgent' });

/**
 * Parses the agent's raw response string into a structured {@link AgentResult}.
 * Extracts the JSON block from a fenced code block if present.
 * Returns null if the response is an empty JSON object (skip signal).
 *
 * @param {string} raw - The raw response string from the agent.
 * @returns {AgentResult | null} Parsed result, null if agent returned empty JSON (skip), or null on parse failure.
 */
export const parseAgentResponse = (raw: string): AgentResult | null => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenced ? fenced[1] : raw;
  try {
    const parsed = JSON.parse(jsonStr.trim()) as
      | { loreDescription: string; alreadyInBlockquote: boolean }
      | {};

    /** Empty JSON object means skip this spell. */
    if (Object.keys(parsed).length === 0) {
      return null;
    }

    const result = parsed as {
      loreDescription: string;
      alreadyInBlockquote: boolean;
    };
    return {
      loreDescription: result.loreDescription,
      prependToBlockquote: !result.alreadyInBlockquote,
    };
  } catch {
    return null;
  }
};

/**
 * Launches a ChatGPT-5 mini agent to generate a Damocles lore description for one
 * spell and writes the transformed MDX to disk.
 *
 * Skips silently when the post-H1 text does not appear to be rules text
 * (i.e., the file has already been refactored or contains authored lore).
 *
 * @param {SpellRefactorEntry} entry - The spell entry to process.
 * @returns {Promise<void>}
 */
export const launchAgent = async (entry: SpellRefactorEntry): Promise<void> => {
  const parsed = parseSpellMdx(entry.rawContent);
  if (!parsed) {
    log.error(`"${entry.slug}": could not parse MDX structure — skipping.`, {
      slug: entry.slug,
    });
    return;
  }

  /** Check if post-H1 text is a placeholder or minimal text that needs refactoring. */
  const isPlaceholder =
    parsed.postH1Text.trim() === '' ||
    parsed.postH1Text.trim() === 'NO DESCRIPTION!!!' ||
    parsed.postH1Text.trim().length < 20;

  /** Determine if refactoring is needed. */
  const needsRefactor =
    isPlaceholder || isRulesText(parsed.postH1Text, parsed.blockquoteBody);

  if (!needsRefactor) {
    log.message(
      `"${entry.slug}": post-H1 text appears to be lore already — skipping.`,
      {
        slug: entry.slug,
      },
    );
    return;
  }

  const client = new CopilotClient();
  let session: any;
  try {
    session = await client.createSession({
      model: 'gpt-5-mini',
      onPermissionRequest: function (): PermissionRequestResult {
        return { kind: 'approved' };
      } as any,
    } as SessionConfig);

    const prompt = buildPrompt(entry, parsed);
    const response = await session.sendAndWait({ prompt });
    const result = parseAgentResponse(response?.data.content ?? '');

    if (!result) {
      /** Empty JSON response or parse failure: treat as skip signal. */
      log.message(
        `"${entry.slug}": agent returned skip signal or invalid response — skipping.`,
        {
          slug: entry.slug,
        },
      );
      return;
    }

    /** Fallback: use parser heuristic when agent response contradicts reality. */
    const prependToBlockquote =
      result.prependToBlockquote &&
      !isAlreadyInBlockquote(parsed.postH1Text, parsed.blockquoteBody);

    const newContent = reconstructSpellMdx(
      parsed,
      result.loreDescription,
      prependToBlockquote,
    );

    await fs.writeFile(entry.filePath, newContent, 'utf-8');
    log.message(`"${entry.slug}": refactored successfully.`, {
      slug: entry.slug,
      prependToBlockquote,
    });
  } catch (error) {
    log.error(`"${entry.slug}": agent error — ${String(error)}`, {
      slug: entry.slug,
    });
  } finally {
    /** Always dispose the session to prevent subprocess leaks. */
    try {
      if (session && typeof session.dispose === 'function') {
        await session.dispose();
      }
    } catch (disposeErr) {
      log.error(`"${entry.slug}": failed to dispose session`, {
        slug: entry.slug,
        error: String(disposeErr),
      });
    }
  }
};
