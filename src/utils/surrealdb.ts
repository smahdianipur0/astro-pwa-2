import { Surreal, RecordId, StringRecordId } from "surrealdb";

export type Schemas = {
    Users: { registered:boolean; UID: string; credentials: object; updatedAt: string};
    PasswordEntry: { title: string; password: string; crreatedAt: string };
    Emails: { email: string; crreatedAt: string };
    RecentDelPass: {  title: string; password: string; crreatedAt: string };
    Vaults: {name: string; updatedAt: string, status:"available" | "deleted", role:"owner" | "viewer"};
    Cards: {name: string, data:string[]; updatedAt: string, status:"available" | "deleted"}
    Access : {in: string | RecordId<string>, out: string | RecordId<string>, role: "owner" | "viewer", updatedAt: string},
    Contain : {in: string | RecordId<string>, out: string | RecordId<string>, updatedAt: string },   
};


export type rSchemas = {
    Access : {role: "owner" | "viewer"},
    Contain : { },
};

type prettify<T> = {[K in keyof T]: T[K];} & {};

export type TableName = prettify<keyof Schemas>
export type rTableName = prettify<keyof rSchemas>;


// Generate CRUD types for all tables
export type PermittedTypes = {
    [K in keyof Schemas as `${K & string}:create`]: prettify<{ id?: string } & Partial<Schemas[K]>>;} & {

    [K in keyof Schemas as `${K & string}:update`]: prettify<{ id: string } & Partial<Schemas[K]>>;} & {

    [K in keyof Schemas as `${K & string}:delete`]: { id: string };
};


export type ReadResultTypes = {[K in keyof Schemas]: prettify<{id?: string | RecordId<string> } & Schemas[K]>;};
export type ReadAllResultTypes = { [K in keyof ReadResultTypes]: ReadResultTypes[K][] };

export function toRecordId (id:string) { 
    return new RecordId( id.split(":")[0]
        , id.split(":")[1])
}

export function mapRelation<T extends { id?: unknown; in?: unknown; out?: unknown }>(arr: T[]) {
  return arr.map(({ id, in: inProp, out, ...rest }) => ({
    id: toRecordId(id?.toString() ?? ""),
    in: toRecordId(inProp?.toString() ?? ""),
    out: toRecordId(out?.toString() ?? ""),
    ...rest,
  }));
}

 export function mapTable<T extends { id?: unknown }>(arr: T[]) {
  return arr.map(({ id, ...rest }) => ({
    id: toRecordId(id?.toString() ?? ""),
    ...rest,
  }));
}

export function relationIdStringify<T extends { id?: unknown; in?: unknown; out?: unknown }>(arr: T[]) {
  return arr.map(({ id, in: inProp, out, ...rest }) => ({
    id: id?.toString() ?? "",
    in: inProp?.toString() ?? "",
    out: out?.toString() ?? "",
    ...rest,
  }));
}

export function tableIdStringify<T extends { id?: unknown }>(arr: T[]) {
  return arr.map(({ id, ...rest }) => ({
    id: id?.toString() ?? "",
    ...rest,
  }));
}

export async function genericCreate< T extends `${TableName}:create`>(db: Surreal, action: T, data: PermittedTypes[T]): Promise<string> {
    await db.create<PermittedTypes[T]>(action.split(":")[0], data); 
    return "Ok";
}

export async function genericQuery(db: Surreal, query: string, params: { [key: string]: any }): Promise<any> {
    const response = await db.queryRaw(query, params);

    if (response[response.length - 1].status === "ERR") {
        const errorObject = response.find(
            (item) => item.result !== "The query was not executed due to a failed transaction",
        );
        if (errorObject) {
            throw new Error("database query failed",{cause: String(errorObject?.result)});
        }
    }
    if (response[response.length - 1]?.status === "OK") {
        return response.map((item) => item.result);     
    }
}

export async function genericUpdate<T extends `${TableName}:update`>(db: Surreal, action: T, data: PermittedTypes[T]): Promise<string> {
    const { id, ...dataWithoutId } = data;
    await db.merge(new RecordId(data.id.split(":")[0], data.id.split(":")[1]), dataWithoutId);
    return "Ok";
}

export async function genericUpsert<T extends `${TableName}:update`>(db: Surreal, action: T, data: PermittedTypes[T]): Promise<string> {
    await db.upsert<PermittedTypes[T]>(new RecordId(action.split(":")[0], data.id), data);
    return "Ok";
}

export async function genericDelete(db: Surreal, id: string): Promise<string> {
    await db.delete(new RecordId(id.split(":")[0], id.split(":")[1]));
    return "Ok";
}

export async function genericReadAll<T extends TableName>(db: Surreal,tableName: T): Promise<ReadAllResultTypes[T] | undefined> {
    const entries = (await db.select(tableName)) as unknown as ReadAllResultTypes[T];
    return entries;
}

export async function genericReadRelation<T extends TableName>(
    db: Surreal, inId: string, rTable:rTableName, outTable: T
    ): Promise<ReadAllResultTypes[T] | undefined> {
    const recs = await db.query(`
        SELECT * FROM (type::table({$outTable})) 
        WHERE id IN 
        (SELECT VALUE out FROM (type::table({$rTable})) WHERE in = (type::thing({$inId})));
        `,{ outTable :outTable,rTable: rTable, inId: inId }
    ) ;
    return recs[0] as ReadAllResultTypes[T]; 
}

export async function genericGetEntryById<T extends TableName>(db: Surreal, tableName: T, recordId: string,): Promise<ReadResultTypes[T] | undefined> {
    const entry = (await db.select(new StringRecordId(recordId))) as unknown as ReadResultTypes[T];
    return entry;
}

export async function genericDeleteAll<T extends TableName>(db: Surreal, tableName: T): Promise<string> {
    await db.delete(tableName);
    return "Ok";
}