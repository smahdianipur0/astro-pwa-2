import { server } from '@passwordless-id/webauthn'
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import {z} from "zod"

import { registrationInputSchema, authenticationInputSchema, credentialSchema, UID, syncVaultsSchema } from './schemas';
import { dbquery,dbQueryRole, dbUpserelate, dbCreate, dbReadAll, type ReadAllResultTypes} from "../utils/surrealdb-cloud";
import { type Result, Ok, Err, handleTRPCError, AuthenticationError,ValidationError } from "../utils/error"
import { hasPermission } from './permissions.ts'
import { type Context } from "./context.ts";
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 20)



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
            const userID = rawUserID.value[0][0].id?.toString() as string;
            console.log("auth completed");
          


            // Manage permission
            const query = await dbquery(`
                BEGIN TRANSACTION;

                SELECT * FROM $userID -> Access -> Vaults;
                SELECT * FROM Access WHERE out IN $vaults;
                SELECT * FROM $userID -> Access -> Vaults -> Contain;

                COMMIT TRANSACTION;
            `,{userID: userID,vaults: input.vaults}
            );

            if (query.err) { handleTRPCError(query.value) };

            const userAccess = query.value[0] as ReadAllResultTypes["Access"];
            const accessVault = query.value[1] as ReadAllResultTypes["Access"];
            const oldContain = query.value[2] as ReadAllResultTypes["Contain"] 


            const viewers = accessVault
              .filter(av => !userAccess.some(ua => ua.out === av.out))
              .map(av => ({id:av.id ,in: userID, out: av.out, role: 'viewer'})) as ReadAllResultTypes["Access"];

         
            const owners = input.vaults
              .filter(v => !accessVault.some(av => av.out === v.id))
              .map(v => ({id: `Access:${nanoid()}`, in: userID, out: v.id, role: 'owner',})) as ReadAllResultTypes["Access"];


            const sanitizedAccess = [...owners,...viewers,];
            const allAccess = [...userAccess,...viewers,...owners];
            const allContain = [...oldContain, ...input.contain]

            const sanitizedVaults = input.vaults.filter(vault => {
                const access = allAccess.find(a => a.out === vault.id);
                if (!access) return false;
                return hasPermission(access.role, "vault:create");
            });


            const sanitizedCards  = input.cards.filter(card => {
              const link = allContain.find(c => c.out === card.id);
              if (!link) return false;         
            
              const access = allAccess.find(a => a.out === link.in);
              if (!access) return false;        

              return hasPermission(access.role, "card:add");
            });
            
            // Dump
            const dump = await dbquery(`
                BEGIN TRANSACTION;

                FOR $access IN $accessArray { INSERT RELATION INTO Access {
                    id: type::thing($access.id),
                    in : type::thing($access.in),
                    out : type::thing($access.out),
                    role : $access.role,
                }};

                FOR $vault IN $vaultsArray {UPSERT type::thing($vault.id) CONTENT {
                    name: $vault.name,
                    status: $vault.status,
                    updatedAt: $vault.updatedAt,
                }};

                FOR $contain IN $containsArray { INSERT RELATION INTO Contain {
                    id : type::thing($contain.id),
                    in: type::thing($contain.in),
                    out: type::thing($contain.out),
                } };

                FOR $card IN $cardsArray { UPSERT type::thing($card.id) CONTENT {
                    name: $card.name,
                    status: $card.status,
                    data: $card.data,
                    updatedAt: $card.updatedAt,
                } };

                COMMIT TRANSACTION;
            `,{
                accessArray: sanitizedAccess,
                vaultsArray: sanitizedVaults,
                containsArray: input.contain,
                cardsArray: sanitizedCards
            });

            console.log(dump.value);

            if (dump.err){handleTRPCError(dump.value)};

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