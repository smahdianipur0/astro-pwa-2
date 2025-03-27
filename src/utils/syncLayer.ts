import {dbReadAll, getEntryById, type ReadAllResultTypes } from "../utils/surrealdb-indexed"
import queryHelper  from "../utils/query-helper"
import { trpc } from "../utils/trpc";

interface dbArrays {
  [key: string]: any;
  updatedAt: string; 
}

function syncArrays(
  local: dbArrays[],
  cloud: dbArrays[],
  key: string
): { localToCloud: dbArrays[]; cloudToLocal: dbArrays[] } {
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

async function syncVaults(){

  const indexedArray = await dbReadAll("Vaults") as ReadAllResultTypes["Vaults"] ;
  const credentials  = await dbReadAll("Credentials") as ReadAllResultTypes["Credentials"] ;
  const UID = credentials[0].UID

  const [cloudArry, cloudError] = await queryHelper.direct("cloudVaults", async () => {
    return await trpc.queryVaults.query({ UID});
  });

// if (cloudArry){syncArrays(indexedArray, cloudArry, "name")}

}