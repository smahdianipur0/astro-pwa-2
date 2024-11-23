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
  id?: {tb: string, id: string};
  title: string;
  password: string;
}

export async function createPasswordEntry(title: string, password: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return;
  }
  try {
    const entry = await db.create<PasswordEntry>("PasswordEntry", {
      title,
      password,
    });
  } catch (err: unknown) {
    console.error("Failed to create password entry:", err instanceof Error ? err.message : String(err));
  } finally {
    await db.close();
  }
}

export async function deletePasswordEntry(id: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return;
  }
  try {
    await db.delete(new RecordId('PasswordEntry', id));
  } catch (err: unknown) {
    console.error("Failed to delete password entry:", err instanceof Error ? err.message : String(err));
  } finally {
    await db.close();
  }
}



export async function getAllPasswordEntries(): Promise<PasswordEntry[] | undefined> {  
    const db = await getDb();  

    if (!db) {  
        console.error("Database not initialized");  
        return undefined;  
    }  

    try {  
        const entries = await db.select<PasswordEntry>("PasswordEntry");  
        return entries;  
    } catch (err) {  
        console.error("Failed to get password entries:", err);  
        return undefined;  
    } finally {  
        await db.close();  
    }  
}  
 