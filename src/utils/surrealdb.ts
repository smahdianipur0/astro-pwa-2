import { Surreal, RecordId } from "surrealdb";
import * as z from "zod";

export const nodeSchemas = {
    Users: z.object({
        id: z.string().optional(),registered: z.boolean(),UID: z.string(), credentials: z.any(),updatedAt: z.string(),
    }),

    PasswordEntry: z.object({
        id: z.string().optional(),title: z.string(),password: z.string(),crreatedAt: z.string(),
    }),

    Emails: z.object({
        id: z.string().optional(),email: z.string(), crreatedAt: z.string(),
    }),

    RecentDelPass: z.object({
        id: z.string().optional(),title: z.string(),password: z.string(),crreatedAt: z.string(),
    }),

    Vaults: z.object({
        id: z.string().optional(),name: z.string(),updatedAt: z.string(), status: z.enum(["available", "deleted"]), role: z.enum(["owner", "viewer"]),
    }),

    Cards: z.object({
        id: z.string().optional(), name: z.string(), data: z.array(z.string()),updatedAt: z.string(),status: z.enum(["available", "deleted"]),
    }),
} ;

export const edgeSchemas = {
    Access: z.object({
        id: z.string().optional(), in: z.string().optional(),out: z.string().optional(),role: z.enum(["owner", "viewer"]), updatedAt: z.string(),
    }),
    
    Contain: z.object({
        id: z.string().optional(), in: z.string().optional(), out: z.string().optional(), updatedAt: z.string(),
    }),
} as const;

type prettify<T> = { [K in keyof T]: T[K] } & {};

export const schemas = { ...nodeSchemas, ...edgeSchemas } as const;

type nodeTables = {
    [K in keyof typeof nodeSchemas]: Omit<z.infer<(typeof nodeSchemas)[K]>, "id"> & {
        id?: RecordId<string>;
    };
};

type edgelTables = {
    [K in keyof typeof edgeSchemas]: Omit<z.infer<(typeof edgeSchemas)[K]>, "id" | "in" | "out"> & {
        id?: RecordId<string>;
        in?: RecordId<string>;
        out?: RecordId<string>;
    };
};

export type Schemas = prettify<nodeTables & edgelTables>;

const tableNames = Object.keys(schemas) as [keyof typeof schemas, ...(keyof typeof schemas)[]];
const TableName = z.enum(tableNames);
export type TableName = z.infer<typeof TableName>;


// Generate CRUD types for all tables
export type PermittedTypes = {
    [K in keyof Schemas as `${K & string}:create`]: prettify<{ id?: RecordId<string> } & Partial<Schemas[K]>>;
} & {
    [K in keyof Schemas as `${K & string}:update`]: prettify<{ id: RecordId<string> } & Partial<Schemas[K]>>;
} & {
    [K in keyof Schemas as `${K & string}:delete`]: { id: RecordId<string> };
};

export type ReadResultTypes = {[K in keyof Schemas]: prettify<{id?: RecordId<string> } & Schemas[K]>};
export type ReadAllResultTypes = { [K in keyof ReadResultTypes]: ReadResultTypes[K][] };


function makeRecordIdSchema<P extends TableName = TableName>(table?: P) {
    if (table !== undefined) {
        return z.templateLiteral([z.literal(table), ":", z.string()]).transform((s: string) => {
            const [, id] = s.split(":", 2) as [P, string];
            return { table, id } as const;
        });
    }

    return z.templateLiteral([TableName, ":", z.string()]).transform((s) => {
        const [tbl, id] = s.split(":", 2) as [TableName, string];
        return { table: tbl, id } as const;
    });
}

export function toRecordId<P extends TableName>(input: `${P}:${string}`): RecordId<P>;
export function toRecordId<P extends TableName>(input: string, table?: P ): RecordId<P> | undefined;

export function toRecordId(input: string, table?: TableName) {

    const parsed = makeRecordIdSchema(table).safeParse(input);
    if (!parsed.success) {
        console.error(parsed.error);
        return;
    }

    return new RecordId(parsed.data.table, parsed.data.id);
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


export function tableIdStringify<T extends { id?: unknown }>(arr: T[]) {
  return arr.map(({ id, ...rest }) => ({
    id: id?.toString() ?? "",
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

export async function genericCreate< T extends `${TableName}:create`>(db: Surreal, action: T, data: PermittedTypes[T]): Promise<string> {
    await db.create<PermittedTypes[T]>(action.split(":")[0], data); 
    return "Ok";
}

export async function genericQuery(db: Surreal, query: string, params: { [key: string]: any }): Promise<any> {
    const response = await db.queryRaw(`
        BEGIN TRANSACTION;
        ${query}
        COMMIT TRANSACTION;
      `, params);

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
    if (id === undefined) {throw new Error("id is undefined")}
    await db.merge(data.id, dataWithoutId);
    return "Ok";
}

export async function genericUpsert<T extends `${TableName}:update`>(db: Surreal, data: PermittedTypes[T]): Promise<string> {
    await db.upsert<PermittedTypes[T]>(data.id, data);
    return "Ok";
}

export async function genericDelete(db: Surreal, id: RecordId<string>): Promise<string> {
    await db.delete(id);
    return "Ok";
}

export async function genericReadAll<T extends TableName>(db: Surreal,tableName: T): Promise<ReadAllResultTypes[T]> {
    const entries = (await db.select(tableName)) as ReadAllResultTypes[T];
    return entries;
}

export async function genericGetEntryById<T extends TableName>(db: Surreal, recordId: RecordId<T> | undefined): Promise<ReadResultTypes[T] | undefined> {
    if (recordId === undefined) {
        throw new Error("id is undefined")
    }
    const entry = (await db.select(recordId)) as ReadResultTypes[T];
    return entry;
}

export async function genericDeleteAll<T extends TableName>(db: Surreal, tableName: T): Promise<string> {
    await db.delete(tableName);
    return "Ok";
}