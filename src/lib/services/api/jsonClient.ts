/**
 * @fileoverview JSON HTTP Client Utilities
 * @description Small client-side wrappers around fetch for JSON APIs.
 * Centralizes response validation and request option defaults used by
 * service modules.
 *
 * @module lib/services/api/jsonClient
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/**
 * Error thrown when an HTTP response status is not successful.
 *
 * @class HttpStatusError
 */
export class HttpStatusError extends Error {
  /**
   * @property {number} status - HTTP status code
   */
  status: number;

  /**
   * @param {number} status - HTTP status code
   * @param {string} [message] - Optional error message
   */
  constructor(status: number, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = 'HttpStatusError';
    this.status = status;
  }
}

/**
 * Performs a GET request and parses JSON response body.
 *
 * @template T
 * @param {string} url - Absolute or relative API URL
 * @returns {Promise<T>} Parsed JSON payload
 * @throws {HttpStatusError} When response status is not 2xx
 */
export async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpStatusError(response.status);
  }
  return (await response.json()) as T;
}

/**
 * Performs a POST request with JSON body and parses JSON response body.
 *
 * @template TRequest
 * @template TResponse
 * @param {string} url - Absolute or relative API URL
 * @param {TRequest} body - Serializable JSON request body
 * @returns {Promise<TResponse>} Parsed JSON payload
 * @throws {HttpStatusError} When response status is not 2xx
 */
export async function postJson<TRequest, TResponse>(
  url: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new HttpStatusError(response.status);
  }

  return (await response.json()) as TResponse;
}
