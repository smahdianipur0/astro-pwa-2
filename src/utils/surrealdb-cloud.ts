import { Surreal, RecordId } from 'surrealdb';


let db: Surreal | null = null;;

(async () => {
  if(!db){
     db = new Surreal();   
    try {
      console.log("Attempting to connect to SurrealDB...");
      await db.connect("wss://new-instance-06a2fsk7u9qnndnf9s5cldv158.aws-use1.surreal.cloud", {
      namespace: import.meta.env.SURREALDB_NAMESPACE,
      database: import.meta.env.SURREALDB_DATABASE,
      auth: {
        username: import.meta.env.SURREALDB_USERNAME,
        password: import.meta.env.SURREALDB_PASSWORD,
      }
    });
      console.log("Connected to SurrealDB successfully.");
    } catch (err) {
      console.error("Failed to connect to SurrealDB:", err instanceof Error ? err.message : String(err));
      await db.close();
      throw err;
    }
  }
})();

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


export async function dbCreateUser(userID: string, credential: object): Promise<string | undefined> {
  if (!db) throw new Error("Database not connected.");
  let result: string | undefined;

  if (!db) {
    result = "Database not initialized";
  } else {
    try {
      const entry = await db.create<Credentials>('users', {
        UID: userID,
        credentials: credential,
        vaultCount: 0,
        cardCount: 0,
      });
      result = `User registered`;
    } catch (err: unknown) {
      result = "Failed to register user";
    } finally {
      await db.close();
    }
  }
  return result;
}

export async function dbQueryUser(userID: string): Promise<object | undefined> {
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

export async function dbQueryRole(userID: string, vaultName: string): Promise<object | undefined> {
  
  if (!db) throw new Error("Database not connected.")

  try {
    const response = await db.query_raw(`
      BEGIN TRANSACTION;
      LET $user = (SELECT id FROM users WHERE UID = $UID);
      LET $vault = (SELECT id FROM vaults WHERE name = $vaultName);
      SELECT role FROM has_vault WHERE in = $user[0].id AND out = $vault[0].id ;
      COMMIT TRANSACTION;`,
      { UID: userID, vaultName: vaultName});

    
    console.log(response);

    if (response[response.length - 1].status === 'OK') {
      console.log(response[2].result);
      return{message : response[2].result}
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

export async function dbCreateVault(userID: string,vaultName: string, updatedAt:string, status:string ): Promise<object | undefined> {
 
  if (!db) throw new Error("Database not connected.")

  try {
    const response = await db.query_raw(`
      BEGIN TRANSACTION;
      LET $user = (SELECT id FROM users WHERE UID = $UID);
      LET $vaultCount = (SELECT vaultCount FROM users WHERE UID = $UID);
      LET $vault = (CREATE vaults SET id = $vaultName, name = $vaultName, updatedAt = $updatedAt, status = $status);
      
      INSERT RELATION INTO has_vault {
        in:  $user[0].id,
        out: $vault[0].id,
        role: "owner"
      };

      UPSERT users SET vaultCount = $vaultCount[0].vaultCount + 1 WHERE UID = $UID;
      COMMIT TRANSACTION; `,
    { UID: userID, vaultName: vaultName, updatedAt:updatedAt, status:status}
    );
    console.log(response);

    if (response[response.length - 1].status === 'OK') {
      return{message : "OK"}
    } else if (response[response.length - 1].status === 'ERR') {
      const errorObject = response.find(item =>item.result !== 'The query was not executed due to a failed transaction');
      if (errorObject) {
        console.log(String(errorObject.result));
        throw new Error(String(errorObject.result));
      }
      throw new Error("unknown error");
      console.log("unknown error")
    }
  } 
  catch (err: unknown) {
    console.log(err);
    throw new Error(err instanceof Error ? err.message : String(err))
	}
}

export async function dbRelateVault(userID: string,vaultName: string ): Promise<object | undefined> {

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

export async function dbDeleteVault(userID: string, vaultName: string ): Promise<any | undefined> {
 
  if (!db) throw new Error("Database not connected.")

  try {
    const response = await db.query_raw(`
      BEGIN TRANSACTION;
      LET $user = (SELECT id FROM users WHERE UID = $UID);
      LET $vaultCount =(SELECT vaultCount FROM users WHERE UID = $UID);

      LET $vaultExists = (SELECT * FROM vaults WHERE name = $VAULT);

      IF count($vaultExists) = 0 {
        THROW "Vault does not exist";
      };

      DELETE FROM vaults WHERE name = $VAULT ;
      UPSERT users SET vaultCount = $vaultCount[0].vaultCount - 1 WHERE id = $user[0].id;
      COMMIT TRANSACTION;
      `, { UID:userID, VAULT: vaultName }
    );
    console.log(response);

    if (response[response.length - 1].status === 'OK') {
      return{message : "${vaultName} Deleted"}
    } else if (response.filter(item => item.status === 'ERR')) {
      const errorObject = response.find(item =>item.result !== 'The query was not executed due to a failed transaction');
      if (errorObject) {
        console.log(errorObject);
        throw new Error(String(errorObject.result));
      }
      throw new Error("unknown error");
    }
  } catch(err:unknown){
    console.log(err);
    throw new Error(err instanceof Error ? err.message : String(err))
  } 
}

export async function dbUpdateVault(vaultName: string, updatedAt: string, status: string ): Promise<object | undefined> {
 
  if (!db) throw new Error("Database not connected.")

  try {
    const response = await db.query_raw(`
      BEGIN TRANSACTION;

      LET $vault = (SELECT id FROM vaults WHERE name = $vaultName);
      UPDATE $vault[0].id SET updatedAt = $updatedAt , status = $status;

      COMMIT TRANSACTION; `,
    { vaultName: vaultName, updatedAt: updatedAt, status: status }
    );
    console.log(response);

    if (response[response.length - 1].status === 'OK') {
      return{message : "OK"}
    } else if (response[response.length - 1].status === 'ERR') {
      const errorObject = response.find(item =>item.result !== 'The query was not executed due to a failed transaction');
      if (errorObject) {
        console.log(String(errorObject.result));
        throw new Error(String(errorObject.result));
      }
      throw new Error("unknown error");
      console.log("unknown error")
    }
  } 
  catch (err: unknown) {
    console.log(err);
    throw new Error(err instanceof Error ? err.message : String(err))
  }
}