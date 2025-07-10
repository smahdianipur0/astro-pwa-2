import { initTRPC } from "@trpc/server";
import { TRPCError } from '@trpc/server';
import superjson from "superjson";
import { type Result, Ok, Err, handleTRPCError, AuthenticationError,ValidationError } from "../utils/error"
import type { Context } from "./context.ts";
import {z} from "zod"
import { 
    dbquery,
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

    greet: t.procedure
        .query(async () => {
            return { message: `Hello` };
        }),

    queryVaults : t.procedure
        .input(UID)
        .query(async({ input }) => { 
            const dbResult = await dbquery(`
                LET $user = (SELECT id FROM users WHERE UID = $UID);
                SELECT out.* FROM has_vault WHERE in = $user[0].id ;`,
                { UID: input.UID }
              );
            if (dbResult.err) {return handleTRPCError(dbResult.value)}

            return dbResult.value
            }),

    syncvaults : t.procedure
        .input(syncVaultsSchema)
        .mutation(async ({ input }) => {
            
            const result = await verifyAuthentication(input.authenticationData, input.challenge);

            if(result.err){handleTRPCError(result.value)}

            const { authenticationParsed, credentialObj } = result.value;

            if(!authenticationParsed.userVerified) {
                  throw new TRPCError({code: 'UNAUTHORIZED',message: "Authentication failed"});
            }

            const rolePromises = (input.vaults as ReadAllResultTypes["Vaults"]).map(async entry => {

                const dbRole = await dbQueryRole(credentialObj.id, entry.id as string);
                if(dbRole.err){handleTRPCError(result.value)}
                return { ...entry, role: dbRole.value }
            });

            const reconciledRoles = await Promise.all(rolePromises);

            reconciledRoles.filter(entry => entry.role === "owner").map(async entry => {
                const result = await dbUpserelate("Vaults:upserelate", `Users:${credentialObj.id}->Access`, {
                    id: entry.id?.split(":")[1] ?? "",
                    name: entry.name,
                    status: entry.status,
                    updatedAt: entry.updatedAt,
                },{
                    role: entry.role
                });

                if(result.err){handleTRPCError(result.value)}
            });

            return {
              message: "Sync successful",
              credentialId: credentialObj.id,
            };
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
 Promise<Result<{ authenticationParsed: Awaited<ReturnType<typeof server.verifyAuthentication>>; credentialObj: CredentialObj }, ValidationError | AuthenticationError>> {

    const dbResult = await dbquery(
      'SELECT credentials FROM users WHERE UID = $UID ;',
      { UID: authenticationData.id }
    );
    if (dbResult.err) {return dbResult}

    if (
        !Array.isArray(dbResult.value) || dbResult.value.length === 0 || 
        !Array.isArray(dbResult.value[0]) || dbResult.value[0].length === 0 || 
        !dbResult.value[0][0]?.credentials
    ) { return new Err(new AuthenticationError("Invalid credential format" ))}

    const dbcredentialObj = dbResult.value[0][0].credentials;
    const parsedCredential = credentialSchema.safeParse(dbcredentialObj);

    if (!parsedCredential.success) {
    return new Err(new ValidationError("Credential does not match expected schema", {cause: parsedCredential.error } ))
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
    return new Err(new AuthenticationError("Invalid credential format", {cause:`${verifyError}`} ))
  }

  return new Ok({ authenticationParsed, credentialObj });
}