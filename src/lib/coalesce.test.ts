import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { coalesce } from './coalesce';

describe('coalesce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('collapses a burst of calls into one run', async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const fetcher = coalesce(task, 300);
    fetcher.schedule();
    fetcher.schedule();
    await vi.advanceTimersByTimeAsync(200);
    fetcher.schedule();
    expect(task).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('runs once more, not once per call, for calls during a run', async () => {
    let finish: () => void = () => {};
    const task = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const fetcher = coalesce(task, 100);
    fetcher.schedule();
    await vi.advanceTimersByTimeAsync(100);
    expect(task).toHaveBeenCalledTimes(1);

    // Two more bursts while the first fetch is still out.
    fetcher.schedule();
    await vi.advanceTimersByTimeAsync(100);
    fetcher.schedule();
    await vi.advanceTimersByTimeAsync(100);
    expect(task).toHaveBeenCalledTimes(1);

    finish();
    await vi.advanceTimersByTimeAsync(100);
    expect(task).toHaveBeenCalledTimes(2);
    finish();
    await vi.advanceTimersByTimeAsync(1000);
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('keeps going after a failed run', async () => {
    const task = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    const fetcher = coalesce(task, 50);
    fetcher.schedule();
    await vi.advanceTimersByTimeAsync(50);
    fetcher.schedule();
    await vi.advanceTimersByTimeAsync(50);
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('does nothing after cancel', async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const fetcher = coalesce(task, 50);
    fetcher.schedule();
    fetcher.cancel();
    fetcher.schedule();
    await vi.advanceTimersByTimeAsync(500);
    expect(task).not.toHaveBeenCalled();
  });
});
