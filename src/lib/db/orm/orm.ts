/**
 * @fileoverview MikroORM Singleton
 * @description Lazy-initialised MikroORM instance backed by the shared `pg.Pool`.
 * Uses the Next.js global singleton pattern to survive HMR restarts in development.
 *
 * @module lib/db/orm/orm
 * @version 1.0.0
 * @author Typeir
 * @since 5.0.0
 */

import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';

/** @property {symbol} ormKey - Global symbol used to cache the ORM instance in dev. */
const ormKey = Symbol.for('mikro-orm.instance');

type GlobalWithORM = typeof globalThis & {
  [ormKey]?: MikroORM;
};

/** Cached initialisation promise to prevent duplicate init calls. */
let initPromise: Promise<MikroORM> | null = null;

/**
 * Returns the singleton MikroORM instance, initialising it on first call.
 * In development the instance is cached on `globalThis` so HMR restarts
 * do not open duplicate connection pools.
 *
 * Uses dynamic `import()` for ormConfig to defer entity module evaluation
 * and avoid TDZ errors during webpack module concatenation.
 *
 * @returns {Promise<MikroORM>} Ready-to-use ORM instance
 */
export const getORM = async (): Promise<MikroORM> => {
  const g = globalThis as GlobalWithORM;
  if (g[ormKey]) return g[ormKey];

  if (!initPromise) {
    initPromise = import('./ormConfig').then(({ ormConfig }) =>
      MikroORM.init(ormConfig).then((orm) => {
        if (process.env.NODE_ENV !== 'production') {
          g[ormKey] = orm;
        }
        return orm;
      }),
    );
  }

  return initPromise;
};

/**
 * Returns a fresh forked `EntityManager` for a single request / unit of work.
 *
 * @returns {Promise<EntityManager>} Forked EntityManager
 */
export const getEM = async (): Promise<EntityManager> => {
  const orm = await getORM();
  return orm.em.fork();
};
