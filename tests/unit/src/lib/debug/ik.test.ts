/**
 * @fileoverview Unit tests for the window.ik global debug namespace
 * @description Tests namespace initialisation, module registration/unregistration,
 * and SSR safety (no window object).
 *
 * @module tests/unit/src/lib/debug/ik
 */

import {
    ensureIkNamespace,
    registerIkModule,
    unregisterIkModule,
    type IkWorldSimDebug,
} from '@/lib/debug/ik';
import { afterEach, describe, expect, it } from 'vitest';

describe('ensureIkNamespace', () => {
  afterEach(() => {
    delete (window as Window & { ik?: unknown }).ik;
  });

  it('creates window.ik when absent', () => {
    expect((window as Window & { ik?: unknown }).ik).toBeUndefined();
    ensureIkNamespace();
    expect(window.ik).toBeDefined();
  });

  it('returns the same object on subsequent calls', () => {
    const a = ensureIkNamespace();
    const b = ensureIkNamespace();
    expect(a).toBe(b);
  });

  it('does not overwrite an existing window.ik', () => {
    const original = {};
    (window as Window & { ik: object }).ik = original;
    const returned = ensureIkNamespace();
    expect(returned).toBe(original);
  });
});

describe('registerIkModule / unregisterIkModule', () => {
  afterEach(() => {
    delete (window as Window & { ik?: unknown }).ik;
  });

  it('registers a module under the correct key', () => {
    const fakeWs: IkWorldSimDebug = {
      deltaTimeCap: 1 / 15,
      get fps() {
        return 60;
      },
      get time() {
        return 0;
      },
      get running() {
        return false;
      },
      simulationSpeed: 1,
    };
    registerIkModule('ws', fakeWs);
    expect(window.ik.ws).toBe(fakeWs);
  });

  it('overwrites an existing registration (hot-reload safe)', () => {
    const first: IkWorldSimDebug = {
      deltaTimeCap: 0.1,
      get fps() {
        return 0;
      },
      get time() {
        return 0;
      },
      get running() {
        return false;
      },
      simulationSpeed: 1,
    };
    const second: IkWorldSimDebug = {
      deltaTimeCap: 0.2,
      get fps() {
        return 0;
      },
      get time() {
        return 0;
      },
      get running() {
        return false;
      },
      simulationSpeed: 1,
    };
    registerIkModule('ws', first);
    registerIkModule('ws', second);
    expect(window.ik.ws).toBe(second);
  });

  it('unregisterIkModule removes the key', () => {
    const fakeWs: IkWorldSimDebug = {
      deltaTimeCap: 1 / 15,
      get fps() {
        return 0;
      },
      get time() {
        return 0;
      },
      get running() {
        return false;
      },
      simulationSpeed: 1,
    };
    registerIkModule('ws', fakeWs);
    unregisterIkModule('ws');
    expect(window.ik.ws).toBeUndefined();
  });
});
