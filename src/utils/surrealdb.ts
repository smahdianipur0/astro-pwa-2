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



export type PasswordEntry = {
  entryId?: {tb: string, entryId: string};
  title: string;
  password: string;
}

async function createEntry(tableName: string, title: string, password: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return;
  }
  try {
    const entry = await db.create<PasswordEntry>(tableName, {
      title,
      password,
    });
  } catch (err: unknown) {
    console.error(`Failed to create entry in ${tableName}:`, err instanceof Error ? err.message : String(err));
  } finally {
    await db.close();
  }
}

async function updateEntry(tableName: string, entryId: string, title: string, password: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return;
  }
  try {
    const entry = await db.update<PasswordEntry>(new RecordId(tableName, entryId), {
      title,
      password,
    });
  } catch (err: unknown) {
    console.error(`Failed to create entry in ${tableName}:`, err instanceof Error ? err.message : String(err));
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

async function getAllEntries(tableName: string): Promise<PasswordEntry[] | undefined> {  
    const db = await getDb();  

    if (!db) {  
        console.error("Database not initialized");  
        return undefined;  
    }  

    try {  
        const entries = await db.select<PasswordEntry>(tableName);  
        return entries;  
    } catch (err) {  
        console.error(`Failed to get entries from ${tableName}:`, err);  
        return undefined;  
    } finally {  
        await db.close();  
    }  
}

export async function getEntryById(tableName: string, recordId: string): Promise<PasswordEntry | undefined> {
    const db = await getDb();

    if (!db) {
        console.error("Database not initialized");
        return undefined;
    }

    try {
        const entry = await db.select<PasswordEntry>(new RecordId(tableName, recordId));
        return entry;
    } catch (err) {
        console.error(`Failed to get entry from ${tableName} with ID ${recordId}:`, err);
        return undefined;
    } finally {
        await db.close();
    }
}

export async function createPasswordEntry(title: string, password: string): Promise<void> {
  await createEntry("PasswordEntry", title, password);
}

export async function deletePasswordEntry(id: string): Promise<void> {
  await deleteEntry("PasswordEntry", id);
}

export async function getAllPasswordEntries(): Promise<PasswordEntry[] | undefined> {
  return await getAllEntries("PasswordEntry");
}

export async function updatePasswordEntry(entryId: string, title: string, password: string): Promise<void> {
  await updateEntry("PasswordEntry",entryId, title, password);
}




export async function createRecentDelPass(title: string, password: string): Promise<void> {
  await createEntry("RecentDelPass", title, password);
}

export async function deleteRecentDelPass(id: string): Promise<void> {
  await deleteEntry("RecentDelPass", id);
}

export async function getAllRecentDelPass(): Promise<PasswordEntry[] | undefined> {
  return await getAllEntries("RecentDelPass");
}