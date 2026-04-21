/**
 * Session-End Violation Escalation Plugin
 *
 * @fileoverview Escalates unresolved session-scoped violations to project scope
 * at session end, then runs garbage collection on old resolved violations.
 *
 * When a session ends with unresolved violations:
 *   - Session-scoped violations (session_id = uuid) → project-scoped (session_id = NULL)
 *   - Project-scoped violations block ALL future sessions until manually resolved
 *   - Resolved violations older than 30 days are pruned
 *
 * @module .paw/plugins/session-end/escalate-violations
 * @author Typeir
 * @version 1.0.0
 * @since 4.0.0
 */

import { extractSessionId } from '../../../.github/PAW/hook-runtime';
import type { PawDatabase } from '../../../.github/PAW/paw-db';
import {
  escalateSessionViolations,
  gcOldViolations,
  getUnresolvedViolations,
  resolveAllViolations,
} from '../../../.github/PAW/paw-db';
import type {
  PawPlugin,
  PluginResult,
} from '../../../.github/PAW/plugin-types';

/**
 * Escalation plugin instance.
 */
export const plugin: PawPlugin = {
  name: 'escalate-violations',

  async run(
    hookInput: Record<string, unknown>,
    db: PawDatabase | null,
  ): Promise<PluginResult> {
    if (!db) {
      return { block: false };
    }

    const unresolvedViolations = getUnresolvedViolations(db);
    if (unresolvedViolations.length === 0) {
      gcOldViolations(db, 30);
      return { block: false };
    }

    const sessionId = extractSessionId(hookInput);

    if (sessionId) {
      const escalated = escalateSessionViolations(db, sessionId);
      if (escalated > 0) {
        process.stderr.write(
          `\u26A0\uFE0F ${escalated} unresolved violation(s) escalated to project scope\n`,
        );
      }
    } else {
      resolveAllViolations(db);
    }

    gcOldViolations(db, 30);

    return { block: false };
  },
};
