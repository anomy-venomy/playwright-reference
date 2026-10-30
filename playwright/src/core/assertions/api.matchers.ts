import { isDeepStrictEqual } from 'node:util';
import { expect as baseExpect } from '@playwright/test';
import { ApiResponseWrapper } from '../api/ApiResponseWrapper';
import { validateSchema } from '../utils/schemaValidator';

/**
 * Custom, reusable API assertions plugged into Playwright's `expect`:
 *
 *   await expect(res).toHaveStatus(201);
 *   await expect(res).toMatchSchema('employee');
 *   await expect(res).toHaveField('user.email', email);
 *   await expect(res).toRespondWithin(2000);
 *
 * Failure messages include the full request/response for fast debugging.
 */
export const expect = baseExpect.extend({
  toHaveStatus(received: ApiResponseWrapper, expected: number) {
    const pass = received.status === expected;
    return {
      pass,
      name: 'toHaveStatus',
      expected,
      actual: received.status,
      message: () =>
        `${this.utils.matcherHint('toHaveStatus', undefined, undefined, { isNot: this.isNot })}\n\n` +
        `Expected status: ${pass ? 'not ' : ''}${expected}\nReceived: ${received.toString()}`,
    };
  },

  toMatchSchema(received: ApiResponseWrapper, schemaName: string) {
    const { valid, errors } = validateSchema(schemaName, received.body);
    return {
      pass: valid,
      name: 'toMatchSchema',
      message: () =>
        valid
          ? `Expected response NOT to match schema "${schemaName}"`
          : `Schema "${schemaName}" violations:\n  ${errors.join('\n  ')}\n\nBody: ${JSON.stringify(received.body, null, 2)}`,
    };
  },

  toHaveField(received: ApiResponseWrapper, path: string, expected?: unknown) {
    const actual = received.field(path);
    const exists = actual !== undefined;
    const pass = expected === undefined ? exists : isDeepStrictEqual(actual, expected);
    return {
      pass,
      name: 'toHaveField',
      expected,
      actual,
      message: () =>
        expected === undefined
          ? `Expected field "${path}" ${this.isNot ? 'not ' : ''}to exist`
          : `Field "${path}"\nExpected: ${this.utils.printExpected(expected)}\nReceived: ${this.utils.printReceived(actual)}`,
    };
  },

  toRespondWithin(received: ApiResponseWrapper, maxMs: number) {
    const pass = received.durationMs <= maxMs;
    return {
      pass,
      name: 'toRespondWithin',
      expected: maxMs,
      actual: received.durationMs,
      message: () => `${received.method} ${received.url} took ${received.durationMs} ms (limit ${maxMs} ms)`,
    };
  },
});
