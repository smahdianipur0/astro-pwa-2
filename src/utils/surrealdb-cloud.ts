import { Surreal } from 'surrealdb';
import { type Result, Ok, Err, DBConnectionError, DBOperationError } from "./error"
import { 
  genericCreate, 
  genericUpserelate,
  genericQuery,
  type PermittedTypes, 
  type TableName,
  type rTableName,
  type rSchemas} from "./surrealdb"


import { type ReadResultTypes,type ReadAllResultTypes,} from "./surrealdb"
export { type ReadResultTypes, type ReadAllResultTypes };


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

export async function dbCreate<T extends `${TableName}:create`>(action: T, data: PermittedTypes[T]): Promise<Result< string, DBConnectionError | DBOperationError >> {
  
  await ensureConnected();
  if (!db) {return new Err(new DBConnectionError("Database not connected."));}

  try { 
    await genericCreate(db, action, data); 
    return new Ok("Ok")
  } catch (err: unknown) {
    return new Err(new DBOperationError(`Failed to create entry in ${action}:`, { cause: err instanceof Error ? err.message : String(err)}));
  } 
}

export async function dbquery( query: string, params: { [key: string]: any }): Promise<Result< any, DBConnectionError | DBOperationError >> {

  await ensureConnected();
  if (!db) {return new Err(new DBConnectionError("Database not connected."));}

  try {
    const res = await genericQuery(db,query, params) ;
    return new Ok(res); 
} catch (err: unknown) {
    return new Err(new DBOperationError(`Failed to query in ${query}:`, { cause: err instanceof Error ? err.message : String(err)}));
  } 
}

export async function dbUpserelate<OutTable extends TableName, InTable extends TableName, RelTable extends rTableName>(
    action: `${OutTable}:upserelate`, 
    ...args: PermittedTypes[`${OutTable}:upserelate`] extends [infer RS, infer ORD, infer RD] 
        ? RS extends `${InTable}:${string}->${RelTable}` 
            ? [relationString: RS, outRecordData: ORD, relationData: RD ] : never 
        : never 
): Promise<Result< string, DBConnectionError | DBOperationError >> {

  await ensureConnected();
  if (!db) {return new Err(new DBConnectionError("Database not connected."));}

  try{
    await genericUpserelate(db,action, ...args)
    return new Ok("Ok")
    } catch (err: unknown) {
      return new Err(new DBOperationError(`Failed to update or create record in ${action} for ${args[1]}:`, { cause: err instanceof Error ? err.message : String(err)}));
    } 
}

export async function dbCheckID(ID: string): Promise<object | undefined> {

  await ensureConnected();
  if (!db) throw new Error("Database not connected.");

  try {
    const checkedID = await db.query(
      'RETURN string::is::record($ID);',
      { ID: ID }
    );
    
    return checkedID;
  } catch (err: unknown) {
    throw new Error(`Error in checking ID: ${err}`);
  }
} 

export async function checkExistance(ID: string): Promise<object | undefined> {

  await ensureConnected();
  if (!db) throw new Error("Database not connected.");

  try {
    const checkedID = await db.query(
      'RETURN record::exists(type::thing({$ID}));',
      { ID: ID }
    );
    
    return checkedID;
  } catch (err: unknown) {
    throw new Error(`Error in checking ID: ${err}`);
  }
}


export async function dbQueryRole(userID: string,vaultName: string,)
: Promise<Result<"owner" | "viewer", DBConnectionError | DBOperationError>> {
    await ensureConnected();

    if (!db) {return new Err(new DBConnectionError("Database not connected.")) }
  
    const vaultId = `vaults${vaultName}`;
  
    const response = await db.query_raw(`
        BEGIN TRANSACTION;
  
        LET $user = (SELECT id FROM users WHERE UID = $UID);
        LET $vault = (SELECT id FROM vaults WHERE name = $vaultName);
        LET $role = SELECT role FROM has_vault WHERE in = $user[0].id AND out = $vault[0].id ;
  
  
        IF $role[0].role = 'owner' { RETURN 'owner' }
        ELSE IF $role[0].role = 'viewer' { RETURN'viewer' }
        ELSE {
          IF record::exists(type::thing({$vaultId})) {
            RETURN "viewer"
            } ELSE { RETURN 'owner'};  
        };
  
        COMMIT TRANSACTION;`,
      { UID: userID, vaultName: vaultName, vaultId: vaultId },
    );
  
    if (response[response.length - 1].status === "ERR") {
        const errorObject = response.find(
          (item) => item.result !== "The query was not executed due to a failed transaction",
        );
        if (errorObject) {
          return new Err(new DBOperationError(`Failed to query role for ${userID}:`, { cause: errorObject }));
        }
    }
    if (response[response.length - 1]?.status === "OK") {
      const result = response[response.length - 1]?.result;
      if (result === "owner" || result === "viewer") {
        return new Ok(result as "owner" | "viewer");
      }
      if (result === undefined) {
        return new Err(new DBOperationError("No Relations Found"));
      }
    }

  return new Err(new DBOperationError(`Unexpected result querying role for ${userID}`, { cause: response }));
}


export async function dbRelateVault(userID: string,vaultName: string ): Promise<object | undefined> {

  await ensureConnected();
  if (!db) throw new Error("Database not connected.")

  try {
    const response = await db.query_raw(`
      BEGIN TRANSACTION;
      LET $user = (SELECT id FROM users WHERE UID = $UID);
      LET $vault = (SELECT id FROM vaults WHERE name = $vaultName);

      LET $relationExists = (SELECT * FROM has_vault WHERE in = $user[0].id AND out = $vault[0].id);

      IF count($relationExists) = 0 {

        RETURN RELATION INTO has_vault {
          in:  $user[0].id,
          out: $vault[0].id,
          role: "viewer"
        };

      }ELSE {
        RETURN SELECT out FROM has_vault WHERE in = $user[0].id AND out = $vault[0].id
      };

      COMMIT TRANSACTION; `,
    { UID: userID, vaultName: vaultName}
    );
    console.log(response);

    if (response[response.length - 1].status === 'OK') {
      console.log()
      return{message : "ok"}
    } else if (response[response.length - 1].status === 'ERR') {
      const errorObject = response.find(item =>item.result !== 'The query was not executed due to a failed transaction');
      if (errorObject) {
        console.log(String(errorObject.result));
        throw new Error(String(errorObject.result));
      }
      console.log("unknown error");
      throw new Error("unknown error");
    }
  } 
  catch (err: unknown) {
    console.log(err);
    throw new Error(err instanceof Error ? err.message : String(err))
  }
}
