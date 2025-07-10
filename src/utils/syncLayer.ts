import { dbReadAll, dbUpsert, dbquery, dbUpserelate, type ReadAllResultTypes } from "../utils/surrealdb-indexed";
import queryHelper from "../utils/query-helper";
import { trpc } from "../utils/trpc";
import { authQueryChallenge } from "../logic/auth";

type prettify<T> = {[K in keyof T]: T[K];} & {};

type VaultRecord = ReadAllResultTypes["Vaults"][number];
type VaultPayload = prettify<Omit<VaultRecord, "id"> & { id?: string }>;

type CardRecord = ReadAllResultTypes["Cards"][number];
type cardPayload = prettify<CardRecord & { vault: string }>;

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
  const makeMap = (arr: T[]) => new Map<string, T>(arr.map((item) => [String(item[key]), item]));

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
  // 1. Load all vaults and cards
  const [vaults, rawCards, users] = await Promise.all([
    dbReadAll("Vaults") as Promise<VaultRecord[]>,
    dbReadAll("Cards") as Promise<CardRecord[]>,
    dbReadAll("Users") as Promise<ReadAllResultTypes["Users"]>,
  ]);

  const UID = users[0]?.UID;
  if (!UID) throw new Error("No user UID found");

  // 2. Build cardPayloads via single-query approach
  const cards: cardPayload[] = (
    await Promise.all(
      rawCards.map(async (card) => {
        const id = card.id?.toString();
        if (!id) return ;
        const [[{ "<-Contain": contain }]] = await dbquery(
            `SELECT <-Contain<-Vaults FROM (type::thing($card));`, 
            { card: id }
            );
        const vaultId = contain["<-Vaults"]?.[0]?.id;
        return vaultId ? { vault: vaultId, ...card } : null;
      }),
    )
  ).filter((x): x is cardPayload => x !== null);

  // 3. Fetch cloud state (vaults + cards)
  const [ message, fetchError] = await queryHelper.direct( "cloudVaults",() =>
      trpc.queryVaults.query({ UID }) as Promise<{
         vaults: VaultPayload[]; cards: cardPayload[] ;
      }>,
  );
  if (fetchError) {
    console.error("Error fetching cloud state:", fetchError);
    return;
  }

  // 4. Compute diffs (must specify both key and dateKey)
  const vaultDiff = syncByKey(vaults, message?.vaults ?? [], "name", "updatedAt");
  const cardDiff = syncByKey(cards, message?.cards ?? [], "id", "updatedAt");

  // 5. Update cloud→local for vaults & cards
  await Promise.all([
    ...vaultDiff.cloudToLocal.map((v) =>
      dbUpsert("Vaults:update", {
        id: v.name,
        name: v.name,
        status: v.status,
        role: v.role,
        updatedAt: v.updatedAt,
      }),
    ),
    ...cardDiff.cloudToLocal.map((c) =>
        dbUpserelate("Cards:upserelate", `Cards:${c.id?.split(":")[1] ?? ""}->Contain`, {
            id: c.id?.split(":")[1] ?? "",
            name: c.name,
            data: c.data,
            updatedAt: c.updatedAt,
            status: c.status
        }, {} )
    ),
  ]);

  // 6. Prepare local→cloud payloads
  if (!vaultDiff.localToCloud.length && !cardDiff.localToCloud.length) return;

  const { authentication, challenge } = (await authQueryChallenge()) as any;
  if (!authentication || !challenge) {
    throw new Error("Authentication failed or missing challenge");
  }

  // 7. Sync up to cloud (both vaults and cards)
  const [syncResult, syncError] = await queryHelper.direct("auth", () =>
    trpc.syncvaults.mutate({
      challenge,
      authenticationData: authentication,
      vaults: vaultDiff.localToCloud,
      cards: cardDiff.localToCloud,
    }),
  );

  if (syncError) console.error("Error syncing to cloud:", syncError);
  else console.log("Sync complete:", syncResult);
}
