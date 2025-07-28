import { trpc } from "../utils/trpc";
import queryHelper  from "../utils/query-helper"
import {client} from '@passwordless-id/webauthn'
import {createStore} from '../utils/state'


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