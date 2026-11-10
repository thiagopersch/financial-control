import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_EXTERNAL_API_TIMEOUT_MS,
  ExternalTimeoutError,
  fetchWithTimeout,
  resolveTimeoutMs,
} from '@/lib/http/fetch-with-timeout';

describe('resolveTimeoutMs', () => {
  it('defaults when missing and clamps to the allowed range', () => {
    expect(resolveTimeoutMs(null)).toBe(DEFAULT_EXTERNAL_API_TIMEOUT_MS);
    expect(resolveTimeoutMs(10)).toBe(1000);
    expect(resolveTimeoutMs(999_999)).toBe(120_000);
    expect(resolveTimeoutMs(2500)).toBe(2500);
  });
});

describe('fetchWithTimeout', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('throws ExternalTimeoutError when the server takes too long', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            );
          }),
      ),
    );
    vi.useFakeTimers();
    const promise = fetchWithTimeout('https://api.exemplo.com/send', { timeoutMs: 1000 });
    const assertion = expect(promise).rejects.toBeInstanceOf(ExternalTimeoutError);
    await vi.advanceTimersByTimeAsync(1100);
    await assertion;
    vi.useRealTimers();
  });

  it('returns the response when it arrives in time', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('ok', { status: 200 })),
    );
    const res = await fetchWithTimeout('https://api.exemplo.com', { timeoutMs: 1000 });
    expect(await res.text()).toBe('ok');
  });
});
