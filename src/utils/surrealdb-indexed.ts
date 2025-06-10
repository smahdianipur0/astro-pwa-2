import { Surreal, RecordId, StringRecordId } from "surrealdb";
import { surrealdbWasmEngines } from "@surrealdb/wasm";
import { 
	genericCreate, 
	type PermittedTypes, 
	type TableName,
	type rTableName} from "./surrealdb"


import { type ReadResultTypes,type ReadAllResultTypes,} from "./surrealdb"
export { type ReadResultTypes, type ReadAllResultTypes };


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


export async function dbCreate<T extends `${TableName}:create`>(action: T, data: PermittedTypes[T]): Promise<void> {
	const db = await getDb();
	if (!db) {
		console.error("Database not initialized");
		return;
	}
	try { 
		await genericCreate(db, action, data);
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
	const { id, ...dataWithoutId } = data;

	try {
		console.log(new RecordId(id.split(":")[0], id.split(":")[1]))
		await db.merge(new RecordId(data.id.split(":")[0], data.id.split(":")[1]), dataWithoutId);
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

	const outRecord = `${action.split(":")[0]}:${data.id}`;
	let inRecord = ""
	let rTable = "";
	let rValiues: { [key: string]: any } = {};
	let outValues:   { [key: string]: any } = {};

	(Object.entries(data) as  [string, any]).forEach(([key, value]) => {
		if (key.startsWith("to:")) {
			rTable = key;
			rValiues = {... value}; 
			delete rValiues.in;
			inRecord = `${(rTable.split("_")[0]).split(":")[1]}:${value.in}`;
			
		} else {outValues[key] = value;}
	});

	if (rTable === "" || rValiues.length === 0){ console.log("incomplete data"); return;}
	console.log("checked for",outRecord,"should add", (action.split(":")[0]), "with", outValues);
	try { 
		await db.query(`
			BEGIN TRANSACTION;

			IF record::exists(type::thing({$outRecord})) {
				UPSERT (type::table({$outTable})) CONTENT $outValues;

			} ELSE { 
				CREATE (type::thing({$outRecord})) CONTENT $outValues;
				RELATE (type::thing({$inRecord}))-> (type::table({$rTable})) -> (type::thing({$outRecord})) CONTENT $rValiues;
			};
	  
			COMMIT TRANSACTION; `,
		  { outTable  :action.split(":")[0], 
			outValues :outValues, 
			rTable    :rTable.split(":")[1], 
			outRecord :outRecord,
			inRecord  :inRecord,
			rValiues  :rValiues  }
		  );
		

	} catch (err: unknown) {
		console.error(`Failed to create entry in ${action}:`, err instanceof Error ? err.message : String(err));
	} finally {
		await db.close();
	}
}


export async function dbDelete(id: string): Promise<void> {
	const db = await getDb();
	if (!db) {
		console.error("Database not initialized");
		return;
	}
	try {
		await db.delete(new RecordId(id.split(":")[0], id.split(":")[1]));
	} catch (err: unknown) {
		console.error(`Failed to delete ${id}:`, err instanceof Error ? err.message : String(err));
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

// SELECT * FROM {$outTable} WHERE id IN (SELECT VALUE out FROM {$rTable} WHERE in ={$fullinid});
export async function dbReadRelation<T extends TableName>(
	inId: string, rTable:rTableName, outTable: T
	): Promise<ReadAllResultTypes[T] | undefined> {
	const db = await getDb();

	if (!db) {
		console.error("Database not initialized");
		return undefined;
	}

	try {
		const recs = await db.query(`
			SELECT * FROM (type::table({$outTable})) 
			WHERE id IN 
			(SELECT VALUE out FROM (type::table({$rTable})) WHERE in = (type::thing({$inId})));
			`,{ outTable :outTable,rTable: rTable, inId: inId }
		) ;
		return recs[0] as ReadAllResultTypes[T]; 
	} catch (err) {
		console.error(`Failed to get entries `, err);
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
		const entry = (await db.select(new StringRecordId(recordId))) as unknown as ReadResultTypes[T];
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

export async function dbquery(  query: string, params: { [key: string]: any }): Promise<any> {
	const db = await getDb();
	try {
		const recs = await db.query(query, params) ;
		return recs; 
	} catch (err) {
		console.error(`Query failed`, err);
		return undefined;
	} finally {
		await db.close();
	}
}

const indexedArray = await dbReadAll("Cards") as ReadAllResultTypes["Cards"] ;

let cardDetail:object[] = [];

indexedArray.forEach(async (entry) => {
	const CardId = entry.id?.toString();
	if (!CardId)return
	const cards = await dbquery(
		`SELECT <-Vaults_has<-Vaults FROM (type::thing($card));`,
		{card: CardId}
	);

	cardDetail.push({vault:cards[0][0]["<-Vaults_has"]["<-Vaults"][0].id, ...entry})
});

console.log(cardDetail);

// dbDeleteAll("Cards");
// console.log(await dbReadAll("Vaults_has") )
