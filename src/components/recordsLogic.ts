import { createSignal } from 'solid-js';
import { trpc } from "../utils/trpc";
import queryHelper  from "../utils/query-helper"
import {client} from '@passwordless-id/webauthn'
import { element } from "../utils/elementUtils";

const [userName, setUserName] = createSignal("");
const [indexedId, setIndexedId] = createSignal("");



async function queryChallenge() {
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



async function validateAuthentication(challenge: string, authentication: any) {
    const [authData, authError] = await queryHelper.direct("auth", async () => {
        return await trpc.authenticate.mutate({
            challenge,
            authenticationData: authentication,
        });
    });
    return { authData, authError };
}



(async () => {
    const credentialsDiv = document.getElementById("credentialsDiv") as HTMLElement;
    
    if (indexedId() === '') {
        credentialsDiv.textContent = '';
        const fragment = document.createDocumentFragment();
        
        fragment.append(
            element.configure('div', {
                className: 'prose',
                style: 'display: flex; gap: var(--gap); justify-content: space-between;',
                append: [

                    element.configure('input', {
                        id: 'user_name',
                        type: 'text',
                        style: 'margin-bottom: var(--gap); width: 100%;',
                        placeholder: 'Name',
                        autocomplete: 'off'}),

                    element.configure('button', {
                        id: 'registration',
                        style: 'margin-bottom: var(--gap); width: fit-content; white-space: nowrap;',
                        textContent: 'Sign Up',
                        disabled: true})

                ]
            }),

            element.configure('p', { className: 'hint', style: 'margin-top: 0;', append: [

                element.configure('span', { textContent: 'Allready Signed Up ? ' }),
                element.configure('button', {
                    className: 'unstyle-button not-prose',
                    id: 'authentication',
                    style: 'font-weight: 600; text-decoration: underline;',
                    textContent: 'Sign In'})
            ]})
        );
        
        credentialsDiv.append(fragment);
    }
})();


document.getElementById("credentials")!.addEventListener("input",(e)=>{
    if((e!.target as HTMLInputElement).matches("#user_name")){
       const value = (e!.target as HTMLInputElement).value;
       setUserName(value.toString());
       if(userName() === "") {
        (document.getElementById("registration")! as HTMLInputElement).disabled  = true;  
         } else {
        (document.getElementById("registration")! as HTMLInputElement).disabled  = false; 
     } 
    }
});


document.getElementById("credentials")!.addEventListener("click", (e) => {
    
    if ((e!.target as HTMLInputElement).matches("#registration")) {
        (async () => {
            const [data, error] = await queryHelper.direct("db", () => trpc.challenge.query());
            if (data?.message) {
                const registration: any = await client.register({
                  user: userName(),
                  challenge: data.message,
                });
                // use registration.id as UID
                if (registration){document.getElementById("auth_result")!.textContent = "Connectoing to the server"}
                const [registryData, registryError] = await queryHelper.direct("db", async () => {
                    return await trpc.registry.mutate({
                        challenge: data.message,
                        registry: registration,
                    });
                });
                document.getElementById("auth_result")!.textContent =
                registryData?.message === "User registered"
                    ? `${userName()} Registered Successfully`
                    : registryError?.message 
                    ??"Registration Failed";
            }
        })();
    }
    if ((e!.target as HTMLInputElement).matches("#authentication")) {
        (async () => {
            const { authentication, challenge } = await queryChallenge();
    
            if (authentication) {
                document.getElementById("auth_result")!.textContent = "Connecting to the server...";
            }
    
            const { authData, authError } = await validateAuthentication(challenge, authentication);
    
            document.getElementById("auth_result")!.textContent =
                authData?.message || authError?.message || "Authentication Failed";
    
            if (authData?.authenticated && authData.credentialId) {
                // setIndexedId(authData.credentialId);
                // use userCredentialId for future operations
            }
        })();
    }
    
});
