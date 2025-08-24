import { server } from '@passwordless-id/webauthn'
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { registrationInputSchema, authenticationInputSchema,createVault, UID, syncVaultsSchema } from './schemas';
import { dbquery, dbCreate, toRecordId,mapRelation, mapTable, getEntryById} from "../utils/surrealdb-cloud";
import type { ReadResultTypes, ReadAllResultTypes} from "../utils/surrealdb-cloud";
import { RecordId } from "surrealdb";
import { handleTRPCError } from "../utils/error"
import { verifyAuthentication } from '../logic/auth.ts'
import { hasPermission } from './permissions.ts'
import type { Context } from "./context.ts";



const t = initTRPC.context<Context>().create({
    transformer: {
        input: superjson,
        output: superjson,
    },
});

export const router = t.router;


export const appRouter = router({

    challenge: t.procedure.query(async () => {
        const challenge = server.randomChallenge()
        return { message: challenge };
    }),


    registry: t.procedure.input(registrationInputSchema).mutation(async ({ input }) => {

        const expected = {
            challenge: input.challenge,
            origin: "http://localhost:4321",
        }

        const registrationParsed = await server.verifyRegistration(input.registry, expected);
        
        if (!registrationParsed.userVerified === true) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to verify registration.',
                cause: registrationParsed,
            });
        }

        const addToDb = await dbCreate("Users:create", {
            UID:registrationParsed.credential.id, 
            credentials:registrationParsed.credential,
            updatedAt: new Date().toISOString()
        });
        
        if (addToDb.ok) {
            return addToDb.value
        } else { 
            console.error(addToDb.value); 
            handleTRPCError(addToDb.value)
        }
    }),


    authenticate: t.procedure.input(authenticationInputSchema).mutation(async ({ input }) => {

        const result = await verifyAuthentication(input.authenticationData, input.challenge);
        if(result.err) {handleTRPCError(result.value)}

        const { authenticationParsed, credentialObj } = result.value;
        if(!authenticationParsed.userVerified) {
          throw new TRPCError({code: 'UNAUTHORIZED',message: "Authentication failed"});
        }

        return {
            message: "Authentication successful",
            authenticated: true,
            credentialId: credentialObj.id
        }; 

    }),        


    queryVaults : t.procedure.input(UID).query(async({ input }) => { 

        const rawUserID = await dbquery(`
            SELECT id FROM Users WHERE UID = $UID;`,
            {UID:input.UID}
        )
        if (rawUserID.err) { handleTRPCError(rawUserID.value);}
        const userID = rawUserID.value[0][0].id?.toString() as string;

         const query = await dbquery(`

            SELECT * FROM $userID -> Access -> Vaults;
            SELECT * FROM $userID -> Access -> Vaults -> Contain;
            SELECT * FROM $userID -> Access -> Vaults -> Contain -> Cards;

        `,{userID: toRecordId(userID) }
        );

        if (query.err) { handleTRPCError(query.value) };

        return {
            vaults:  query.value[0],
            contain: query.value[1],
            cards:   query.value[2]
        }
    }),


    createVaults : t.procedure.input(createVault).mutation(async ({ input }) => {

        const isValid = await dbquery(
            'RETURN string::is::record($N);',
            { N: input.vaultName }
        );

        if (isValid.err)    { handleTRPCError(isValid.value)};
        if (!isValid.value) {
            throw new TRPCError({code: "BAD_REQUEST", message: "Vault Name is not isValid"})
        }

        const exists = await dbquery(
            'RETURN record::exists(type::thing({$N}));',
            { N: input.vaultName }
        );

        if (exists.err)    { handleTRPCError(exists.value)}
        if (!exists.value) {
            throw new TRPCError({code: "BAD_REQUEST", message: "Vault Name Allready exist"})
        }

        const userID = getUserByUID(input.UID);

        const create = await dbquery(`

            LET $contentid = $content.id;
            LET $time = {updatedAt : $content.updatedAt};
            
            UPSERT $content.id CONTENT $content;
            RELATE $user -> Access -> $contentid CONTENT $time;

        `,{                
            user: userID,
            content: {
                id: new RecordId("Vaults", input.vaultName),
                name: input.vaultName,
                status: "available",
                updatedAt: new Date().toISOString(),
                role: 'owner'
            } satisfies ReadResultTypes["Vaults"]
        });

        if(create.err){ handleTRPCError(create.value) }
        return {message: "vault created successfully"}

    }),


    relateVaults : t.procedure.input(createVault).mutation(async ({ input }) => {

        const exists = await dbquery(
            'RETURN record::exists(type::thing({$N}));',
            { N: input.vaultName }
        );

        if (exists.err)    { handleTRPCError(exists.value)}
        if (!exists.value) {
            throw new TRPCError({code: "BAD_REQUEST", message: "Vault Name Allready exist"})
        }

        const userID = getUserByUID(input.UID);

        const relate = await dbquery(
            `RELATE $user -> Access -> $vault CONTENT $relation;`,
            {                
                user: userID,
                vault: new RecordId("Vaults", input.vaultName),
                relation: {
                    role: 'viewer',
                    updatedAt: new Date().toISOString()
                } satisfies ReadResultTypes["Access"]
            }
        );

        const query = await getEntryById( new RecordId("Vaults", input.vaultName));
        if (query.err) {handleTRPCError(query.value)}

        if(relate.err){handleTRPCError(relate.value)}
        return {message: query.value}
    }),


    syncvaults : t.procedure.input(syncVaultsSchema).mutation(async ({ input }) => {

        // Authenticate
        const result = await verifyAuthentication(input.authenticationData, input.challenge);
        if(result.err){handleTRPCError(result.value)}

        const { authenticationParsed, credentialObj } = result.value;
        if(!authenticationParsed.userVerified) {
              throw new TRPCError({code: 'UNAUTHORIZED',message: "Authentication failed"});
        }

        const userID = getUserByUID(credentialObj.id);
      
        // Manage permission
        const query = await dbquery(
            `
            SELECT * FROM $userID -> Access ;
            SELECT * FROM $userID -> Access -> Vaults -> Contain;
            `,{
            userID: userID,
            vaults: input.vaults.map( ({id, ...out}) => toRecordId(id ?? "") )
            }
        );

        if (query.err) { handleTRPCError(query.value) };

        const userAccess = query.value[0] as ReadAllResultTypes["Access"];
        const oldContain = query.value[1] as ReadAllResultTypes["Contain"];
        const contain    = mapRelation(input.contain) as ReadAllResultTypes["Contain"];
        const allContain = [...oldContain, ...contain] ;


        const sanitizedVaults = mapRelation(input.vaults).filter(vault => {
            const access = userAccess.find(a => a.out?.id === vault.id?.id);
            if (!access) return false;
            return hasPermission(access.role, "vault:create");
        });

        const sanitizedCards  = mapTable(input.cards, "Cards").filter(card => {
            const link = allContain.find(c => (c.out )?.id === card.id?.id);
            if (!link) return false;
                 
            const access = userAccess.find(a => (a.out )?.id === link?.in?.id);
            if (!access) return false;
   
            return hasPermission(access.role, "card:add");
        });

        // Dump
        const dump = await dbquery(
            `
            FOR $vault   IN $vaultsArray   { UPSERT $vault.id CONTENT $vault };
            FOR $contain IN $containsArray { INSERT RELATION  INTO Contain $contain };
            FOR $card    IN $cardsArray    { UPSERT $card.id  CONTENT $card };
            `,{
            vaultsArray:   mapTable(sanitizedVaults, "Vaults"),
            containsArray: mapRelation(input.contain),
            cardsArray:    mapTable(sanitizedCards, "Cards")
            }
        );

        if (dump.err){handleTRPCError(dump.value)};

        return {
            message: "Sync successful",
            credentialId: credentialObj.id,
        };
    }),   

});

export type AppRouter = typeof appRouter;


async function getUserByUID(UID:string) {
    const rawUserID = await dbquery(`
        SELECT id FROM Users WHERE UID = $UID;`,
        {UID: UID}
    )
    if (rawUserID.err) { handleTRPCError(rawUserID.value) }
    return toRecordId(rawUserID.value[0][0].id?.toString()) ;
}