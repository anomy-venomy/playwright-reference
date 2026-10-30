/**
 * Used ONLY in CI when tests are split (sharded) across machines.
 * Each machine produces a "blob" report; this combines them into one report:
 *   npx playwright merge-reports --config merge.config.ts <blob-dir>
 * You can ignore this file for local runs.
 */
export default {
  testDir: './tests',
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
  ],
};
