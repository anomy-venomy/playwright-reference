import { test } from '@fixtures/index';
import { config } from '@config/env.config';
import { Tag } from '@config/tags';

// No login step here: the `setup` project logged in via API once and this test reuses that session
test.describe('Dashboard', () => {
  test(
    'opens directly with the saved session',
    { tag: [Tag.smoke, Tag.regression] },
    async ({ dashboardPage }) => {
      await dashboardPage.open();

      await dashboardPage.expectLoggedInAs(config.user.username);
    },
  );
});
