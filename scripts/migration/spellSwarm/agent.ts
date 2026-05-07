/**
 * @fileoverview Agent launcher for the spell swarm migration.
 * Creates a GPT-4.1 session per spell, parses the response, and commits.
 *
 * @module scripts/migration/spellSwarm/agent
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
import path from 'path';
import { commitSpellToWorktree } from './git';
import { buildPrompt } from './prompt';
import type { AgentResult, SpellEntry } from './types';

const log = createLogger({ component: 'SpellSwarmAgent' });

/**
 * Parses the agent's raw response string into a structured AgentResult.
 * Extracts the JSON block from a fenced code block if present.
 *
 * @param {string} raw - The raw response string from the agent.
 * @returns {AgentResult | null} Parsed result, or null on parse failure.
 */
export const parseAgentResponse = (raw: string): AgentResult | null => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenced ? fenced[1] : raw;
  try {
    return JSON.parse(jsonStr.trim()) as AgentResult;
  } catch {
    return null;
  }
};

/**
 * Launches a GPT-4.1 agent to reproduce one SRD spell and commits it to the
 * swarm worktree. Skips the spell if the MDX file already exists on disk.
 *
 * @param {SpellEntry} entry - The spell entry to process.
 * @param {string} contentDir - Absolute path to the spells content directory.
 * @returns {Promise<void>}
 */
export const launchAgent = async (
  entry: SpellEntry,
  contentDir: string,
): Promise<void> => {
  const filePath = path.join(contentDir, `${entry.slug}.mdx`);

  try {
    await fs.access(filePath);
    log.message(`"${entry.title}" already exists — skipping.`, {
      slug: entry.slug,
    });
    return;
  } catch {
    /* file absent */
  }

  const client = new CopilotClient();
  try {
    const session = await client.createSession({
      model: 'gpt-4.1',
      onPermissionRequest: function (): PermissionRequestResult {
        return { kind: 'approved' };
      } as any,
    } as SessionConfig);

    const response = await session.sendAndWait({ prompt: buildPrompt(entry) });
    const result = parseAgentResponse(response?.data.content ?? '');

    if (!result) {
      log.error(`"${entry.title}": could not parse agent response.`, {
        slug: entry.slug,
      });
      return;
    }

    await commitSpellToWorktree(filePath, result.mdxContent);
    log.message(`"${entry.title}": committed to ${entry.slug}.mdx.`, {
      slug: entry.slug,
    });
  } catch (error) {
    log.error(`Error processing "${entry.title}"`, {
      slug: entry.slug,
      error: String(error),
    });
  } finally {
    await client.stop();
  }
};
