import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context.ts";
import { 
    dbCreateUser, 
    dbCreateVault, 
    dbDeleteVault, 
    dbQueryUser, 
    dbReadVault, 
    dbQueryRole,
    dbRelateVault,
    dbUpdateVault } from "../utils/surrealdb-cloud";
import { server } from '@passwordless-id/webauthn'
import { registrationInputSchema, authenticationInputSchema, credentialSchema, UID, syncVaultsSchema } from './schemas';


const t = initTRPC.context<Context>().create({
    transformer: {
        input: superjson,
        output: superjson,
    },
});


export const router = t.router;

export const appRouter = router({

    challenge: t.procedure
        .query(async () => {
            const challenge = server.randomChallenge()
            return { message: challenge };
        }),


    registry:t.procedure
        .input(registrationInputSchema)      
        .mutation(async ({ input }) => {
            let addToDb: string | undefined;
            const expected = {
                challenge: input.challenge,
                origin: "http://localhost:4321",
            }
            const registrationParsed = await server.verifyRegistration(input.registry, expected);
            if (registrationParsed.userVerified === true) {
                addToDb = await dbCreateUser(registrationParsed.credential.id, registrationParsed.credential);
                console.log(addToDb); 
            }
            return { message: addToDb || "User not created" };
        }),


    authenticate: t.procedure
        .input(authenticationInputSchema)
        .mutation(async ({ input }) => {
            
            try {
                const dbResult = await dbQueryUser(input.authenticationData.id);

                const parsedCredential = credentialSchema.safeParse(dbResult);
                if (!parsedCredential.success) { throw new Error("Credential does not match expected schema"); }

                const credentialObj = parsedCredential.data;

                try {
                    const authenticationParsed = await server.verifyAuthentication(
                        input.authenticationData,
                        credentialObj,
                        {
                            challenge: input.challenge,
                            origin: "http://localhost:4321",
                            userVerified: true,
                        }
                    );
                    
                    return {
                        message: authenticationParsed.userVerified ? "Authentication successful" : "Authentication failed",
                        authenticated: authenticationParsed.userVerified,
                        credentialId: credentialObj.id
                    };
                    
                } catch (verifyError) { throw new Error(`Authentication verification error: ${verifyError}`); }
            } catch (error) { throw new Error(`Authentication verification error: ${error}`);}
        }),        

        greet: t.procedure
        .query(async () => {
            return { message: `Hello` };
        }),

        queryVaults : t.procedure
        .input(UID)
        .query(async({ input }) => { 
            return await dbReadVault(input.UID)
         }),

        syncvaults : t.procedure
        .input(syncVaultsSchema)
        .mutation(async ({ input }) => {
            console.log("Authentication request received:", input.authenticationData.id);
            
            try {
                const dbResult = await dbQueryUser(input.authenticationData.id);

                const parsedCredential = credentialSchema.safeParse(dbResult);
                if (!parsedCredential.success) { throw new Error("Credential does not match expected schema"); }

                const credentialObj = parsedCredential.data;

                try {
                    const authenticationParsed = await server.verifyAuthentication(
                        input.authenticationData,
                        credentialObj,
                        {
                            challenge: input.challenge,
                            origin: "http://localhost:4321",
                            userVerified: true,
                        }
                    );
                    
                    if (!authenticationParsed.userVerified) { throw new Error("Authentication failed"); }
                    
                    input.vaults.forEach(async (entry) => {
                        if(entry.role === "owner" && entry.status === "available") {
                            console.log("adding to cloud");
                            console.log(entry);
                            await dbCreateVault(credentialObj.id, entry.name, entry.updatedAt, entry.status);
                        }
                        if(entry.role === "owner" && entry.status === "deleted") {
                            console.log("updating cloud");
                            console.log(entry);
                            await dbUpdateVault(entry.name, entry.updatedAt, entry.status);
                        }
                    });

                    return {
                        message: "Sync successful",
                        credentialId: credentialObj.id
                    };
                    
                } catch (verifyError) { throw new Error(`Authentication verification error: ${verifyError}`); }
            } catch (error) { throw new Error(`Authentication verification error: ${error}`);}
        }),   

        dbquery: t.procedure
        .mutation(async () =>{
            const data = await dbUpdateVault("hello", new Date().toISOString(), "deleted");
            console.log(data)
            return data
        })

});

export type AppRouter = typeof appRouter;