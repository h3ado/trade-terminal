import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from '@/lib/api';
import { usePolledApi } from './usePolledApi';

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}));

describe('usePolledApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps successful responses into hook state', async () => {
    vi.mocked(apiGet).mockResolvedValue({ items: [1, 2], warning: 'soft' });

    const { result, unmount } = renderHook(() =>
      usePolledApi({
        path: '/api/test',
        intervalMs: 60_000,
        initial: [] as number[],
        select: (data: { items?: number[] }) => data.items ?? [],
        getError: (_items, data: { warning?: string }) => data.warning ?? null,
      }),
    );

    await waitFor(() => expect(result.current.value).toEqual([1, 2]));

    expect(apiGet).toHaveBeenCalledWith('/api/test');
    expect(result.current.live).toBe(true);
    expect(result.current.error).toBe('soft');
    expect(result.current.loading).toBe(false);

    unmount();
  });
});
