/**
 * @fileoverview VirtualList Tests
 * @description Covers the props forwarded to react-window's `List`: row
 * count, pitch, clamped height and the rendered-range callback. `List` is
 * stubbed so the assertions read props, not layout.
 *
 * @module tests/unit/src/lib/components/ui/virtualList/virtualList
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering
 * @requires @/lib/components/ui/virtualList/virtualList Module under test
 */

import { VirtualList } from '@/lib/components/ui/virtualList/virtualList';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { listProps } = vi.hoisted(() => ({
  listProps: { current: null as Record<string, unknown> | null },
}));

vi.mock('react-window', () => ({
  List: (props: Record<string, unknown>) => {
    listProps.current = props;
    return <ul />;
  },
}));

describe('VirtualList', () => {
  afterEach(() => {
    cleanup();
    listProps.current = null;
  });

  it('should render nothing for an empty list', () => {
    const { container } = render(
      <VirtualList items={[]} rowHeight={10} maxHeight={100} renderRow={() => null} />,
    );
    expect(container.innerHTML).toBe('');
    expect(listProps.current).toBeNull();
  });

  it('should clamp the height to the row total and forward the range callback', () => {
    const onRowsRendered = vi.fn();
    render(
      <VirtualList
        items={[1, 2, 3]}
        rowHeight={10}
        maxHeight={100}
        renderRow={() => null}
        onRowsRendered={onRowsRendered}
      />,
    );
    expect(listProps.current?.rowCount).toBe(3);
    expect(listProps.current?.rowHeight).toBe(10);
    expect(listProps.current?.style).toEqual({
      height: 30,
      overflowX: 'hidden',
    });
    expect(listProps.current?.onRowsRendered).toBe(onRowsRendered);
  });

  it('should cap the height at maxHeight', () => {
    render(
      <VirtualList
        items={Array.from({ length: 50 }, (_, i) => i)}
        rowHeight={10}
        maxHeight={100}
        renderRow={() => null}
      />,
    );
    expect(listProps.current?.style).toEqual({
      height: 100,
      overflowX: 'hidden',
    });
    expect(listProps.current?.defaultHeight).toBe(100);
  });
});
