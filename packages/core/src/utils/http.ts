import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface IGuardedAxiosRequestConfig extends AxiosRequestConfig {
  /** Optional byte limit for data: URLs. Defaults to 10 MiB. */
  maxDataUrlBytes?: number;
}

function getDataUrlPayloadBytes(dataUrl: string): number {
  // data:[<mediatype>][;base64],<data>
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) {
    return 0;
  }
  const header = dataUrl.substring(0, commaIdx).toLowerCase();
  const payload = dataUrl.substring(commaIdx + 1);

  if (header.includes(';base64')) {
    // Base64 size: 3/4 of length, minus padding
    const len = payload.length;
    const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
    return Math.floor((len * 3) / 4) - padding;
  }

  // URL-encoded payload; approximate by decoding length
  try {
    return decodeURIComponent(payload).length;
  } catch {
    return payload.length;
  }
}

function enforceDataUrlLimit(
  url?: string,
  cfg?: IGuardedAxiosRequestConfig
): void {
  if (!url) {
    return;
  }
  if (url.startsWith('data:')) {
    const limit = cfg?.maxDataUrlBytes ?? 10 * 1024 * 1024; // 10 MiB default
    const size = getDataUrlPayloadBytes(url);
    if (size > limit) {
      throw new Error(
        `Data URL exceeds limit (${size} bytes > ${limit} bytes)`
      );
    }
  }
}

export async function get<T = any, R = AxiosResponse<T>>(
  url: string,
  config?: IGuardedAxiosRequestConfig
): Promise<R> {
  enforceDataUrlLimit(url, config);
  return axios.get(url, config) as unknown as Promise<R>;
}

export async function post<T = any, R = AxiosResponse<T>>(
  url: string,
  data?: any,
  config?: IGuardedAxiosRequestConfig
): Promise<R> {
  enforceDataUrlLimit(url, config);
  return axios.post(url, data, config) as unknown as Promise<R>;
}

/**
 * Turn a request failure into a short, user-facing string that preserves the
 * information needed to tell causes apart: an expired key (401), a wrong
 * endpoint path (404), and a model rejecting the request (400) otherwise all
 * look identical to the user.
 */
export function describeRequestError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === undefined) {
      // No response at all: DNS failure, connection refused, CORS, timeout.
      return error.message || 'could not reach the endpoint';
    }

    const data = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | string
      | undefined;
    const apiMessage =
      typeof data === 'string'
        ? data
        : (data?.error?.message ?? data?.message);

    const detail = apiMessage?.trim() || error.response?.statusText || '';
    return detail ? `HTTP ${status}: ${detail}` : `HTTP ${status}`;
  }

  return error instanceof Error ? error.message : String(error);
}

export const http = { get, post };

export type { IGuardedAxiosRequestConfig };
