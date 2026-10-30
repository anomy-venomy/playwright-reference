import { getByPath } from '../utils/jsonPath';

/** Immutable, already-parsed snapshot of an API response – safe to assert on many times */
export class ApiResponseWrapper<T = unknown> {
  constructor(
    readonly method: string,
    readonly url: string,
    readonly status: number,
    readonly headers: Record<string, string>,
    readonly body: T,
    readonly durationMs: number,
  ) {}

  get ok(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  /** Read a nested field, e.g. field('user.email') or field('items[0].id') */
  field<V = unknown>(path: string): V {
    return getByPath(this.body, path) as V;
  }

  toString(): string {
    return `${this.method} ${this.url} -> ${this.status} (${this.durationMs} ms)\n${JSON.stringify(this.body, null, 2)}`;
  }
}
