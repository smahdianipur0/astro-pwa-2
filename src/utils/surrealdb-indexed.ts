import { Surreal, RecordId, StringRecordId } from "surrealdb";
import { surrealdbWasmEngines } from "@surrealdb/wasm";
import { 
	genericCreate,
	genericQuery,
	genericUpdate,
	genericUpsert,
	genericDelete,
	genericReadAll,
	genericReadRelation,
	genericGetEntryById,
	genericDeleteAll,
	type PermittedTypes, 
	type TableName,
	type rTableName} from "./surrealdb"


import { type ReadResultTypes,type ReadAllResultTypes, toRecordId,mapRelation, mapTable , relationIdStringify, tableIdStringify} from "./surrealdb"
export { type ReadResultTypes, type ReadAllResultTypes, toRecordId, mapRelation, mapTable, relationIdStringify, tableIdStringify };


async function getDb() {
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

async function handle<T>(operation: (db: Surreal) => Promise<T>): Promise<T | undefined>{
	const db = await getDb();
	if (!db) {
		console.error("Database not initialized");
		return undefined;
	}
	try { 
		return await operation(db);
	} catch (err: unknown) {
		console.error(`operation faild`, err instanceof Error ? err.message : String(err));
	} finally {
		await db.close();
	}	
}

export async function dbCreate<T extends `${TableName}:create`>(action: T, data: PermittedTypes[T]): Promise<void> {
	await handle(async (db) => {await genericCreate(db, action, data)})
}

export async function dbUpdate<T extends `${TableName}:update`>(action: T, data: PermittedTypes[T]): Promise<void> {
	await handle(async (db) => {await genericUpdate(db, action, data)})
}

export async function dbUpsert<T extends `${TableName}:update`>(action: T, data: PermittedTypes[T]): Promise<void> {
	await handle(async (db) => { await genericUpsert(db, action, data)})
}

export async function dbDelete(id: string): Promise<void> {
	await handle(async (db) => {await genericDelete(db, id)});
}

export async function dbReadAll<T extends TableName>(tableName: T): Promise<ReadAllResultTypes[T] | undefined> {
	return await handle(async (db) => { return await genericReadAll(db, tableName)})
}

export async function dbReadRelation<T extends TableName>(
	inId: string, rTable:rTableName, outTable: T
	): Promise<ReadAllResultTypes[T] | undefined> {
	return await handle(async (db) => { return await genericReadRelation(db, inId, rTable, outTable)})
}

export async function getEntryById<T extends TableName>(tableName: T, recordId: string,): Promise<ReadResultTypes[T] | undefined> {
	return await handle(async (db) => { return await genericGetEntryById(db, tableName, recordId)})
}


export async function dbDeleteAll<T extends TableName>(tableName: T): Promise<void> {
	await handle(async (db) => {await genericDeleteAll(db,tableName)})
}

export async function dbquery( query: string, params: { [key: string]: any }): Promise<any> {
		return await handle(async (db) => { return await genericQuery(db,query, params)}) ;
}
