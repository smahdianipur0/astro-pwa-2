import { Surreal, RecordId } from "surrealdb";

export type DbConnectionFn = () => Promise<Surreal | null | undefined>;

export type dbBaseType = {
	id?: { tb: string; id: string };
};

// Generic base functions
export async function dbCreate<T extends dbBaseType>(
	getDbFunction: DbConnectionFn,
	tableName: string,
	data: T,
): Promise<void> {
	const db = await getDbFunction();
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

export async function dbUpdate<T extends dbBaseType>(
	getDbFunction: DbConnectionFn,
	tableName: string,
	id: string,
	data: T,
): Promise<void> {
	const db = await getDbFunction();
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

export async function dbDelete(getDbFunction: DbConnectionFn, tableName: string, id: string): Promise<void> {
	const db = await getDbFunction();
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

export async function dbGetAll<T extends dbBaseType>(
	getDbFunction: DbConnectionFn,
	tableName: string,
): Promise<T[] | undefined> {
	const db = await getDbFunction();

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

export async function dbGetById<T extends dbBaseType>(
	getDbFunction: DbConnectionFn,
	tableName: string,
	recordId: string,
): Promise<T | undefined> {
	const db = await getDbFunction();

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

export async function dbQuery<T>(
	getDbFunction: DbConnectionFn,
	query: string,
	vars: Record<string, any> = {},
): Promise<T | undefined> {
	const db = await getDbFunction();

	if (!db) {
		console.error("Database not initialized");
		return undefined;
	}

	try {
		const result = await db.query<[T]>(query, vars);
		if (result && result.length > 0) {
			return result[0]; 
		}
		return undefined;
	} catch (err) {
		console.error(`Failed to execute query: ${query}`, err);
		return undefined;
	} finally {
		await db.close();
	}
}
