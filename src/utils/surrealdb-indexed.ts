import { Surreal, RecordId } from "surrealdb";
import { surrealdbWasmEngines } from "@surrealdb/wasm";
import { jsonify } from "surrealdb";

export async function getDb() {
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

// Define Tables and Schemas
type TableName = "PasswordEntry" | "RecentDelPass" | "Emails" | "Credentials" | "Vaults" | "Cards";

export type Schemas = {
	PasswordEntry: { title: string; password: string; crreatedAt: string };
	Emails: { email: string; crreatedAt: string };
	RecentDelPass: {  title: string; password: string; crreatedAt: string };
	Credentials: { registered:boolean; UID: string;};
	Vaults: {name: string; updatedAt: string, status:"available" | "deleted", role:"owner" | "viewer"};
	Cards: {title: string, data:string[]; updatedAt: string, status:"available" | "deleted"}
};

export type rSchemas = {
	has_card : {in: string}
};


// Generate CRUD types for all tables
type PermittedTypes = {
	[K in keyof Schemas as `${K & string}:create`]: Partial<Schemas[K]>;} & {

	[K in keyof Schemas as `${K & string}:update`]: { id: string } & Partial<Schemas[K]>;} & {

	[K in keyof Schemas as `${K & string}:delete`]: { id: string };} & {

	[K in keyof Schemas as `${K & string}:upserelate`]: { id: string } & Partial<Schemas[K]> & 
		{[K in keyof rSchemas as `to:${K & string}`]: Partial<rSchemas[K]>;};
};

export type ReadResultTypes = {[K in keyof Schemas]: {id?: { tb: string; id: string }} & Schemas[K];};

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

export async function dbUpsert<T extends `${TableName}:update`>(action: T, data: PermittedTypes[T]): Promise<void> {
	const db = await getDb();
	if (!db) {
		console.error("Database not initialized");
		return;
	}

	try {
		await db.upsert<PermittedTypes[T]>(new RecordId(action.split(":")[0], data.id), data);
	} catch (err: unknown) {
		console.error(`Failed to insert or update entry in ${action}:`, err instanceof Error ? err.message : String(err));
	} finally {
		await db.close();
	}
}

export async function dbUpserelate<T extends `${TableName}:upserelate`>(action: T, data: PermittedTypes[T]): Promise<void> {
	const db = await getDb();
	if (!db) {
		console.error("Database not initialized");
		return;
	}

	let outTable = "";
	let outValiues: { [key: string]: any } = {};
	let inValues:   { [key: string]: any } = {};

	Object.entries(data).forEach(([key, value]) => {
		if (key.startsWith("to:")) {outTable = key; outValiues = value;
		} else {inValues[key] = value;}
	})

	if (outTable === "" || outValiues.length === 0){ console.log("incomplete data"); return;}

	try { 
		await db.query(`
			BEGIN TRANSACTION;
			LET $user = (SELECT id FROM users WHERE UID = $UID);
			LET $vaultCount = (SELECT vaultCount FROM users WHERE UID = $UID);
			LET $vault = (CREATE vaults SET id = $vaultName, name = $vaultName, updatedAt = $updatedAt, status = $status);
			
			UPSERT $inTable CONTENT ${JSON.stringify(data)};

			INSERT RELATION INTO has_vault {
			  in:  $user[0].id,
			  out: $vault[0].id,
			};
	  
			COMMIT TRANSACTION; `,
		  { inTable: action.split(":")[0], outTable: outTable.split(":")[1],   }
		  );
	} catch (err: unknown) {
		console.error(`Failed to create entry in ${action}:`, err instanceof Error ? err.message : String(err));
	} finally {
		await db.close();
	}
}

dbUpserelate("Cards:upserelate", {id:"heelo", title:"good", "to:has_card": {in:"hi"} });


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


export async function dbDeleteAll<T extends TableName>(tableName: T): Promise<void> {
	const db = await getDb();

	if (!db) {
		console.error("Database not initialized");
		return undefined;
	}
	try {
		await db.delete(tableName);
	} catch (err) {
		console.error(`Failed to get entries from ${tableName}:`, err);
		return undefined;
	} finally {
		await db.close();
	}
}