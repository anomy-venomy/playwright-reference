/**
 * Reads a value with a simple dot / index path:
 *   getByPath(body, 'user.email')
 *   getByPath(body, 'items[0].name')
 */
export function getByPath(source: unknown, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]), source);
}
