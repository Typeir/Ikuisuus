---
applyTo: 'src/lib/db/orm/**/*.ts,src/lib/db/content/adapters/pg/**/*.ts,src/lib/db/content/repositories/**/*.ts,src/app/api/**/*.ts'
---

# MikroORM Runtime-Safe Typing Rules

Before modifying any MikroORM entity, ORM bootstrap file, or PG repository, you MUST:

1. Assume `emitDecoratorMetadata` is unavailable for runtime inference unless explicitly enabled and verified.
2. Set explicit `type` (or `entity` for relations) on every persisted decorator.
3. Treat ORM discovery errors as blocking failures, never as acceptable empty-data fallbacks.

## Hard Rules

### 1) Primary keys must always declare explicit type

Required patterns:

```ts
@PrimaryKey({ type: 'number', autoincrement: true })
id!: number;
```

```ts
@PrimaryKey({ type: 'string' })
id!: string;
```

Never use:

```ts
@PrimaryKey({ autoincrement: true }) // invalid in this codebase
```

### 2) Scalar properties must declare type explicitly

Required examples:

```ts
@Property({ type: 'string' })
name!: string;

@Property({ type: 'number' })
count!: number;

@Property({ type: 'Date', columnType: 'timestamptz' })
createdAt!: Date;
```

### 3) Relation decorators must declare entity explicitly

Required examples:

```ts
@ManyToOne(() => UserEntity)
user!: UserEntity;

@OneToOne(() => ProfileEntity, { nullable: true })
profile?: ProfileEntity;
```

If relation target is ambiguous, include explicit `entity` option.

### 4) New entities must be registered and bootstrapped safely

When adding a new entity:

- Add it to `src/lib/db/orm/ormConfig.ts` `entities` array.
- Ensure ORM bootstrap failures are surfaced clearly in logs.
- Do not silently convert ORM init failures into successful `200 []` responses in API routes.

## Validation Commands

Run these checks before claiming completion:

```bash
# Find likely missing type/entity in PrimaryKey decorators
rg "@PrimaryKey\(\{[^}]*\}\)" src/lib/db/orm/entities -n

# Verify no PrimaryKey decorator omits type/entity
rg "@PrimaryKey\(\{(?![^}]*type:)(?![^}]*entity:)[^}]*\}\)" src/lib/db/orm/entities -n

# Validate health and tests
npm run health:check
npm test
```

## Remediation Protocol

If logs show errors like:

- `Please provide either 'type' or 'entity' attribute in <Entity>.<field>`
- `ReflectMetadataProvider` discovery failures

Then immediately:

1. Identify the exact entity field in the error.
2. Add explicit `type` or `entity` to the offending decorator.
3. Restart the server and re-run API request validation.
4. Confirm endpoint returns data or a real error status, not silent empty arrays.
