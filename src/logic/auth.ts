import { trpc } from "../utils/trpc";
import queryHelper  from "../utils/query-helper"
import {client} from '@passwordless-id/webauthn'
import {createStore} from '../utils/state'
import { AppError } from "../utils/error";


export const auth = createStore({
    state: { userName: "", indexedUid: false },
    methods: {
        setUserName(value: string) { this.set('userName', value); },
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

export async function validateAuthentication(challenge: string, authentication: any) {
    try {
        console.log("Sending authentication request to server");
        const auth = await queryHelper.mutate("auth", async () => {
            return await trpc.authenticate.mutate({
                challenge,
                authenticationData: authentication,
            });
        });
        console.log("Authentication response:", auth.value);
        if (auth.ok) { return auth.value}
        if (auth.err && !(auth.value instanceof SuppressedError)) {
            console.error("authentication faild", auth.value.message, auth.value.cause);
            return
        }

        
    } catch (error) {
        console.error("Error in authentication request:", error);
        return
    }
}

export async function validateRegistration(challenge: string, registration: any) {
    try {
        console.log("Sending registration request to server");
        const reg = await queryHelper.mutate("reg", async () => {
            return await trpc.registry.mutate({
                challenge :challenge,
                registry: registration,
            });
        });

        console.log("Authentication response:", reg.value);
        if (reg.ok) { return reg.value}
        if (reg.err && !(reg.value instanceof SuppressedError)) {
            console.error("authentication faild", reg.value.message, reg.value.cause);
            return
        }

    } catch (error) {
        console.error("Error in authentication request:", error);
        return
    }
}