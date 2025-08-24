import { trpc } from "../utils/trpc";
import queryHelper  from "../utils/query-helper"
import { client, server } from '@passwordless-id/webauthn'
import { createStore } from '../utils/state'
import { z } from "zod"
import { authenticationInputSchema, credentialSchema } from '../server/schemas';
import { dbquery } from "../utils/surrealdb-cloud";
import { type Result, Ok, Err, AuthenticationError,ValidationError } from "../utils/error"


export const auth = createStore({
    state: { userName: "", indexedUid: false },
    methods: {
        setUserName(value: string)    { this.set('userName',   value); },
        setIndexedUid(value: boolean) { this.set('indexedUid', value); },
    }, 
});


export async function authQueryChallenge() {
	const data = await queryHelper.noCacheQuery("auth challenge", () => trpc.challenge.query());

	if (data.ok) {
		const authentication = await client.authenticate({
			challenge: data.value.message,
			timeout: 60000,
		});
		return { authentication, challenge: data.value.message };
	}

	if (data.err && !(data.value instanceof SuppressedError)){
        console.error("No data received from challenge query", data.value.cause, data.value.cause);
        return { registration: undefined, challenge: "" }
    };
}

export async function regQueryChallenge() {
    const data = await queryHelper.noCacheQuery("reg challenge", () => trpc.challenge.query());

    if (data.ok) {
        const registration: any = await client.register({
            user: auth.get("userName"),
            challenge: data.value.message,
        });
        return { registration, challenge: data.value.message };
    }

    if (data.err && !(data.value instanceof SuppressedError)){
        console.error("No data received from challenge query", data.value.cause, data.value.cause);
        return { registration: undefined, challenge: "" }
    };

}

type AuthenticationData = z.infer<typeof authenticationInputSchema>['authenticationData'];
type CredentialObj = z.infer<typeof credentialSchema>;

export async function verifyAuthentication(authenticationData: AuthenticationData,challenge: string): 
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
        return new Err(new ValidationError(
            "Credential does not match expected schema", 
            {cause: parsedCredential.error } 
        ))
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
        return new Err(new AuthenticationError(
            "Invalid credential format", 
            {cause:`${verifyError}`} 
        ))
    }

    return new Ok({ authenticationParsed, credentialObj });
}