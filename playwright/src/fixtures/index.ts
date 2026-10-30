/**
 * Single import for every test:
 *   import { test, expect } from '@fixtures/index';
 * `test` carries all fixture layers; `expect` includes the custom API matchers.
 *
 *   baseTest (cleanup, logging) → apiTest (api, guestApi, seedApi)
 *     → dataTest (createEmployee, existingEmployee) → uiTest (page objects)
 */
import { uiTest } from './ui.fixture';

export const test = uiTest;
export { expect } from '@core/assertions/api.matchers';
export type { ApiServices } from './api.fixture';
