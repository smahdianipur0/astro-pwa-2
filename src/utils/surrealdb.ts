import { Surreal, RecordId } from "surrealdb";
import { surrealdbWasmEngines } from "@surrealdb/wasm";


type prettify<T> = {[K in keyof T]: T[K];} & {};


// Define Tables and Schemas
export type TableName = "PasswordEntry" | "RecentDelPass" | "Emails" | "Users" | "Vaults" | "Cards";

export type Schemas = {
    Users: { registered:boolean; UID: string;};
    PasswordEntry: { title: string; password: string; crreatedAt: string };
    Emails: { email: string; crreatedAt: string };
    RecentDelPass: {  title: string; password: string; crreatedAt: string };
    Vaults: {name: string; updatedAt: string, status:"available" | "deleted", role:"owner" | "viewer"};
    Cards: {name: string, data:string[]; updatedAt: string, status:"available" | "deleted"}
};


export type rTableName = "Vaults_has";

export type rSchemas = {
    Vaults_has : {in: string, role:string}
};

// Generate CRUD types for all tables
export type PermittedTypes = {
    [K in keyof Schemas as `${K & string}:create`]: prettify<{ id?: string } & Partial<Schemas[K]>>;} & {

    [K in keyof Schemas as `${K & string}:update`]: prettify<{ id: string } & Partial<Schemas[K]>>;} & {

    [K in keyof Schemas as `${K & string}:delete`]: { id: string };} & {

    [K in keyof Schemas as `${K & string}:upserelate`]: prettify<{ id: string } & Partial<Schemas[K]>> & 
        {[K in keyof rSchemas as `to:${K & string}`]: Partial<rSchemas[K]>;};
};

export type ReadResultTypes = {[K in keyof Schemas]: prettify<{id?: { tb: string; id: string }} & Schemas[K]>;};
export type ReadAllResultTypes = { [K in keyof ReadResultTypes]: ReadResultTypes[K][] };

export async function genericCreate< T extends `${TableName}:create`>(db: Surreal, action: T, data: PermittedTypes[T]): Promise<void> {
  await db.create<PermittedTypes[T]>(action.split(":")[0], data); 
}