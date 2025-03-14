import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context.ts";
import { z } from "zod";
import { createUser, createVault, deleteVault, queryUser, queryUserVaults } from "../utils/surrealdb-cloud";
import { server } from '@passwordless-id/webauthn'
import { registrationInputSchema, authenticationInputSchema, credentialSchema } from './schemas';

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
                addToDb = await createUser(registrationParsed.credential.id, registrationParsed.credential);
                console.log(addToDb); 
            }
            return { message: addToDb || "User not created" };
        }),


    authenticate: t.procedure
        .input(authenticationInputSchema)
        .mutation(async ({ input }) => {
            const [credential] = await queryUser(input.authenticationData.id) as z.infer<typeof credentialSchema>[];
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

        dbquery: t.procedure
        .mutation(async () =>{
            const data = await deleteVault("8GuVy4UYH8iZKHTCr1TioGH3Bzs", "orange");
            console.log(data)
            return data
        })

});

export type AppRouter = typeof appRouter;