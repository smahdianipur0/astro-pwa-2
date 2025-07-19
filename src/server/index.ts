import { server } from '@passwordless-id/webauthn'
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import {z} from "zod"

import { registrationInputSchema, authenticationInputSchema, credentialSchema, UID, syncVaultsSchema } from './schemas';
import { dbquery,dbQueryRole, dbUpserelate, dbCreate, dbReadAll, type ReadAllResultTypes} from "../utils/surrealdb-cloud";
import { type Result, Ok, Err, handleTRPCError, AuthenticationError,ValidationError } from "../utils/error"
import { hasPermission } from './permissions.ts'
import { type Context } from "./context.ts";


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

            const rawCards = await dbReadAll("Cards") ;
            if (rawCards.err) {return handleTRPCError(rawCards.value)}

            const cards = (
                await Promise.all(
                  (rawCards.value as ReadAllResultTypes["Cards"]).map(async (card) => {
                    const id = card.id?.toString();
                    if (!id) throw new TRPCError({code: 'BAD_REQUEST',message: "Card ID not found!"}); ;
                    
                    const dbRes = await dbquery(
                        `SELECT <-Contain<-Vaults FROM (type::thing($card));`, 
                        { card: id }
                    );
                    if (dbRes.err) { handleTRPCError(dbRes.value); }

                    const [[{ "<-Contain": contain }]] = dbRes.value;
                    const vaultId = contain["<-Vaults"]?.[0]?.id.toString() as string;
                    return vaultId ? { vault: vaultId, ...card } : null;
                  }),
                )
              )

            return {
                vaults: dbResult.value,
                cards: cards
            }
        }),

    syncvaults : t.procedure
        .input(syncVaultsSchema)
        .mutation(async ({ input }) => {

            // Authenticate
            const result = await verifyAuthentication(input.authenticationData, input.challenge);
            if(result.err){handleTRPCError(result.value)}

            const { authenticationParsed, credentialObj } = result.value;
            if(!authenticationParsed.userVerified) {
                  throw new TRPCError({code: 'UNAUTHORIZED',message: "Authentication failed"});
            }

            const rawUserID = await dbquery(`
                SELECT id FROM Users WHERE UID = $UID`,
                {UID:credentialObj.id}
            )
            if (rawUserID.err) { handleTRPCError(rawUserID.value);}

            const userID = rawUserID.value[0][0].id?.toString().split(":")[1] as string
            if (!userID){throw new TRPCError({code: 'UNAUTHORIZED',message: "User id not fount"});}


            // Manage permission
            const rolePromises = (input.vaults as ReadAllResultTypes["Vaults"]).map(async entry => {
                const dbRole = await dbQueryRole(credentialObj.id, entry.id as string);
                if(dbRole.err){handleTRPCError(result.value)}
                return { ...entry, role: dbRole.value }
            });

            const reconciledRoles = await Promise.all(rolePromises);

            const sanitizedVaults = reconciledRoles.filter((v) =>
                hasPermission(v.role, "vault:create")
            );

            const permittedVaults = reconciledRoles.filter((v) =>
                hasPermission(v.role, "card:add" )
                ).map((v) => v.id?.toString().split(":")[1]);

            const sanitizedCards = input.cards.filter((card) =>
                permittedVaults.includes(card.vault)
            );

            
            // Dump
            await Promise.all(sanitizedVaults.map(async (entry) => {

                const dumpVaults = await dbUpserelate("Vaults:upserelate", `Users:${userID}->Access`, {
                    id: entry.id?.toString().split(":")[1] ?? "",
                    name: entry.name,
                    status: entry.status,
                    updatedAt: entry.updatedAt,
                },{
                    role: entry.role
                });

                if(dumpVaults.err){ handleTRPCError(dumpVaults.value)}

            }));

            await Promise.all(sanitizedCards.map(async (entry) => {

                const dumpCards = await dbUpserelate("Cards:upserelate", `Vaults:${entry.id?.split(":")[1]}->Contain`, {
                    id: entry.id?.toString().split(":")[1] ?? "",
                    name: entry.name,
                    status: entry.status,
                    updatedAt: entry.updatedAt,
                    data: entry.data
                },{}
                );

                if(dumpCards.err){handleTRPCError(dumpCards.value)}

            }));

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
      'SELECT credentials FROM Users WHERE UID = $UID ;',
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