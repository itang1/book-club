/**
 * Runs `task` at most once per burst. Calls within `waitMs` of each other
 * collapse into one run after the burst ends, and a call that lands while a
 * run is still going queues exactly one more run after it, never a pile.
 *
 * Realtime sends one event per changed row, so passing a book on (a new
 * handoff, a queue row, the book itself) used to trigger three full fetches
 * of every table at once.
 */
export function coalesce(task: () => Promise<unknown>, waitMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let again = false;
  let stopped = false;

  const run = async () => {
    timer = null;
    if (stopped) {
      return;
    }
    if (running) {
      again = true;
      return;
    }
    running = true;
    try {
      await task();
    } catch {
      // The task reports its own failures; a burst shouldn't stop on one.
    } finally {
      running = false;
    }
    if (again) {
      again = false;
      schedule();
    }
  };

  const schedule = () => {
    if (stopped) {
      return;
    }
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(run, waitMs);
  };

  return {
    schedule,
    cancel: () => {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    },
  };
}
