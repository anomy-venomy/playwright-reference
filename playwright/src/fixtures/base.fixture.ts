import { test as base } from '@playwright/test';
import { CleanupManager } from '@core/utils/CleanupManager';
import { logger } from '@core/utils/logger';

type BaseFixtures = {
  /** Register teardown work: cleanup.add('delete employee', () => ...) */
  cleanup: CleanupManager;
  /** Auto fixture: logs start/end of every test (replaces global hooks) */
  _testLogger: void;
};

/** Layer 1 – cross-cutting concerns */
export const baseTest = base.extend<BaseFixtures>({
  cleanup: async ({}, use) => {
    const manager = new CleanupManager();
    await use(manager);
    await manager.run();
  },

  _testLogger: [
    async ({}, use, testInfo) => {
      logger.info(`▶ START  ${testInfo.titlePath.slice(1).join(' › ')}`);
      await use();
      const icon = testInfo.status === testInfo.expectedStatus ? '✔' : '✖';
      logger.info(
        `${icon} ${String(testInfo.status).toUpperCase()}  ${testInfo.title} (${testInfo.duration} ms)`,
      );
    },
    { auto: true },
  ],
});
