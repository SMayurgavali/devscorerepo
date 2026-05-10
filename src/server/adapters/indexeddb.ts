// =============================================================================
//  IndexedDB adapter — zero-config, runs entirely in the browser.
//  Default for local dev + standalone deployments.
// =============================================================================

import { openDB, type IDBPDatabase } from "idb";
import { DB_NAME, DB_VERSION, STORES } from "../schema";
import type { Adapter, PK } from "./types";

class IndexedDBAdapter implements Adapter {
  readonly name = "indexeddb" as const;
  private _db: IDBPDatabase | null = null;

  async init() {
    if (this._db) return;
    this._db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORES.users)) {
          const s = d.createObjectStore(STORES.users, { keyPath: "id" });
          s.createIndex("by_email", "email", { unique: true });
          s.createIndex("by_role", "role");
          s.createIndex("by_collegeId", "collegeId");
        }
        if (!d.objectStoreNames.contains(STORES.studentProfiles)) {
          const s = d.createObjectStore(STORES.studentProfiles, { keyPath: "userId" });
          s.createIndex("by_collegeId", "collegeId");
        }
        if (!d.objectStoreNames.contains(STORES.recruiterProfiles)) {
          d.createObjectStore(STORES.recruiterProfiles, { keyPath: "userId" });
        }
        if (!d.objectStoreNames.contains(STORES.colleges)) {
          d.createObjectStore(STORES.colleges, { keyPath: "id" });
        }
        if (!d.objectStoreNames.contains(STORES.sessions)) {
          const s = d.createObjectStore(STORES.sessions, { keyPath: "token" });
          s.createIndex("by_userId", "userId");
          s.createIndex("by_expiresAt", "expiresAt");
        }
        if (!d.objectStoreNames.contains(STORES.statSnapshots)) {
          const s = d.createObjectStore(STORES.statSnapshots, { keyPath: "id" });
          s.createIndex("by_userId", "userId");
        }
        if (!d.objectStoreNames.contains(STORES.scoreHistory)) {
          const s = d.createObjectStore(STORES.scoreHistory, { keyPath: ["userId", "date"] });
          s.createIndex("by_userId", "userId");
          s.createIndex("by_date", "date");
        }
        if (!d.objectStoreNames.contains(STORES.syncJobs)) {
          const s = d.createObjectStore(STORES.syncJobs, { keyPath: "id" });
          s.createIndex("by_userId", "userId");
          s.createIndex("by_status", "status");
        }
        if (!d.objectStoreNames.contains(STORES.savedSearches)) {
          const s = d.createObjectStore(STORES.savedSearches, { keyPath: "id" });
          s.createIndex("by_recruiterId", "recruiterId");
        }
        if (!d.objectStoreNames.contains(STORES.notifications)) {
          const s = d.createObjectStore(STORES.notifications, { keyPath: "id" });
          s.createIndex("by_userId", "userId");
        }
        if (!d.objectStoreNames.contains(STORES.auditLog)) {
          const s = d.createObjectStore(STORES.auditLog, { keyPath: "id" });
          s.createIndex("by_userId", "userId");
          s.createIndex("by_action", "action");
        }
        if (!d.objectStoreNames.contains(STORES.subscriptions)) {
          d.createObjectStore(STORES.subscriptions, { keyPath: "userId" });
        }
      },
    });
  }

  private d() {
    if (!this._db) throw new Error("IndexedDB not initialised");
    return this._db;
  }

  async get<T>(table: string, key: PK) {
    return this.d().get(table, key as any) as Promise<T | undefined>;
  }

  async getAll<T>(table: string) {
    return this.d().getAll(table) as Promise<T[]>;
  }

  async getByIndex<T>(table: string, column: string, value: any) {
    const indexName = `by_${column}`;
    const store = this.d().transaction(table).store;
    if (!store.indexNames.contains(indexName)) {
      // fallback: full scan
      const all = await this.d().getAll(table) as any[];
      return all.filter((r) => r[column] === value) as T[];
    }
    return this.d().getAllFromIndex(table, indexName, value) as Promise<T[]>;
  }

  async put<T>(table: string, value: T) {
    await this.d().put(table, value as any);
  }

  async delete(table: string, key: PK) {
    await this.d().delete(table, key as any);
  }

  async deleteWhere(table: string, predicate: (row: any) => boolean) {
    const tx = this.d().transaction(table, "readwrite");
    let n = 0;
    for await (const c of tx.store.iterate()) {
      if (predicate(c.value)) { await c.delete(); n++; }
    }
    await tx.done;
    return n;
  }
}

export const indexedDBAdapter = new IndexedDBAdapter();
