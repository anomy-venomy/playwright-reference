import { APIRequestContext, test } from '@playwright/test';
import { config } from '@config/env.config';
import { Timeouts } from '@config/timeouts';
import { logger } from '../utils/logger';
import { ApiResponseWrapper } from './ApiResponseWrapper';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  /** Send without the Authorization header for this one call */
  skipAuth?: boolean;
}

/**
 * Single reusable HTTP engine for the whole framework.
 * - base URL + auth header handling
 * - timing, logging, and request/response attachments in the HTML report
 * - returns a parsed ApiResponseWrapper, never a raw stream
 * Services (AuthService, EmployeeService…) compose this class; steps can also use it directly.
 */
export class ApiClient {
  private token?: string;

  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string = config.apiBaseUrl,
    private readonly authScheme: string = 'Token', // use 'Bearer' for most APIs
  ) {}

  setToken(token?: string): this {
    this.token = token;
    return this;
  }

  clearToken(): this {
    this.token = undefined;
    return this;
  }

  get hasToken(): boolean {
    return !!this.token;
  }

  get = <T = unknown>(endpoint: string, opts?: RequestOptions) => this.send<T>('GET', endpoint, opts);
  post = <T = unknown>(endpoint: string, opts?: RequestOptions) => this.send<T>('POST', endpoint, opts);
  put = <T = unknown>(endpoint: string, opts?: RequestOptions) => this.send<T>('PUT', endpoint, opts);
  patch = <T = unknown>(endpoint: string, opts?: RequestOptions) => this.send<T>('PATCH', endpoint, opts);
  delete = <T = unknown>(endpoint: string, opts?: RequestOptions) => this.send<T>('DELETE', endpoint, opts);

  async send<T = unknown>(
    method: HttpMethod,
    endpoint: string,
    opts: RequestOptions = {},
  ): Promise<ApiResponseWrapper<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...opts.headers,
    };
    if (this.token && !opts.skipAuth) headers.Authorization = `${this.authScheme} ${this.token}`;

    logger.debug(`--> ${method} ${url}`, opts.body);
    const started = Date.now();
    const response = await this.request.fetch(url, {
      method,
      headers,
      params: opts.query,
      data: opts.body,
      timeout: Timeouts.apiRequest,
      failOnStatusCode: false, // never throw on 4xx/5xx – tests assert the status themselves
    });
    const durationMs = Date.now() - started;

    const text = await response.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      /* non-JSON body – keep raw text */
    }

    const wrapped = new ApiResponseWrapper<T>(
      method,
      url,
      response.status(),
      response.headers(),
      body as T,
      durationMs,
    );
    logger.info(`<-- ${method} ${url} ${wrapped.status} (${durationMs} ms)`);
    await this.attach(wrapped, opts.body);
    return wrapped;
  }

  /** Attach request/response to the Playwright report (only when called inside a test) */
  private async attach(res: ApiResponseWrapper, requestBody: unknown): Promise<void> {
    try {
      const safeBody = maskSecrets(requestBody);
      await test.info().attach(`${res.method} ${new URL(res.url).pathname} → ${res.status}`, {
        body: JSON.stringify({ request: safeBody, response: res.body, durationMs: res.durationMs }, null, 2),
        contentType: 'application/json',
      });
    } catch {
      /* outside a test (e.g. worker fixture) – nothing to attach to */
    }
  }
}

// Replaces password/token/secret values with *** before they go into the report
function maskSecrets(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  return JSON.parse(
    JSON.stringify(body, (key, value) => (/password|token|secret/i.test(key) ? '***' : value)),
  );
}
