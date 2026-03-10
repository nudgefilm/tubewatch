const YOUTUBE_FETCH_TIMEOUT_MS = 10_000;
const YOUTUBE_FETCH_MAX_RETRIES = 2;

export function getYouTubeApiKey(): string {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY_MISSING");
  }

  return apiKey;
}

export function toNumber(value: unknown): number | null {
  if (value == null) return null;

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function createTimeoutAbortController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  controller.signal.addEventListener(
    "abort",
    () => {
      clearTimeout(timeoutId);
    },
    { once: true }
  );

  return controller;
}

export async function fetchJsonWithRetry<T>(
  url: string,
  options?: { label?: string }
): Promise<T> {
  const label = options?.label ?? "YOUTUBE_API_REQUEST";
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= YOUTUBE_FETCH_MAX_RETRIES; attempt += 1) {
    const controller = createTimeoutAbortController(YOUTUBE_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();

        if (response.status >= 400 && response.status < 500) {
          throw new Error(
            `${label}:YOUTUBE_API_ERROR:${response.status} ${text}`
          );
        }

        // 5xx → retry 대상
        throw new Error(
          `${label}:YOUTUBE_API_ERROR_RETRYABLE:${response.status} ${text}`
        );
      }

      const json = (await response.json()) as T;
      return json;
    } catch (error) {
      lastError = error;

      const isAbortError =
        error instanceof Error && error.name === "AbortError";

      if (isAbortError) {
        console.error(`${label}:YOUTUBE_API_TIMEOUT`, {
          timeoutMs: YOUTUBE_FETCH_TIMEOUT_MS,
          attempt,
        });
      } else if (error instanceof Error) {
        const message = error.message ?? "unknown";

        const isRetryable =
          message.includes("YOUTUBE_API_ERROR_RETRYABLE") ||
          !message.includes("YOUTUBE_API_ERROR:");

        if (!isRetryable) {
          // 비재시도 에러 → 즉시 throw
          throw error;
        }

        console.error(`${label}:YOUTUBE_API_RETRY`, {
          attempt,
          error: message,
        });
      }

      if (attempt === YOUTUBE_FETCH_MAX_RETRIES) {
        break;
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("YOUTUBE_API_ERROR_UNKNOWN");
}

export function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function safeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function safeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter((tag): tag is string => typeof tag === "string");
}

