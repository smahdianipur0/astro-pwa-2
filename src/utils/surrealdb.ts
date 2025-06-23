import { Surreal, RecordId, StringRecordId } from "surrealdb";

export type Schemas = {
    Users: { registered:boolean; UID: string; credentials: object; updatedAt: string};
    PasswordEntry: { title: string; password: string; crreatedAt: string };
    Emails: { email: string; crreatedAt: string };
    RecentDelPass: {  title: string; password: string; crreatedAt: string };
    Vaults: {name: string; updatedAt: string, status:"available" | "deleted", role:"owner" | "viewer"};
    Cards: {name: string, data:string[]; updatedAt: string, status:"available" | "deleted"}
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

    [K in keyof Schemas as `${K & string}:delete`]: { id: string };} & {

    [K_OutTable in keyof Schemas as `${K_OutTable & string}:upserelate`]:
        {
            [K_InTable in TableName]: {
                [K_RelTable in rTableName]: [
                    relationString: `${K_InTable & string}:${string}->${K_RelTable & string}`,
                    outRecordData: prettify<{ id: string } & Partial<Schemas[K_OutTable]>>,
                    relationData: prettify<rSchemas[K_RelTable]>
                ];
            }[rTableName];
        }[TableName];
};



export type ReadResultTypes = {[K in keyof Schemas]: prettify<{id?: string} & Schemas[K]>;};
export type ReadAllResultTypes = { [K in keyof ReadResultTypes]: ReadResultTypes[K][] };

export async function genericCreate< T extends `${TableName}:create`>(db: Surreal, action: T, data: PermittedTypes[T]): Promise<void> {
    await db.create<PermittedTypes[T]>(action.split(":")[0], data); 
}

export async function genericQuery(db: Surreal, query: string, params: { [key: string]: any }): Promise<any> {
    const res = await db.query(query, params) ;
    return res; 
}

export async function genericUpdate<T extends `${TableName}:update`>(db: Surreal, action: T, data: PermittedTypes[T]): Promise<void> {
    const { id, ...dataWithoutId } = data;
    await db.merge(new RecordId(data.id.split(":")[0], data.id.split(":")[1]), dataWithoutId);
}

export async function genericUpsert<T extends `${TableName}:update`>(db: Surreal, action: T, data: PermittedTypes[T]): Promise<void> {
    await db.upsert<PermittedTypes[T]>(new RecordId(action.split(":")[0], data.id), data);
}

export async function genericDelete(db: Surreal, id: string): Promise<void> {
    await db.delete(new RecordId(id.split(":")[0], id.split(":")[1]));
}


export async function genericUpserelate< OutTable extends TableName, InTable extends TableName,RelTable extends rTableName>(
    db: Surreal,
    action: `${OutTable}:upserelate`, 
    ...args: PermittedTypes[`${OutTable}:upserelate`] extends [infer RS, infer ORD, infer RD] 
        ? RS extends `${InTable}:${string}->${RelTable}` 
            ? [relationString: RS, outRecordData: ORD, relationData: RD ]: never 
        : never 
): Promise<void> {

    const [relationString, outRecordDataFromArgs, relationDataFromArgs] = args;
    const outRecordData = outRecordDataFromArgs as prettify<{ id: string } & Partial<Schemas[OutTable]>>;
    const relationData = relationDataFromArgs as Partial<rSchemas[RelTable]>;


    const { id: outRecordId, ...outRecordValues } = outRecordData;
    const fullOutRecordId = `${action.split(":")[0] as OutTable}:${outRecordId}`; 

    const [inRecordIdWithTable, rTableFromString] = relationString.split("->");

    await db.query(`
        BEGIN TRANSACTION;

        LET $out_record_id = type::thing($fullOutRecordIdVar);
        LET $in_record_id = type::thing($inRecordIdWithTableVar);
        LET $rel_table_name = type::table($rTableActualVar);

        IF record::exists($out_record_id) {
            UPDATE $out_record_id MERGE $outRecordValuesVar;
        } ELSE {
            CREATE $out_record_id CONTENT $outRecordValuesVar;
            RELATE $in_record_id->$rel_table_name->$out_record_id CONTENT $relationDataVar;
        };

        COMMIT TRANSACTION;
    `, {
        fullOutRecordIdVar: fullOutRecordId,
        outRecordValuesVar: outRecordValues,
        inRecordIdWithTableVar: inRecordIdWithTable,
        rTableActualVar: rTableFromString, 
        relationDataVar: relationData,
    });
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

export async function genericDeleteAll<T extends TableName>(db: Surreal, tableName: T): Promise<void> {
    await db.delete(tableName);
}