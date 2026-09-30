import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { SQLInputValue } from 'node:sqlite';
import type { Env } from '../../../cloudflare/src/types';

export function createTestDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  const migrations = new URL('../../../cloudflare/migrations/', import.meta.url);
  for (const directory of readdirSync(migrations).sort()) {
    sqlite.exec(readFileSync(new URL(`${directory}/migration.sql`, migrations), 'utf8'));
  }

  const database = {
    prepare(sql: string) {
      const statement = sqlite.prepare(sql);
      const withBindings = (bindings: SQLInputValue[] = []) => ({
        bind: (...values: SQLInputValue[]) => withBindings(values),
        async first() {
          return statement.get(...bindings) ?? null;
        },
        async all() {
          return { results: statement.all(...bindings) };
        },
        async run() {
          const result = statement.run(...bindings);
          return { meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
        },
      });
      return withBindings();
    },
  };

  return { database: database as unknown as Env['DB'], sqlite };
}
