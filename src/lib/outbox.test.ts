import { describe, expect, it, vi } from 'vitest';

import { createOutbox, looksOffline, OutboxEntry, OutboxOp, SendResult } from './outbox';

const memory = (initial: OutboxEntry[] = []) => {
  let stored = initial;
  return {
    load: async () => stored,
    save: async (entries: OutboxEntry[]) => {
      stored = entries;
    },
    get: () => stored,
  };
};

const received = (bookId: string): OutboxOp => ({ kind: 'markReceived', bookId });
const OFFLINE: SendResult = { ok: false, offline: true, reason: 'TypeError: Failed to fetch' };
const OK: SendResult = { ok: true };

describe('looksOffline', () => {
  it('knows a dropped connection from a refusal', () => {
    expect(looksOffline('TypeError: Failed to fetch')).toBe(true);
    expect(looksOffline('Network request failed')).toBe(true);
    expect(looksOffline('Load failed')).toBe(true);
    expect(looksOffline("This book isn't on its way to you")).toBe(false);
  });
});

describe('outbox', () => {
  it('sends straight away when online', async () => {
    const send = vi.fn().mockResolvedValue(OK);
    const storage = memory();
    const outbox = createOutbox(send, storage);
    expect(await outbox.submit('get it', received('b1'))).toBeNull();
    expect(send).toHaveBeenCalledTimes(1);
    expect(storage.get()).toEqual([]);
  });

  it('passes on a refusal instead of queueing it', async () => {
    const outbox = createOutbox(
      vi.fn().mockResolvedValue({ ok: false, offline: false, reason: 'Not yours' }),
      memory(),
    );
    expect(await outbox.submit('get it', received('b1'))).toBe('Not yours');
    expect(outbox.pending()).toBe(0);
  });

  it('keeps a change made offline, on the device, and sends it later in order', async () => {
    const send = vi.fn<(op: OutboxOp) => Promise<SendResult>>().mockResolvedValue(OFFLINE);
    const storage = memory();
    const onPending = vi.fn();
    const onDrained = vi.fn();
    const outbox = createOutbox(send, storage, { onPending, onDrained });

    expect(await outbox.submit('get one', received('b1'))).toBeNull();
    expect(await outbox.submit('get two', received('b2'))).toBeNull();
    // The second didn't jump the queue by trying on its own.
    expect(send).toHaveBeenCalledTimes(1);
    expect(storage.get().map((entry) => entry.label)).toEqual(['get one', 'get two']);
    expect(onPending).toHaveBeenLastCalledWith(2);

    await outbox.flush();
    expect(outbox.pending()).toBe(2);

    send.mockResolvedValue(OK);
    await outbox.flush();
    expect(send.mock.calls.slice(-2).map(([op]) => op)).toEqual([received('b1'), received('b2')]);
    expect(outbox.pending()).toBe(0);
    expect(storage.get()).toEqual([]);
    expect(onDrained).toHaveBeenCalledTimes(1);
  });

  it('picks up what was waiting before a reload', async () => {
    const storage = memory([
      { id: '1', label: 'get one', op: received('b1'), queuedAt: '2026-10-31T00:00:00Z' },
    ]);
    const send = vi.fn().mockResolvedValue(OK);
    const outbox = createOutbox(send, storage);
    await outbox.flush();
    expect(send).toHaveBeenCalledWith(received('b1'));
    expect(storage.get()).toEqual([]);
  });

  it('drops and reports a queued change the database refuses, then carries on', async () => {
    const storage = memory([
      { id: '1', label: 'get one', op: received('b1'), queuedAt: '' },
      { id: '2', label: 'get two', op: received('b2'), queuedAt: '' },
    ]);
    const send = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, offline: false, reason: 'Not yours' })
      .mockResolvedValueOnce(OK);
    const onRefused = vi.fn();
    const outbox = createOutbox(send, storage, { onRefused });
    await outbox.flush();
    expect(onRefused).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'get one' }),
      'Not yours',
    );
    expect(outbox.pending()).toBe(0);
  });

  it('runs one flush at a time', async () => {
    const storage = memory([{ id: '1', label: 'get one', op: received('b1'), queuedAt: '' }]);
    const send = vi.fn().mockResolvedValue(OK);
    const outbox = createOutbox(send, storage);
    await Promise.all([outbox.flush(), outbox.flush(), outbox.flush()]);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
