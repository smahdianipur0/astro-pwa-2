import { Surreal, RecordId } from 'surrealdb';
import { type Result, Ok, Err, DBConnectionError, DBOperationError } from "./error"
import { 
  genericCreate,
  genericQuery,
  genericDelete,
  genericReadAll,
  genericGetEntryById,
  type PermittedTypes, 
  type TableName} from "./surrealdb"

import { type ReadResultTypes,type ReadAllResultTypes,toRecordId, mapRelation, mapTable, relationIdStringify, tableIdStringify} from "./surrealdb"
export { type ReadResultTypes, type ReadAllResultTypes, toRecordId, mapRelation, mapTable, relationIdStringify, tableIdStringify};

let db: Surreal | null = null;
let connectPromise: Promise<void> | null = null;

async function ensureConnected() {
  if (!db) {
    db = new Surreal();
    connectPromise =  db.connect("wss://new-instance-06a2fsk7u9qnndnf9s5cldv158.aws-use1.surreal.cloud", {
      namespace: import.meta.env.SURREALDB_NAMESPACE,
      database: import.meta.env.SURREALDB_DATABASE,
      auth: {
        username: import.meta.env.SURREALDB_USERNAME,
        password: import.meta.env.SURREALDB_PASSWORD,
      },
    }).then(() => {
      console.log("Connected to SurrealDB successfully.");
    }).catch(async (err) => {
      console.error("Failed to connect to SurrealDB:", err);
      throw err;
    });
  }
  return connectPromise;
}

async function handle<T>(operation: (db: Surreal) => Promise<T>): Promise<Result<T, DBConnectionError | DBOperationError>> {
  await ensureConnected();
  if (!db) {
    return new Err(new DBConnectionError("Database not connected."));
  }

  try { 
    const result = await operation(db);
    return new Ok(result);
  } catch (err) {
    return new Err(new DBOperationError(`Operation failed:`, { cause: err instanceof Error ? err.cause : String(err)}));
  } 
}

export async function dbCreate<T extends `${TableName}:create`>(action: T, data: PermittedTypes[T]): Promise<Result<string, DBConnectionError | DBOperationError>> {
  return await handle(async (db) => await genericCreate(db, action, data));
}


export async function dbDelete(id: RecordId<string>): Promise<Result<string, DBConnectionError | DBOperationError>> {
  return await handle(async (db) => await genericDelete(db, id));
}


export async function dbReadAll<T extends TableName>(tableName: T): Promise<Result<ReadAllResultTypes[T] | undefined, DBConnectionError | DBOperationError>> {
  return await handle(async (db) => await genericReadAll(db, tableName));
}

export async function getEntryById<T extends TableName>(recordId: RecordId<T>): Promise<Result<ReadResultTypes[T] | undefined, DBConnectionError | DBOperationError>> {
  return await handle(async (db) => await genericGetEntryById(db, recordId));
}

export async function dbquery(query: string, params: { [key: string]: any }): Promise<Result<any, DBConnectionError | DBOperationError>> {
  return await handle(async (db) => await genericQuery(db, query, params));
}

// db.query('RETURN string::is::record($ID);',{ ID: ID })
// db.query('RETURN record::exists(type::thing({$ID}));',{ ID: ID });