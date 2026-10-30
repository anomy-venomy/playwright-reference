import { logger } from './logger';

type CleanupFn = () => Promise<unknown>;

/**
 * Collects teardown actions during a test and runs them afterwards in reverse order,
 * whether the test passed or failed. Provided per test by the `cleanup` fixture.
 */
export class CleanupManager {
  private readonly tasks: { name: string; fn: CleanupFn }[] = [];

  add(name: string, fn: CleanupFn): void {
    this.tasks.push({ name, fn });
  }

  /** Drains the queue, so calling it twice is safe */
  async run(): Promise<void> {
    for (const { name, fn } of this.tasks.splice(0).reverse()) {
      try {
        await fn();
        logger.debug(`Cleanup done: ${name}`);
      } catch (error) {
        logger.warn(`Cleanup failed: ${name}`, String(error));
      }
    }
  }
}
