/**
 * @fileoverview Playwright fixture for the character builder: checkpointed actions, settle waits, and hook/API access.
 *
 * @module tests/e2e/builder/builderFixture
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { test as base, expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import type { IkBuilderDebug } from '@/lib/debug/ik';
import type { CharacterSheet } from '@/lib/types/character';
import type {
  BuilderFlag,
  BuilderPayload,
  BuilderSlot,
  SlotOption,
} from '@/modules/character-builder/application/builderCore/types';
import type { BuilderState } from '@/modules/character-builder/application/builderCore/builderState';

/** Builder page path. */
export const BUILDER_PATH = '/en/utils/characters';

/** Timeout for the bridge to appear, in ms. */
const BRIDGE_TIMEOUT_MS = 90_000;

/** Timeout for one settle wait, in ms. */
const SETTLE_TIMEOUT_MS = 20_000;

/** Window shape with the dev bridge. */
type BridgeWindow = Window & { ik?: { builder?: IkBuilderDebug } };

/** Action kinds the checkpoint wrapper performs. */
export type ActKind = 'click' | 'fill' | 'select';

/**
 * Snapshot returned by the dev API.
 *
 * @interface ApiSnapshot
 * @property {CharacterSheet} character - Character
 * @property {BuilderState} state - Computed state
 * @property {BuilderFlag[]} flags - Advisory flags
 */
export interface ApiSnapshot {
  character: CharacterSheet;
  state: BuilderState;
  flags: BuilderFlag[];
  [key: string]: unknown;
}

/**
 * Driver over one builder page.
 *
 * @class BuilderDriver
 */
export class BuilderDriver {
  private shot = 0;

