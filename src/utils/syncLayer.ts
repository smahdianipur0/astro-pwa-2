import { dbReadAll,dbUpsert, dbReadRelation, type ReadAllResultTypes, dbDeleteAll } from "../utils/surrealdb-indexed"
import queryHelper  from "../utils/query-helper"
import { trpc } from "../utils/trpc";
import { authQueryChallenge }from "../logic/auth"


type VaultsSchema = (Omit<ReadAllResultTypes["Vaults"][number], "id"> & {id?: string;})[];

type CardDetail = ({
  vault: string;
  contains: ReadAllResultTypes["Cards"];
})[];

interface dbArrays {
  [key: string]: any;
  updatedAt: string; 
  name: string
}

interface dbObject {
  message: dbArrays[];
}

interface dbError{
  [key: string]: any;
  message: string
}


function syncArrays<T extends dbArrays>(local: T[], cloud: T[], key: string): 
{ localToCloud: T[]; cloudToLocal: T[] } {
  
  const localMap = new Map<string, T>(local.map(obj => [obj[key], obj]));
  const cloudMap = new Map<string, T>(cloud.map(obj => [obj[key], obj]));

  const localToCloud: T[] = [];
  const cloudToLocal: T[] = [];

  for (const localObj of local) {
    const cloudObj = cloudMap.get(localObj[key]);
    if (!cloudObj) {
      localToCloud.push(localObj);
    } else if (new Date(localObj.updatedAt) > new Date(cloudObj.updatedAt)) {
      localToCloud.push(localObj);
    }
  }

  for (const cloudObj of cloud) {
    const localObj = localMap.get(cloudObj[key]);
    if (!localObj) {
      cloudToLocal.push(cloudObj);
    } else if (new Date(cloudObj.updatedAt) > new Date(localObj.updatedAt)) {
      cloudToLocal.push(cloudObj);
    }
  }

  return { localToCloud, cloudToLocal };
}

export async function syncVaults(){

  const indexedVaults = await dbReadAll("Vaults")      as ReadAllResultTypes["Vaults"] ;
  const credentials   = await dbReadAll("Users") as ReadAllResultTypes["Users"] ;
  const UID = credentials[0].UID;

  let indexedCards:CardDetail = [];

  indexedVaults.forEach(async (entry) => {
    const vaultId = entry.id;
    if (!vaultId)return;
    const cards = await dbReadRelation(vaultId, "Contain", "Cards");
    if(!cards)return;
    indexedCards.push({vault: vaultId, contains: cards});
  });

  const [data, error] = await queryHelper.direct("cloudVaults", async () => {
    return await trpc.queryVaults.query({UID: UID}) as dbObject;
  });

  if (error){console.log(error); return}


  if (!data?.message) return
  const cloudVaults = data.message.map(item => item.out);
  console.log("whats on indexed:",indexedVaults,"whats on cloud",cloudVaults)
  const {localToCloud, cloudToLocal} = syncArrays<VaultsSchema[number]>(
    indexedVaults as VaultsSchema, 
    cloudVaults as VaultsSchema, 
    "name"
  );
  console.log("localToCloud", localToCloud,"cloudToLocal",cloudToLocal)
  console.log(cloudToLocal.length)
    if (cloudToLocal && cloudToLocal.length > 0) {
      cloudToLocal.forEach(async (entry) => {
        await dbUpsert( "Vaults:update", {
          id: entry.name,
          name: entry.name,
          status: entry.status,
          role: "owner",
          updatedAt: entry.updatedAt,
        });
      });
    console.log("added to local");
  };
  if  (localToCloud && localToCloud.length > 0) {
    (async () => {

      const { authentication, challenge } = await authQueryChallenge() as any;


      // Validate and ensure all required fields are present
      const validVaults = localToCloud.filter(vault => 
        vault.name !== undefined && 
        vault.updatedAt !== undefined
      );

      if (validVaults.length === 0) {
        console.error("No valid vaults to sync - missing required fields");
        return;
      }

      if (!authentication && !challenge) throw new Error("Database not connected.");

      const [authData, authError] = await queryHelper.direct("auth", async () => {
        return await trpc.syncvaults.mutate({
            challenge,
            authenticationData: authentication,
            vaults: localToCloud 
        });
      });
      console.log(authData, authError)
    })();  
  };


}

