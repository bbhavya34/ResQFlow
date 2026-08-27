/**
 * offlineStore.ts
 * ============================================================================
 * QFlow Offline Safehouse Cache - IndexedDB adapter built on `idb`.
 * ============================================================================
 */

import { openDB, type IDBPDatabase } from "idb";
import { CAMPS, type Camp } from "@/lib/aegis/data";

export interface Safehouse {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  occupancy?: number;
  district?: string;
  state?: string;
  status?: string;
}

const DB_NAME = "qflow_emergency_db";
const DB_VERSION = 1;
const STORE_NAME = "safehouses";

let _db: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db;

  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
    blocked() {
      console.warn("[QFlow/offlineStore] DB upgrade blocked by another open tab.");
    },
    blocking() {
      _db?.close();
      _db = null;
    },
    terminated() {
      console.error("[QFlow/offlineStore] IDB connection terminated unexpectedly.");
      _db = null;
    },
  });

  return _db;
}

export async function cacheSafehouses(
  safehouseArray: Safehouse[],
): Promise<void> {
  if (!Array.isArray(safehouseArray) || safehouseArray.length === 0) {
    console.warn("[QFlow/offlineStore] cacheSafehouses called with empty array.");
    return;
  }

  for (const sh of safehouseArray) {
    if (!sh.id || !sh.name || typeof sh.lat !== "number" || typeof sh.lng !== "number") {
      throw new Error(
        `[QFlow/offlineStore] Invalid safehouse record: ${JSON.stringify(sh)}. Each record must have id, name, lat, lng.`,
      );
    }
  }

  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");

  await Promise.all([
    ...safehouseArray.map((sh) => tx.store.put(sh)),
    tx.done,
  ]);

  console.info(`[QFlow/offlineStore] Cached ${safehouseArray.length} safehouses into IndexedDB.`);
}

export async function syncCampsFromDatabase(camps: Camp[]): Promise<number> {
  const safehouses: Safehouse[] = camps.map((camp) => ({
    id: camp.id,
    name: camp.name,
    lat: camp.lat,
    lng: camp.lng,
    capacity: camp.capacity,
    occupancy: camp.occupancy,
    district: camp.district,
    state: camp.state,
    status: camp.status,
  }));

  await cacheSafehouses(safehouses);
  return safehouses.length;
}

export async function seedDefaultCamps(): Promise<number> {
  return syncCampsFromDatabase(CAMPS);
}

export async function getCachedSafehouses(): Promise<Safehouse[]> {
  const db = await getDB();
  let all = (await db.getAll(STORE_NAME)) as Safehouse[];

  if (!all || all.length === 0) {
    // Automatically seed from central CAMPS repository on first run
    await seedDefaultCamps();
    all = (await db.getAll(STORE_NAME)) as Safehouse[];
  }

  return all;
}

export async function clearSafehouseCache(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
  console.info("[QFlow/offlineStore] Safehouse cache cleared.");
}
