// =============================================================================
//  Storage Adapter contract.
//  Both IndexedDB and Supabase implementations must satisfy this interface.
//  Repositories code talks to this — it does not know which backend is live.
// =============================================================================

/** Primary key — single value, or a 2-tuple for composite keys (e.g. score_history). */
export type PK = string | number | [string, string];

export interface Adapter {
  /** Boot/connect — open IndexedDB or initialise the Supabase client. */
  init(): Promise<void>;

  /** Fetch one row by its primary key. */
  get<T = any>(table: string, key: PK): Promise<T | undefined>;

  /** Fetch every row of a table (small tables only — paginate in real prod). */
  getAll<T = any>(table: string): Promise<T[]>;

  /** Fetch all rows where `column === value`. */
  getByIndex<T = any>(table: string, column: string, value: any): Promise<T[]>;

  /** Upsert (insert if missing, replace if present). */
  put<T = any>(table: string, value: T): Promise<void>;

  /** Delete by primary key. */
  delete(table: string, key: PK): Promise<void>;

  /** Bulk delete by predicate — used by cleanup jobs. */
  deleteWhere(table: string, predicate: (row: any) => boolean): Promise<number>;

  /** Diagnostic — which adapter is active? Shows in admin UI. */
  readonly name: "indexeddb" | "supabase";
}
