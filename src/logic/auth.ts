import { trpc } from "../utils/trpc";
import queryHelper  from "../utils/query-helper"
import {client} from '@passwordless-id/webauthn'
import {createStore} from '../utils/state'


export const auth = createStore({
    state: { userName: "16", indexedUid: false },
    methods: {
        setUserName(value: string) { this.set('userName', value); },
        setIndexedUid(value: boolean) { this.set('indexedUid', value); },
    }, 
});


export async function authQueryChallenge() {
	const [data, error] = await queryHelper.direct("db", () => trpc.challenge.query());

	if (data?.message) {
		const authentication = await client.authenticate({
			challenge: data.message,
			timeout: 60000,
		});
		return { authentication, challenge: data.message };
	}
	if (!data) {
		console.error("No data received from challenge query", error);
	}
	return { authentication: undefined, challenge: "" };
}

export async function regQueryChallenge() {
    const [data, error] = await queryHelper.direct("db", () => trpc.challenge.query());

    if (data?.message) {
        const registration: any = await client.register({
            user: auth.get("userName"),
            challenge: data.message,
        });
        return { registration, challenge: data.message };
    }
    if (!data) {
        console.error("No data received from challenge query", error);
    }
    return { registration: undefined, challenge: "" };
}

export async function validateAuthentication(challenge: string, authentication: any) {
    try {
        console.log("Sending authentication request to server");
        const [authData, authError] = await queryHelper.direct("auth", async () => {
            return await trpc.authenticate.mutate({
                challenge,
                authenticationData: authentication,
            });
        });
        console.log("Authentication response:", authData, "Error:", authError);
        return { authData, authError };
    } catch (error) {
        console.error("Error in authentication request:", error);
        return { authData: null, authError: error };
    }
}

export async function validateRegistration(challenge: string, registration: any) {
    try {
        console.log("Sending registration request to server");
        const [registryData, registryError] = await queryHelper.direct("auth", async () => {
            return await trpc.registry.mutate({
                challenge :challenge,
                registry: registration,
            });
        });
        console.log("registration response:", registryData, "Error:", registryError);
        return { registryData, registryError };
    } catch (error) {
        console.error("Error in registration request:", error);
        return { registryData: null, registryError: error };
    }
}