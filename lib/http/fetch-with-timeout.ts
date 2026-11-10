/**
 * Timeout padrão (ms) das chamadas a APIs externas quando o workspace não
 * tem um valor configurado (`Workspace.externalApiTimeoutMs`).
 */
export const DEFAULT_EXTERNAL_API_TIMEOUT_MS = 10_000;
export const MIN_EXTERNAL_API_TIMEOUT_MS = 1_000;
export const MAX_EXTERNAL_API_TIMEOUT_MS = 120_000;

export class ExternalTimeoutError extends Error {
  constructor(
    public readonly target: string,
    public readonly timeoutMs: number,
  ) {
    super(`A chamada para ${target} excedeu o tempo limite de ${timeoutMs} ms`);
    this.name = 'ExternalTimeoutError';
  }
}

/** Garante um timeout válido, caindo para o padrão quando ausente/fora da faixa. */
export function resolveTimeoutMs(value: number | null | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_EXTERNAL_API_TIMEOUT_MS;
  return Math.min(
    Math.max(Math.round(value), MIN_EXTERNAL_API_TIMEOUT_MS),
    MAX_EXTERNAL_API_TIMEOUT_MS,
  );
}

function targetLabel(input: string | URL) {
  try {
    return new URL(input.toString()).host;
  } catch {
    return 'serviço externo';
  }
}

/**
 * `fetch` com timeout (`AbortSignal.timeout`). Se o chamador também passar um
 * `signal` (ex.: botão "parar" da IA), os dois são combinados.
 */
export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit & { timeoutMs?: number | null } = {},
): Promise<Response> {
  const { timeoutMs: rawTimeout, signal, ...rest } = init;
  const timeoutMs = resolveTimeoutMs(rawTimeout);
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  try {
    return await fetch(input, { ...rest, signal: combined });
  } catch (error) {
    if (timeoutSignal.aborted && !signal?.aborted) {
      throw new ExternalTimeoutError(targetLabel(input), timeoutMs);
    }
    throw error;
  }
}
