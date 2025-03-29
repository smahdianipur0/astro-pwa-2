import {dbReadAll, dbUpdate, getEntryById,dbUpsert, type ReadAllResultTypes } from "../utils/surrealdb-indexed"
import queryHelper  from "../utils/query-helper"
import { trpc } from "../utils/trpc";
import { queryChallenge }from "../components/authLogic"

interface dbArrays {
  [key: string]: any;
  updatedAt: string; 
}

interface dbObject {
  message: dbArrays[];
}

interface dbError{
  [key: string]: any;
  message: string
}

function syncArrays(local: dbArrays[], cloud: dbArrays[],key: string): 
{ localToCloud: dbArrays[]; cloudToLocal: dbArrays[] } {
  
  const localMap = new Map<string, dbArrays>(local.map(obj => [obj[key], obj]));
  const cloudMap = new Map<string, dbArrays>(cloud.map(obj => [obj[key], obj]));

  const localToCloud: dbArrays[] = [];
  const cloudToLocal: dbArrays[] = [];

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

  const indexedArray = await dbReadAll("Vaults")      as ReadAllResultTypes["Vaults"] ;
  const credentials  = await dbReadAll("Credentials") as ReadAllResultTypes["Credentials"] ;
  const UID = credentials[0].UID

  const [data, error] = await queryHelper.direct("cloudVaults", async () => {
    return await trpc.queryVaults.query({UID: UID}) as dbObject;
  });
  console.log(indexedArray, data)

  if (!data?.message) return
  const {localToCloud,cloudToLocal} = syncArrays(indexedArray, data.message, "name");

    if (cloudToLocal && cloudToLocal.length > 0) {
      cloudToLocal.forEach(async (entry) => {
        await dbUpsert("Vaults:update", {
          id: entry.id.id,
          updatedAt: entry.updatedAt,
          status: entry.status,
        });
      });
    };
  
  (async () => {

    const { authentication, challenge } = await queryChallenge() as any;

    if (!authentication && !challenge) throw new Error("Database not connected.");

    const [authData, authError] = await queryHelper.direct("auth", async () => {
      return await trpc.syncvaults.mutate({
          challenge,
          authenticationData: authentication,
          vaults: localToCloud
      });
    });
  })();  
  
}
