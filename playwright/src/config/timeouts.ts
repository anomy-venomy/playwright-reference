/** Central place for timeouts – never hard-code numbers in pages or steps */
export const Timeouts = {
  test: 90_000, // whole test
  expect: 10_000, // how long expect() keeps retrying
  action: 15_000, // click, fill...
  navigation: 30_000, // page.goto, waitForURL
  apiRequest: 30_000, // single API call in ApiClient
  poll: 15_000, // expect.poll / custom polling
} as const;
