# Testing Rules (Vitest + React Testing Library)

> **HARD RULES**: Zero act warnings. Zero JSDOM-missing API calls in runtime. Deterministic timer tests.

## Stack

- **Framework**: Vitest
- **DOM Environment**: jsdom
- **React Testing**: `@testing-library/react`, `@testing-library/user-event`
- **Setup**: `tests/setup/vitest.setup.ts`

## File Structure

```
tests/
├── unit/src/           # Mirrors src/ structure
├── integration/src/    # Integration tests
├── fixtures/           # Shared test data
├── setup/
│   └── vitest.setup.ts # Global mocks
└── scripts/
    └── enforceCoverage.mjs  # Coverage enforcement
```

---

## DO / DO NOT

### ✅ DO

```tsx
// 1. Use async userEvent (no act warnings)
const user = userEvent.setup();
await user.click(button);

// 2. Use waitFor for async assertions
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});

// 3. Wrap state updates with act when needed
await act(async () => {
  vi.advanceTimersByTime(1000);
});

// 4. Use fake timers for notification/timer tests
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

// 5. Mock createPortal for portal-rendered components
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

// 6. Wrap with NotificationProvider when testing notification-dependent code
render(
  <NotificationProvider>
    <ComponentUnderTest />
  </NotificationProvider>,
);

// 7. Clean up mocks in afterEach
afterEach(() => {
  vi.clearAllMocks();
});
```

### ❌ DO NOT

```tsx
// 1. DO NOT use non-async fireEvent for interactions that cause state updates
fireEvent.click(button); // ❌ May cause act warnings
await userEvent.click(button); // ✅

// 2. DO NOT leave un-awaited userEvent calls
userEvent.click(button); // ❌ Missing await
await userEvent.click(button); // ✅

// 3. DO NOT call JSDOM-missing APIs in runtime code
alert('Error!'); // ❌ JSDOM does not implement alert
notifications.error('Error!'); // ✅ Use notification system

// 4. DO NOT use real timers for notification tests
// ❌ Flaky - depends on real time
expect(screen.queryByText('Notification')).not.toBeInTheDocument();
// ✅ Use fake timers
vi.advanceTimersByTime(5000);

// 5. DO NOT hardcode magic timer values
setTimeout(callback, 4000); // ❌ What is 4000?
setTimeout(callback, NOTIFICATION_DEFAULT_DURATIONS.success); // ✅ Named constant

// 6. DO NOT leave console warnings about missing providers
render(<ComponentUsingNotifications />); // ❌ Missing provider
```

---

## Act Warnings Prevention

### Understanding Act Warnings

Act warnings occur when:

1. State updates happen outside of `act()` scope
2. Async operations complete after test assertions
3. Timers fire without being wrapped

### Common Patterns

**Timer-based components** (notifications, tooltips):

```tsx
describe('AutoDismiss', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should auto-dismiss after duration', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    // Trigger notification
    fireEvent.click(screen.getByText('Show'));
    expect(screen.getByText('Message')).toBeInTheDocument();

    // Advance timers within act
    await act(async () => {
      vi.advanceTimersByTime(NOTIFICATION_DEFAULT_DURATIONS.info);
    });

    await waitFor(() => {
      expect(screen.queryByText('Message')).not.toBeInTheDocument();
    });
  });
});
```

**Hover/focus interactions**:

```tsx
it('should show tooltip on hover', async () => {
  const user = userEvent.setup();
  render(
    <Tooltip content='Tip'>
      <button>Hover me</button>
    </Tooltip>,
  );

  await user.hover(screen.getByRole('button'));

  await waitFor(() => {
    expect(screen.getByText('Tip')).toBeInTheDocument();
  });
});
```

---

## NotificationProvider Wrapping

The notification system requires a provider. For tests:

```tsx
import { NotificationProvider, useNotifications } from '@/lib/components/ui';

// Test component that uses notifications
function TestConsumer() {
  const notifications = useNotifications();
  return <button onClick={() => notifications.success('Done!')}>Save</button>;
}

describe('Feature using notifications', () => {
  it('should show notification', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();

    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    await user.click(screen.getByText('Save'));

    expect(screen.getByText('Done!')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
```

---

## Mock Patterns

### Portal Rendering (Modals, Notifications, Tooltips)

```tsx
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});
```

### next-intl (Translations)

Already configured in `tests/setup/vitest.setup.ts`:

```tsx
vi.mock('next-intl/navigation', () => ({
  createNavigation: vi.fn(() => ({
    Link: vi.fn(),
    redirect: vi.fn(),
    usePathname: vi.fn(() => '/'),
    useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  })),
}));
```

For translation functions:

```tsx
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
```

### SVG Imports

Already configured in `tests/setup/vitest.setup.ts` to prevent jsdom XML parser errors.

### localStorage/sessionStorage

```tsx
const mockStorage: Record<string, string> = {};
vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
  (key) => mockStorage[key] ?? null,
);
vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
  mockStorage[key] = value;
});
```

---

## Acceptance Checks (grep-based)

Run these to validate test quality:

```bash
# No un-awaited userEvent calls
grep -r "userEvent\.\w\+(" tests/ | grep -v "await userEvent\." | grep -v "userEvent\.setup"

# No alert() calls (should use notifications)
grep -rn "alert(" src/ --include="*.ts" --include="*.tsx"

# No magic timer numbers in notification tests
grep -rn "advanceTimersByTime(\d" tests/ | grep -v "NOTIFICATION_"
```

---

## Test Timing Constants

When testing notifications, use exported constants:

```tsx
import {
  NOTIFICATION_EXIT_ANIMATION_MS,
  NOTIFICATION_DEFAULT_DURATIONS,
  NOTIFICATION_MAX_VISIBLE,
} from '@/lib/components/ui/pushNotification';

// Use in tests
vi.advanceTimersByTime(NOTIFICATION_DEFAULT_DURATIONS.success);
vi.advanceTimersByTime(NOTIFICATION_EXIT_ANIMATION_MS);
```

---

## Common Issues and Fixes

### "Unable to fire event - please provide a DOM element"

**Cause**: Querying portal-rendered content with `container.querySelector` when portal renders to `document.body`

**Fix**: Use `screen` queries instead:

```tsx
// ❌ Won't find portal content
const dialog = container.querySelector('[role="dialog"]');

// ✅ Finds anywhere in document
const dialog = screen.getByRole('dialog');
```

### "A suspended resource finished loading inside a test"

**Cause**: Async components completing after test ends

**Fix**: Await all async operations:

```tsx
await waitFor(() => {
  expect(screen.getByText('Content')).toBeInTheDocument();
});
```

### Console warnings about missing props

**Cause**: next-intl or other providers not mocked

**Fix**: Add mocks in test file or `vitest.setup.ts`

---

## Related Documentation

- [SCSS Theme Rules](./scss-theme-rules.md) - Color token requirements
- [JSDoc Standards](./jsdoc.md) - Documentation requirements
- [Encounter Module](./encounter-module.md) - Play Mode testing patterns
