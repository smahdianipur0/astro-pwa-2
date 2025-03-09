import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context.ts";
import { z } from "zod";
import { createUser, queryUser } from "../utils/surrealdb-cloud";
import { server } from '@passwordless-id/webauthn'


const t = initTRPC.context<Context>().create({
    transformer: {
        input: superjson,
        output: superjson,
    },
});

export const router = t.router;

const registrationInputSchema = z.object({ 
    challenge: z.string(),
    registry : z.object({
        type: z.literal('public-key'),
        id: z.string(), 
        rawId: z.string(), 
        authenticatorAttachment: z.enum(['cross-platform', 'platform']),
        clientExtensionResults: z.object({}).default({}),
        response: z.object({
            attestationObject: z.string(), 
            authenticatorData: z.string(), 
            clientDataJSON: z.string(), 
            publicKey: z.string(),
            publicKeyAlgorithm: z.number().int(),
            transports: z.array(z.enum(['hybrid', 'internal', 'usb', 'nfc', 'ble'])).default(['hybrid', 'internal'])
        }),
        user: z.object({
            name: z.string(),
            id: z.string().uuid()
        })
    })
})

const authenticationInputSchema = z.object({  
    challenge: z.string(),  
    authenticationData: z.object({
        clientExtensionResults: z.record(z.string(), z.any()),
        id: z.string(),
        rawId: z.string(),
        type: z.literal('public-key'),
        authenticatorAttachment: z.enum(['cross-platform', 'platform']),
        response: z.object({
          authenticatorData: z.string(),
          clientDataJSON: z.string(),
          signature: z.string(),
          userHandle: z.string(),
        }),
      })
});

interface Credential {
    credentials: {
        algorithm: "ES256";
        id: string;
        publicKey: string;
        transports: ['internal'];
    };
}

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


    authenticate:t.procedure
        .input(authenticationInputSchema)
        .mutation(async({input}) =>{
            const credentialKey = await queryUser(input.authenticationData.id) as Credential[] | undefined;
            if (!credentialKey || credentialKey.length === 0) { return { message: "Failed to find user" } }

            const expected = {
                challenge: input.challenge,
                origin: "https://keypass.vercel.app",
                userVerified: true, 
            }
            
            const authenticationParsed = await server.verifyAuthentication(input.authenticationData, credentialKey[0].credentials, expected)
            if (authenticationParsed.userVerified === true) {

            }
            return { message: authenticationParsed  || "User not authenticated" };
        }),        

        greet: t.procedure
        .query(async () => {
            return { message: `Hello` };
        }),

});

export type AppRouter = typeof appRouter;