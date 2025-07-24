import { dbReadAll, dbquery, type ReadAllResultTypes, relationIdStringify, tableIdStringify, mapTable, mapRelation } from "../utils/surrealdb-indexed";
import queryHelper from "../utils/query-helper";
import { trpc } from "../utils/trpc";
import { authQueryChallenge } from "../logic/auth";
import { dbDelete } from "./surrealdb-cloud";


interface SyncPair<T> {
  localToCloud: T[];
  cloudToLocal: T[];
}

function syncByKey<T extends Record<string, any>, K extends keyof T, D extends keyof T>(
  local: T[],
  cloud: T[],
  key: K,
  dateKey: D,
): SyncPair<T> {

  const makeMap = (arr: T[]) =>
    new Map<string, T>(
      arr
        .filter(item => item && item[key] !== undefined)
        .map((item) => [String(item[key]), item])
    );

  const localMap = makeMap(local);
  const cloudMap = makeMap(cloud);

  const localToCloud = local.filter((item) => {
    const id = String(item[key]);
    const other = cloudMap.get(id);
    if (!other) return true;
    return new Date(item[dateKey]) > new Date(other[dateKey]);
  });

  const cloudToLocal = cloud.filter((item) => {
    const id = String(item[key]);
    const other = localMap.get(id);
    if (!other) return true;
    return new Date(item[dateKey]) > new Date(other[dateKey]);
  });

  return { localToCloud, cloudToLocal };
}


export async function syncVaults(): Promise<void> {
  // 1. Load local state 
  const [users, vaults, contain, cards ] = await Promise.all([
    dbReadAll("Users") as Promise<ReadAllResultTypes["Users"]>,
    dbReadAll("Vaults") as Promise<ReadAllResultTypes["Vaults"]>,
    dbReadAll("Contain") as Promise<ReadAllResultTypes["Contain"]>,
    dbReadAll("Cards") as Promise<ReadAllResultTypes["Cards"]>,
  ]);

  const UID = users[0]?.UID;
  if (!UID) {console.error("No user UID found"); return};


  // 3. Load cloud state 
  const [ message, fetchError] = await queryHelper.direct( "cloudVaults",() =>
      trpc.queryVaults.query({ UID }) 
  );
  if (fetchError) {console.error("Error fetching cloud state:", fetchError);return;};


  // 4. Compute diffs (must specify both key and dateKey)
  const vaultDiff = syncByKey( vaults,(message?.vaults ?? []),"name","updatedAt");
  const containDiff = syncByKey( contain,(message?.contain ?? []),"id","updatedAt");
  const cardDiff = syncByKey( cards,(message?.cards ?? []),"id","updatedAt");

  // 5. Update cloud→local for vaults & cards
  await dbquery(`
    BEGIN TRANSACTION;

    FOR $vault   IN $vaultsArray   { UPSERT $vault.id CONTENT $vault};
    FOR $card    IN $cardsArray    { UPSERT $card.id  CONTENT $card };
    FOR $contain IN $containsArray { INSERT RELATION  INTO Contain $contain };
    
    COMMIT TRANSACTION;
  `,{
    vaultsArray:   mapTable(vaultDiff.cloudToLocal),
    containsArray: mapRelation (containDiff.cloudToLocal),
    cardsArray:    mapTable(cardDiff.cloudToLocal)
  });


  // 6. Prepare local → cloud payloads
  if (
    vaultDiff.localToCloud.length    === 0 && 
    containDiff.cloudToLocal.length  === 0 &&
    cardDiff.localToCloud.length     === 0 ) return;

  const { authentication, challenge } = (await authQueryChallenge()) as any;
  if (!authentication || !challenge) {
    console.error("Authentication failed or missing challenge")
    return;
  }

  // 7. Sync up to cloud 
  const [syncResult, syncError] = await queryHelper.direct("auth", () =>
    trpc.syncvaults.mutate({
      challenge,
      authenticationData: authentication,
      vaults: tableIdStringify(vaultDiff.localToCloud),
      contain: relationIdStringify(containDiff.localToCloud),
      cards: tableIdStringify(cardDiff.localToCloud),
    }),
  );

  if (syncError) console.error("Error syncing to cloud:", syncError.message, syncError.cause ); 
  else console.log("Sync complete:", syncResult);
}
