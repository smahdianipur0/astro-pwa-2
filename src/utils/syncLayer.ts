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