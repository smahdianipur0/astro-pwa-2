import { Surreal } from 'surrealdb';
import { type Result, Ok, Err, DBConnectionError, DBOperationError } from "./error"

type prettify<T> = {[K in keyof T]: T[K];} & {};

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
  return connectPromise!;
}

type TableName = "Users" | "Vaults" | "Cards" ;

export type Schemas = {
  Users: { UID: string, credentials: object; updatedAt: string };
  Vaults: {name: string; updatedAt: string, status:"available" | "deleted", role?: "owner" | "viewer"};
  Cards: {name: string, data:string[]; updatedAt: string, status:"available" | "deleted"}
};

type rTableName = "vaults_has";

export type rSchemas = {
  vaults_has : {in: string, role?:string}
};


type PermittedTypes = {
  [K in keyof Schemas as `${K & string}:create`]: prettify<{ id?: string } & Partial<Schemas[K]>>;} & {

  [K in keyof Schemas as `${K & string}:update`]: prettify<{ id: string } & Partial<Schemas[K]>>;} & {

  [K in keyof Schemas as `${K & string}:delete`]: { id: string };} & {

  [K in keyof Schemas as `${K & string}:upserelate`]: prettify<{ id: string } & Partial<Schemas[K]>> & 
    {[K in keyof rSchemas as `to:${K & string}`]: Partial<rSchemas[K]>;};
};

export type ReadResultTypes = {[K in keyof Schemas]: prettify<{id?: { tb: string; id: string }| string} & Schemas[K]>;};
export type ReadAllResultTypes = { [K in keyof ReadResultTypes]: ReadResultTypes[K][] };


export type Credentials = {
  UID: string;
  credentials: object;
  vaultCount: number;
  cardCount: number;
};

export type hasVault = {
  id: string;
  in: string;
  out: string;
  role: string;
}

export async function dbCreate<T extends `${TableName}:create`>(action: T, data: PermittedTypes[T]): Promise<Result< string, DBConnectionError>> {
  
  await ensureConnected();
  if (!db) {return new Err(new DBConnectionError("Database not connected."));}

  try { 
    await db.create<PermittedTypes[T]>(action.split(":")[0], data); 
    return new Ok("Ok")
  } catch (err: unknown) {
    return new Err(new DBOperationError(`Failed to create entry in ${action}:`, { cause: err instanceof Error ? err.message : String(err)}));
  } 
}


export async function dbUpserelate<T extends `${TableName}:upserelate`>(action: T, data: PermittedTypes[T]): Promise<string> {

  await ensureConnected();
  if (!db) throw new Error("Database not connected.");

  const outRecord = `${action.split(":")[0]}:${data.id}`;
  let inRecord = ""
  let rTable = "";
  let rValiues: { [key: string]: any } = {};
  let outValues:   { [key: string]: any } = {};

  Object.entries(data).forEach(([key, value]) => {
    if (key.startsWith("to:")) {
      rTable = key;
      const relationValue = value as Partial<rSchemas[keyof rSchemas]>;
      rValiues = { ...relationValue };
      delete rValiues.in;
      inRecord = `${(rTable.split("_")[0]).split(":")[1]}:${relationValue.in}`;

    } else {
      outValues[key] = value;
    }
  });


  if (rTable === "" || rValiues.length === 0){ console.log("incomplete data"); return"incomplete data";}
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
      console.log(action.split(":")[0],outValues,rTable.split(":")[1],outRecord,inRecord,rValiues)
      return "OK"
  } catch (err: unknown) {
    
    return(`Failed to create entry in ${action}: ${err}`);

  }
}



export async function dbQueryUser(userID: string): Promise<object | undefined> {

  await ensureConnected();
  if (!db) throw new Error("Database not connected.");

  try {
    console.log("Querying user with ID:", userID);
    const getobject = await db.query(
      'SELECT credentials FROM users WHERE UID = $UID ;',
      { UID: userID }
    );
    
    if (
        !Array.isArray(getobject) || getobject.length === 0 || 
        !Array.isArray(getobject[0]) || getobject[0].length === 0 || 
        !getobject[0][0]?.credentials
    ) {throw new Error("Invalid credential format");}

    const credentialObj = getobject[0][0].credentials;
    
    return credentialObj;
  } catch (err: unknown) {
    throw new Error(`Error in dbQueryUser: ${err}`);
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

export async function dbQueryRole(userID: string, vaultName: string): Promise<"owner" | "viewer" | undefined> {
  
  await ensureConnected();
  if (!db) throw new Error("Database not connected."); 

  const vaultId = `vaults${vaultName}`;

  try {
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

      COMMIT TRANSACTION;
      `,
      { UID: userID, vaultName: vaultName, vaultId:vaultId });

      if (response[response.length - 1]?.status === 'OK') {
        const result = response[response.length - 1]?.result;

      if (result === "owner" || result === "viewer") {return result;}
    
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

export async function dbReadVault(userID: string ): Promise<object | undefined> {
  
  await ensureConnected();
  if (!db) throw new Error("Database not connected.")

    try {
      const response = await db.query_raw<hasVault[]>(`
        
        LET $user = (SELECT id FROM users WHERE UID = $UID);
        SELECT out.* FROM has_vault WHERE in = $user[0].id ;
      `,
        { UID: userID }
      );
      console.log(response);
      if (response[response.length - 1].status === 'OK') {
      console.log(response[1].result);
      return{message : response[1].result}
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