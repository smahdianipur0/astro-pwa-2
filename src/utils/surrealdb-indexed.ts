import { Surreal, RecordId } from "surrealdb";
import { surrealdbWasmEngines } from "@surrealdb/wasm";
import { jsonify } from "surrealdb";

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

type TableName = "PasswordEntry" | "RecentDelPass" | "Emails";

export type BaseEntry = {
	id?: { tb: string; id: string };
};

export type EmailEntry = {
	id?: { tb: string; id: string };
	email: string;
};

export type PasswordEntry = {
	id?: { tb: string; id: string };
	title: string;
	password: string;
};

export type Schemas = {
	PasswordEntry: { title: string; password: string };
	Emails: { email: string };
	RecentDelPass: {  title: string; password: string };
	credentials: { value: string };
};

type CRUD<T> = {
	create: Partial<T>; 
	update: { id: string } & Partial<T>;
	delete: { id: string };
};

// Generate CRUD types for all tables
type TableCRUD = {[K in keyof Schemas]: CRUD<Schemas[K]>;
};

// Flatten into "table:action" format
type Flatten<T extends Record<string, CRUD<any>>> = {
	[K in keyof T as `${K & string}:create`]: T[K]["create"]; } & {
	[K in keyof T as `${K & string}:update`]: T[K]["update"]; } & {
	[K in keyof T as `${K & string}:delete`]: T[K]["delete"];
};

export type PermittedTypes = Flatten<TableCRUD>;

export type ReadResultTypes = {[K in keyof Schemas]: Schemas[K];};
export type ReadAllResultTypes = { [K in keyof ReadResultTypes]: ReadResultTypes[K][] };


export async function dbCreate<T extends `${TableName}:create`>(action: T, data: PermittedTypes[T]): Promise<void> {
	const db = await getDb();
	if (!db) {
		console.error("Database not initialized");
		return;
	}

	try {
		await db.create<PermittedTypes[T]>(action.split(":")[0], data);
	} catch (err: unknown) {
		console.error(`Failed to create entry in ${action}:`, err instanceof Error ? err.message : String(err));
	} finally {
		await db.close();
	}
}

export async function dbUpdate<T extends `${TableName}:update`>(action: T, data: PermittedTypes[T]): Promise<void> {
	const db = await getDb();
	if (!db) {
		console.error("Database not initialized");
		return;
	}

	try {
		await db.update<PermittedTypes[T]>(new RecordId(action.split(":")[0], data.id), data);
	} catch (err: unknown) {
		console.error(`Failed to update entry in ${action}:`, err instanceof Error ? err.message : String(err));
	} finally {
		await db.close();
	}
}

export async function dbDelete<T extends `${TableName}:delete`>(action: T, id: string): Promise<void> {
	const db = await getDb();
	if (!db) {
		console.error("Database not initialized");
		return;
	}
	try {
		await db.delete(new RecordId(action.split(":")[0], id));
	} catch (err: unknown) {
		console.error(`Failed to delete entry from ${action}:`, err instanceof Error ? err.message : String(err));
	} finally {
		await db.close();
	}
}

export async function dbReadAll<T extends TableName>(tableName: T): Promise<ReadAllResultTypes[T] | undefined> {
	const db = await getDb();

	if (!db) {
		console.error("Database not initialized");
		return undefined;
	}

	try {
		const entries = (await db.select(tableName)) as unknown as ReadAllResultTypes[T];
		return entries;
	} catch (err) {
		console.error(`Failed to get entries from ${tableName}:`, err);
		return undefined;
	} finally {
		await db.close();
	}
}

export async function getEntryById<T extends TableName>(
	tableName: T,
	recordId: string,
): Promise<ReadResultTypes[T] | undefined> {
	const db = await getDb();

	if (!db) {
		console.error("Database not initialized");
		return undefined;
	}

	try {
		const entry = (await db.select(new RecordId(tableName, recordId))) as unknown as ReadResultTypes[T];
		return entry;
	} catch (err) {
		console.error(`Failed to get entry from ${tableName} with ID ${recordId}:`, err);
		return undefined;
	} finally {
		await db.close();
	}
}
