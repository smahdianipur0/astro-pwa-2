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



// Base type for all entries
export type BaseEntry = {
  id?: {tb: string, id: string};
}

// Specific types for each table
export type PasswordEntry = BaseEntry & {
  title: string;
  password: string;
}

export type EmailEntry = BaseEntry & {
  email: string;
  createdAt?: string;  
}

// Generic base functions
async function createEntry<T extends BaseEntry>(tableName: string, data: T): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return;
  }
  try {
    await db.create<T>(tableName, data);
  } catch (err: unknown) {
    console.error(`Failed to create entry in ${tableName}:`, err instanceof Error ? err.message : String(err));
  } finally {
    await db.close();
  }
}

async function updateEntry<T extends BaseEntry>(tableName: string, id: string, data: T): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return;
  }
  try {
    await db.update<T>(new RecordId(tableName, id), data);
  } catch (err: unknown) {
    console.error(`Failed to update entry in ${tableName}:`, err instanceof Error ? err.message : String(err));
  } finally {
    await db.close();
  }
}

async function deleteEntry(tableName: string, id: string): Promise<void> {
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

async function getAllEntries<T extends BaseEntry>(tableName: string): Promise<T[] | undefined> {  
    const db = await getDb();  

    if (!db) {  
        console.error("Database not initialized");  
        return undefined;  
    }  

    try {  
        const entries = await db.select<T>(tableName);  
        return entries;  
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
export async function createPasswordEntry(title: string, password: string): Promise<void> {
  await createEntry<PasswordEntry>("PasswordEntry", { title, password });
}

export async function updatePasswordEntry(id: string, title: string, password: string): Promise<void> {
  await updateEntry<PasswordEntry>("PasswordEntry", id, { title, password });
}

export async function deletePasswordEntry(id: string): Promise<void> {
  await deleteEntry("PasswordEntry", id);
}

export async function getAllPasswordEntries(): Promise<PasswordEntry[] | undefined> {
  return await getAllEntries<PasswordEntry>("PasswordEntry");
}

// Type-safe implementations for Recent Deleted Passwords
export async function createRecentDelPass(title: string, password: string): Promise<void> {
  await createEntry<PasswordEntry>("RecentDelPass", { title, password });
}

export async function deleteRecentDelPass(id: string): Promise<void> {
  await deleteEntry("RecentDelPass", id);
}

export async function getAllRecentDelPass(): Promise<PasswordEntry[] | undefined> {
  return await getAllEntries<PasswordEntry>("RecentDelPass");
}

// Type-safe implementations for Email entries
export async function createEmailEntry(email: string): Promise<void> {
  await createEntry<EmailEntry>("Emails", { 
    email,
    createdAt: new Date().toISOString()
  });
}

export async function getAllEmails(): Promise<EmailEntry[] | undefined> {
  return await getAllEntries<EmailEntry>("Emails");
}

export async function deleteEmail(id: string): Promise<void> {
  await deleteEntry("Emails", id);
}