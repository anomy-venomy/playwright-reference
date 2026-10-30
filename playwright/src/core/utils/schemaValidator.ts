import Ajv, { ValidateFunction } from 'ajv';
import fs from 'fs';
import path from 'path';

const ajv = new Ajv({ allErrors: true, strict: false });
const cache = new Map<string, ValidateFunction>(); // compile each schema only once
const SCHEMA_DIR = path.resolve(process.cwd(), 'src/api/schemas');

/** Validates data against src/api/schemas/<name>.schema.json. Returns readable errors. */
export function validateSchema(schemaName: string, data: unknown): { valid: boolean; errors: string[] } {
  let validate = cache.get(schemaName);
  if (!validate) {
    const file = path.join(SCHEMA_DIR, `${schemaName}.schema.json`);
    if (!fs.existsSync(file)) throw new Error(`Schema not found: ${file}`);
    validate = ajv.compile(JSON.parse(fs.readFileSync(file, 'utf-8')));
    cache.set(schemaName, validate);
  }
  const valid = validate(data) as boolean;
  const errors = (validate.errors ?? []).map((e) => `${e.instancePath || '(root)'} ${e.message}`);
  return { valid, errors };
}
