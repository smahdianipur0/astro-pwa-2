import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context.ts";
import { z } from "zod";
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
                origin: "https://keypass.vercel.app",
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
            const [credential] = await dbQueryUser(input.authenticationData.id) as z.infer<typeof credentialSchema>[];
            if (!credential) return { message: "Failed to find user" };

            const authenticationParsed = await server.verifyAuthentication(
                input.authenticationData,
                credential.credentials,
                {
                    challenge: input.challenge,
                    origin: "https://keypass.vercel.app",
                    userVerified: true,
                }
            );

            return {
                message: authenticationParsed.userVerified ? "Authentication successful" : "Authentication failed",
                authenticated: authenticationParsed.userVerified,
                credentialId: credential.credentials.id
            };
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
            const [credential] = await dbQueryUser(input.authenticationData.id) as z.infer<typeof credentialSchema>[];
            if (!credential) return { message: "Failed to find user" };

            const authenticationParsed = await server.verifyAuthentication(
                input.authenticationData,
                credential.credentials,
                {
                    challenge: input.challenge,
                    origin: "https://keypass.vercel.app",
                    userVerified: true,
                }
            );
            if (!authenticationParsed.userVerified) throw new Error("Authentication failed");

            

            // return {
            //     message: authenticationParsed.userVerified ? "Authentication successful" : "Authentication failed",
            //     authenticated: authenticationParsed.userVerified,
            //     credentialId: credential.credentials.id
            // };
        }),   

        dbquery: t.procedure
        .mutation(async () =>{
            const data = await dbUpdateVault("hello", new Date().toISOString(), "deleted");
            console.log(data)
            return data
        })

});

export type AppRouter = typeof appRouter;