  /**
   * Creates a driver.
   *
   * @param {Page} page - Playwright page
   * @param {TestInfo} testInfo - Current test info
   */
  constructor(
    readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {}

  /**
   * Opens the builder and waits for `window.ik.builder`.
   *
   * @returns {Promise<void>}
   * @throws {Error} When the bridge never appears
   */
  async goto(): Promise<void> {
    await this.page.goto(BUILDER_PATH);
    try {
      await this.page.waitForFunction(
        () => Boolean((window as BridgeWindow).ik?.builder),
        null,
        { timeout: BRIDGE_TIMEOUT_MS },
      );
    } catch {
      throw new Error(
        'window.ik.builder missing. Start the dev server with IK_DEV_BUILDER=1 and NEXT_PUBLIC_IK_DEV_BUILDER=1; a reused server without them has no bridge.',
      );
    }
    await this.settle();
  }

  /**
   * Waits until the builder reports settled.
   *
   * @returns {Promise<void>}
   */
  async settle(): Promise<void> {
    await this.page.waitForFunction(
      () => (window as BridgeWindow).ik?.builder?.isSettled() === true,
      null,
      { timeout: SETTLE_TIMEOUT_MS },
    );
  }

  /**
   * Runs an action on a checkpointed element inside `test.step(name)`, settles, and saves `NN-name.png`.
   *
   * @param {Locator} target - Element carrying `data-screenshot-action`, or a descendant of one
   * @param {ActKind} kind - Action kind
   * @param {string} [value] - Fill text or option label
   * @returns {Promise<string>} Checkpoint name
   * @throws {Error} When no checkpoint name is found
   */
  async act(target: Locator, kind: ActKind, value?: string): Promise<string> {
    const name = await target.evaluate((el) =>
      el.closest('[data-screenshot-action]')?.getAttribute('data-screenshot-action') ?? null,
    );
    if (!name) {
      throw new Error('act(): target has no data-screenshot-action on itself or an ancestor');
    }
    await test.step(name, async () => {
      await this.perform(target, kind, value);
      await this.settle();
      await this.checkpoint(name);
    });
    return name;
  }

  /**
   * Performs the raw action.
   *
   * @param {Locator} target - Target element
   * @param {ActKind} kind - Action kind
   * @param {string} [value] - Fill text or option label
   * @returns {Promise<void>}
   */
  private async perform(target: Locator, kind: ActKind, value?: string): Promise<void> {
    const tag = await target.evaluate((el) => el.tagName.toLowerCase());
    if (kind === 'click') {
      await (tag === 'button' ? target : target.locator('button').first()).click();
      return;
    }
    if (kind === 'fill') {
      const input = tag === 'input' ? target : target.locator('input').first();
      await input.fill(value ?? '');
      await input.press('Tab');
      return;
    }
    await (tag === 'button' ? target : target.locator('button').first()).click();
    await this.page.getByRole('option', { name: value, exact: true }).first().click();
  }

  /**
   * Saves and attaches a numbered screenshot.
   *
   * @param {string} name - Checkpoint name
   * @returns {Promise<void>}
   */
  async checkpoint(name: string): Promise<void> {
    this.shot += 1;
    const file = this.testInfo.outputPath(`${String(this.shot).padStart(2, '0')}-${name}.png`);
    await this.page.screenshot({ path: file });
    await this.testInfo.attach(name, { path: file, contentType: 'image/png' });
  }

  /**
   * Picks an option of a FilterSelect wrapper by label.
   *
   * @param {string} testId - Wrapper test id
   * @param {string} label - Option label
   * @returns {Promise<string>} Checkpoint name
   */
  select(testId: string, label: string): Promise<string> {
    return this.act(this.page.getByTestId(testId), 'select', label);
  }

  /**
   * Clicks a checkpointed control by test id.
   *
   * @param {string} testId - Control or wrapper test id
   * @returns {Promise<string>} Checkpoint name
   */
  click(testId: string): Promise<string> {
    return this.act(this.page.getByTestId(testId), 'click');
  }

  /**
   * Fills a checkpointed input by test id.
   *
   * @param {string} testId - Input or wrapper test id
   * @param {string | number} value - Value
   * @returns {Promise<string>} Checkpoint name
   */
  fill(testId: string, value: string | number): Promise<string> {
    return this.act(this.page.getByTestId(testId), 'fill', String(value));
  }

  /**
   * Switches the sheet tab by label.
   *
   * @param {string} label - Tab label, e.g. `Bloodline`
   * @returns {Promise<string>} Checkpoint name
   */
  tab(label: string): Promise<string> {
    return this.act(
      this.page.getByTestId('builder-tabs').getByRole('button', { name: label, exact: true }),
      'click',
    );
  }

  /**
   * Reads the displayed character from the hook.
   *
   * @returns {Promise<CharacterSheet>} Character
   */
  character(): Promise<CharacterSheet> {
    return this.page.evaluate(() => (window as BridgeWindow).ik!.builder!.getCharacter());
  }

  /**
   * Reads computed state from the hook.
   *
   * @returns {Promise<BuilderState>} State
   */
  state(): Promise<BuilderState> {
    return this.page.evaluate(() => (window as BridgeWindow).ik!.builder!.getState());
  }

  /**
   * Reads flags from the hook.
   *
   * @returns {Promise<BuilderFlag[]>} Flags
   */
  flags(): Promise<BuilderFlag[]> {
    return this.page.evaluate(() => (window as BridgeWindow).ik!.builder!.getFlags());
  }

  /**
   * Reads flag codes rendered by the warning surfaces.
   *
   * @returns {Promise<string[]>} Sorted unique codes
   */
  async uiFlagCodes(): Promise<string[]> {
    const raw = await this.page
      .getByTestId('builder-flag')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-flag-code') ?? ''));
    return [...new Set(raw.flatMap((codes) => codes.split(' ')).filter(Boolean))].sort();
  }

  /**
   * Lists slot options for the displayed character.
   *
   * @param {BuilderSlot} slot - Slot
   * @param {number} [vocationIndex] - Vocation entry for `specialization`
   * @returns {Promise<SlotOption[]>} Options
   */
  async options(slot: BuilderSlot, vocationIndex?: number): Promise<SlotOption[]> {
    const body = await this.api('options', {
      slot,
      vocationIndex,
      character: await this.character(),
    });
    return body.options as SlotOption[];
  }

  /**
   * Builds a character through the hook (API create, then load into the UI).
   *
   * @param {BuilderPayload} payload - Build payload
   * @returns {Promise<ApiSnapshot>} Loaded snapshot with resolution and notes
   */
  async create(payload: BuilderPayload): Promise<ApiSnapshot> {
    const result = await this.page.evaluate(
      (p) => (window as BridgeWindow).ik!.builder!.create(p),
      payload,
    );
    await this.settle();
    return result as ApiSnapshot;
  }

  /**
   * Posts to a dev API endpoint.
   *
   * @param {string} path - Endpoint under `/api/dev/builder/`
   * @param {Record<string, unknown>} body - JSON body
   * @returns {Promise<Record<string, unknown>>} Parsed response
   */
  async api(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await this.page.request.post(`/api/dev/builder/${path}`, { data: body });
    expect(res.ok(), `POST /api/dev/builder/${path} → ${res.status()}`).toBe(true);
    return (await res.json()) as Record<string, unknown>;
  }
}

/** Playwright `test` with a `builder` fixture that opens the builder page. */
export const test = base.extend<{ builder: BuilderDriver }>({
  builder: async ({ page }, use, testInfo) => {
    const driver = new BuilderDriver(page, testInfo);
    await driver.goto();
    await use(driver);
  },
});

export { expect };

/**
 * Removes run-specific fields so UI and API snapshots compare.
 *
 * @function normalizeForParity
 * @template T
 * @param {T} value - Character, state, or flags
 * @returns {T} Copy without the character id, timestamps, and cached prose
 */
export function normalizeForParity<T>(value: T): T {
  const copy = JSON.parse(
    JSON.stringify(value, (key, v) => (key === 'cachedText' ? undefined : v)),
  ) as Record<string, unknown>;
  if (copy && typeof copy === 'object' && 'createdAt' in copy) {
    delete copy.id;
    delete copy.createdAt;
    delete copy.updatedAt;
  }
  return copy as T;
}
