import { Surreal, RecordId } from 'surrealdb';
import { surrealdbWasmEngines } from '@surrealdb/wasm';
import { jsonify } from "surrealdb";


async function getDb(){
  const db = new Surreal({
  engines: surrealdbWasmEngines(),
  });    
  try {
      await db.connect("indxdb://demo");
      await db.use({ namespace: "hello", database: "demodb" });
      return db;
  } catch (err) {
      console.error("Failed to connect to SurrealDB:", err instanceof Error ? err.message : String(err));
      await db.close();
      throw err;
  }
}


// Specific types for each table
export type BaseEntry = {
  id?: {tb: string, id: string};
}

export type PasswordEntry = {
  id?: {tb: string, id: string};
  title: string;
  password: string;
}

export type EmailEntry = {
  id?: {tb: string, id: string};
  email: string;
  createdAt?: string;  
}

// permitted types map
export type PermittedTypes = {
  "PasswordEntry": PasswordEntry ;
  "RecentDelPass": PasswordEntry;
  "Emails": EmailEntry;

}

// Generic base functions with improved type safety
export async function dbCreate<T extends keyof PermittedTypes>(tableName: T, data: PermittedTypes[T]): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return;
  }

  try {
    await db.create<PermittedTypes[T]>(tableName, data);
  } catch (err: unknown) {
    console.error(`Failed to create entry in ${tableName}:`, err instanceof Error ? err.message : String(err));
  } finally {
    await db.close();
  }
}

export async function dbUpdate<T extends keyof PermittedTypes>(tableName: T, id: string, data: PermittedTypes[T]): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return;
  }
  try {
    await db.update<PermittedTypes[T]>(new RecordId(tableName, id), data);
  } catch (err: unknown) {
    console.error(`Failed to create entry in ${tableName}:`, err instanceof Error ? err.message : String(err));
  } finally {
    await db.close();
  }
}

export async function dbDelete(tableName: keyof PermittedTypes, id: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return;
  }
  try {
    await db.delete(new RecordId(tableName, id));
  } catch (err: unknown) {
    console.error(`Failed to delete entry from ${tableName}:`, err instanceof Error ? err.message : String(err));
  } finally {
    await db.close();
  }
}

export async function dbReadAll<T extends keyof PermittedTypes>(tableName: T): Promise<PermittedTypes[T][] | undefined> {
    const db = await getDb();

    if (!db) {
        console.error("Database not initialized");
        return undefined;
    }

    try {
        const entries = await db.select<PermittedTypes[T]>(tableName) as any;
        return entries as PermittedTypes[T][];
    } catch (err) {
        console.error(`Failed to get entries from ${tableName}:`, err);
        return undefined;
    } finally {
        await db.close();
    }
}

export async function getEntryById<T extends BaseEntry>(tableName: string, recordId: string): Promise<T | undefined> {
    const db = await getDb();

    if (!db) {
        console.error("Database not initialized");
        return undefined;
    }

    try {
        const entry = await db.select<T>(new RecordId(tableName, recordId));
        return entry;
    } catch (err) {
        console.error(`Failed to get entry from ${tableName} with ID ${recordId}:`, err);
        return undefined;
    } finally {
        await db.close();
    }
}

// Type-safe implementations for Password entries

export async function updatePasswordEntry(id: string, title: string, password: string): Promise<void> {
  await dbUpdate("PasswordEntry", id, { title, password });
}

export async function deletePasswordEntry(id: string): Promise<void> {
  await dbDelete("PasswordEntry", id);
}

export async function getAllPasswordEntries(): Promise<PasswordEntry[] | undefined> {
  return await dbReadAll("PasswordEntry");
}

// Type-safe implementations for Recent Deleted Passwords

export async function deleteRecentDelPass(id: string): Promise<void> {
  await dbDelete("RecentDelPass", id);
}

export async function getAllRecentDelPass(): Promise<PasswordEntry[] | undefined> {
  return await dbReadAll("RecentDelPass");
}

// Type-safe implementations for Email entries

export async function getAllEmails(): Promise<EmailEntry[] | undefined> {
  return await dbReadAll("Emails");
}

export async function deleteEmail(id: string): Promise<void> {
  await dbDelete("Emails", id);
}