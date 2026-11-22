import * as m001 from './001_init.js';

export interface Migration {
  /** Must match the position in the list: 1, 2, 3… */
  version: number;
  name: string;
  up: string;
}

/**
 * Every migration, in order. To change the schema later, add a new file
 * (002_something.ts) and append it here — never edit a migration that has already run.
 */
export const migrations: Migration[] = [{ version: 1, name: '001_init', up: m001.up }];
