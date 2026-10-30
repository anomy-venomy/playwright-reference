import { test } from '@playwright/test';

/**
 * Method decorator that wraps a page-object / service method in `test.step`.
 * The HTML report and trace then show readable business steps, e.g.
 *   "LoginPage.login" → "EmployeeService.create"
 * Outside a running test it simply calls the method.
 *
 *   @step()                    → step named "ClassName.method"
 *   @step('Create employee')   → custom name
 */
export function step(name?: string) {
  return function decorator<This, Args extends unknown[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>,
  ) {
    return function replacement(this: This, ...args: Args): Promise<Return> {
      const className = (this as { constructor: { name: string } }).constructor.name;
      const stepName = name ?? `${className}.${String(context.name)}`;
      try {
        test.info();
      } catch {
        return target.call(this, ...args); // not inside a test (e.g. worker fixture)
      }
      return test.step(stepName, () => target.call(this, ...args), { box: true });
    };
  };
}
