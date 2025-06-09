import { initTRPC } from "@trpc/server";
import { TRPCError } from '@trpc/server';
import superjson from "superjson";
import { type Result, Ok, Err, handleTRPCError } from "../utils/error"
import type { Context } from "./context.ts";
import {z} from "zod"
import { 
    dbQueryUser, 
    dbReadVault, 
    dbQueryRole,
    dbUpserelate,
    type ReadAllResultTypes,
    dbCreate} from "../utils/surrealdb-cloud";
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

            const addToDb = await dbCreate("Users:create", {UID:registrationParsed.credential.id, credentials:registrationParsed.credential});
            
            if (addToDb.ok) {
                return addToDb.value
            } else { 
                console.error(addToDb.value); 
                handleTRPCError(addToDb.value)
            }
        }),


    authenticate: t.procedure
        .input(authenticationInputSchema)
        .mutation(async ({ input }) => {
            
            try {
                const {authenticationParsed, credentialObj} = await verifyAuthentication(input.authenticationData, input.challenge)
             
                return {
                    message: authenticationParsed.userVerified ? "Authentication successful" : "Authentication failed",
                    authenticated: authenticationParsed.userVerified,
                    credentialId: credentialObj.id
                };
                    
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
                const {authenticationParsed, credentialObj} = await verifyAuthentication(input.authenticationData, input.challenge);
 
                const rolePromises = (input.vaults as ReadAllResultTypes["Vaults"]).map(async entry => {
                  try {
                    const dbRole = await dbQueryRole(credentialObj.id, entry.id as string);
                    return { ...entry, role: dbRole };
                  } catch (err) {
                    throw new Error(`Failed to fetch role for item ${entry.id}: ${err}`);
                  }
                });

                const reconciledRoles = await Promise.all(rolePromises);

                const upsertPromises = reconciledRoles.filter(entry => entry.role === "owner").map(async entry => {
                    const result = await dbUpserelate("Vaults:upserelate", {
                        id: (entry.id as string).split(":")[1] ?? "",
                        name: entry.name,
                        status: entry.status,
                        updatedAt: entry.updatedAt,
                        "to:vaults_has": { in: credentialObj.id, role: entry.role },
                    });
                    return { id: entry.id, result };
                });

                const upsertResults = await Promise.all(upsertPromises);

                for (const { id, result } of upsertResults) {
                  if (result !== "OK") { throw new Error(`Failed to update vault ${id}: ${result}`)}
                }
                return {
                  message: "Sync successful",
                  credentialId: credentialObj.id,
                };

            } catch (error) { throw new Error(`Authentication verification error: ${error}`);}
        }),   

    dbquery: t.procedure
        .mutation(async () =>{
            let shit
            try { shit = await dbQueryRole("xs0cyUIiz_QEZ0FdExMMlvdSpWM", "test2")} catch {}
            console.log(shit);;
            const data = "hi";
            console.log(data)
        })

});

export type AppRouter = typeof appRouter;


type AuthenticationData = z.infer<typeof authenticationInputSchema>['authenticationData'];
type CredentialObj = z.infer<typeof credentialSchema>;

async function verifyAuthentication(authenticationData: AuthenticationData,challenge: string): 
Promise<{ authenticationParsed: Awaited<ReturnType<typeof server.verifyAuthentication>>; credentialObj: CredentialObj }> {
  const dbResult = await dbQueryUser(authenticationData.id);

  const parsedCredential = credentialSchema.safeParse(dbResult);
  if (!parsedCredential.success) {
    throw new Error("Credential does not match expected schema");
  }

  const credentialObj = parsedCredential.data;

  let authenticationParsed;
  try {
    authenticationParsed = await server.verifyAuthentication(authenticationData, credentialObj, {
      challenge,
      origin: "http://localhost:4321",
      userVerified: true,
    });

    if (!authenticationParsed.userVerified) {
      throw new Error("Authentication failed");
    }
  } catch (verifyError) {
    throw new Error(`Authentication verification error: ${verifyError}`);
  }

  return { authenticationParsed, credentialObj };
}