import { Surreal, RecordId } from 'surrealdb';


// Open a connection and authenticate
async function getDb(){
	const db = new Surreal();   
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
      return db;
    } catch (err) {
      console.error("Failed to connect to SurrealDB:", err instanceof Error ? err.message : String(err));
      await db.close();
      throw err;
    }
}

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


export async function createUser(userID: string, credential: object): Promise<string | undefined> {
  const db = await getDb();
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

export async function queryUser(userID: string): Promise<object | undefined> {
  const db = await getDb();
  let result: object | undefined;

  if (!db) {
    result = { message:"Database not initialized"};
  } else {
    try {
      const getobject = await db.query<[Credentials[]]>(
        'SELECT credentials FROM users WHERE UID = $UID ;',
        { UID: userID }
      );
      result = getobject[0];
      console.log(result);
    } catch (err: unknown) {
      result = { message: "Failed to search for user"};
    } finally {
      await db.close();
    }
  }

  return result;
}



export async function createVault(userID: string,vaultName: string ): Promise<object | undefined> {
  const db = await getDb();
  let result: object | undefined;

  if (!db) {
    result = { message:"Database not initialized"};
  } else {
    try {
      const response = await db.query<hasVault[]>(`
        LET $user = (SELECT id FROM users WHERE UID = $UID);
        LET $vault = (CREATE vaults SET id = $vaultName);
        LET $vaultCount =(SELECT vaultCount FROM users WHERE UID = $UID);
        
        INSERT RELATION INTO has_vault {
          in:  $user[0].id,
          out: $vault[0].id,
          role: "owner"
        };

        UPSERT users SET vaultCount = $vaultCount[0].vaultCount + 1 WHERE UID = $UID;
      `,
      { UID: userID, vaultName: vaultName}
    );
      result = response[0];
    } catch (err: unknown) {
      result = { message: "Failed to search for user", err};
    } finally {
      await db.close();
    }
  }

  return result;
}

export async function queryUserVaults(userID: string ): Promise<object | undefined> {
  const db = await getDb();
  let result: object | undefined;

  if (!db) {
    result = { message:"Database not initialized"};
  } else {
    try {
      const response = await db.query<hasVault[]>(`
        
        LET $user = (SELECT id FROM users WHERE UID = $UID);
        SELECT out.* FROM has_vault WHERE in = $user[0].id ;
      `,
        { UID: userID }
      );
      result = response[1];
    } catch (err: unknown) {
      result = { message: "Failed to search for user"};
    } finally {
      await db.close();
    }
  }

  return result;
}

export async function deleteVault(userID: string, vaultName: string ): Promise<object | undefined> {
  const db = await getDb();
  let result: object | undefined;
  const dbVaultName = `vaults:${vaultName}`;
  console.log(dbVaultName)

  if (!db) {
    result = { message:"Database not initialized"};
  } else {
    try {
      const response = await db.query<hasVault[]>(`
        DELETE vaults WHERE id = $VAULT;
        `, { VAULT: dbVaultName }
      );
      console.log(response);
      result = response[0];
      console.log(result);
    } catch (err: unknown) {
      console.log(err)
      result = { message: "Failed to search for user"};
    } finally {
      await db.close();
    }
  }

  return result;
}


// LET $user = (SELECT id FROM users WHERE UID = $UID);
// LET $vaultCount =(SELECT vaultCount FROM users WHERE UID = $UID);

// DELETE $VAULT;
// UPSERT users SET vaultCount = $vaultCount[0].vaultCount - 1 WHERE id = $user[0].id;