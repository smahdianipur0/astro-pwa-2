import { createSignal } from 'solid-js';
import { trpc } from "../utils/trpc";
import queryHelper  from "../utils/query-helper"
import {client} from '@passwordless-id/webauthn'
import { element } from "../utils/elementUtils";
import { dbCreate, dbReadAll, dbUpdate, type CredentialsEntry} from "../utils/surrealdb-indexed"


const [userName, setUserName] = createSignal("");
const [indexedUid, setIndexedUid] = createSignal(false);


const user = await dbReadAll("Credentials");
console.log(user)

if ( user && user?.length !== 0 ) {
    const userId= user[0].id?.id
    if (userId && user[0].registered === true){
        setIndexedUid(true);      
    }
 } else if ( user && user?.length === 0 ){
     dbCreate("Credentials:create",{registered: false});
     setIndexedUid(false);
 }



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
    console.log(indexedUid())
    if (indexedUid() === false) {
        credentialsDiv.textContent = '';
        const fragment = document.createDocumentFragment();
        
        fragment.append(
            element.configure('div', {className: 'prose',
                style: 'display: flex; gap: var(--gap); justify-content: space-between;',
                append: [
                    element.configure('input', {id: 'user_name',
                        type: 'text', placeholder: 'Name',autocomplete: 'off',
                        style: 'margin-bottom: var(--gap); width: 100%;'}),

                    element.configure('button', {id: 'registration',
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

            if (error) { document.getElementById("auth_result")!.textContent = "Connection failed"};

            if (data?.message) {
                console.log(data);
                const registration: any = await client.register({
                  user: userName(),
                  challenge: data.message,
                });
                if (registration){document.getElementById("auth_result")!.textContent = "Connectoing to the server"}

                const [registryData, registryError] = await queryHelper.direct("db", async () => {
                    return await trpc.registry.mutate({
                        challenge: data.message,
                        registry: registration,
                    });
                });

                console.log(registryData, registryError)

                if (registryData)  {

                    

                    const credentialsDiv = document.getElementById("credentialsDiv") as HTMLElement;
                    credentialsDiv.textContent = '';
                    const fragment = document.createDocumentFragment();
                    
                    fragment.append(
                        element.configure('p', { className: 'hint', style: 'margin-top: 0;', append:[
                        element.configure('span', { textContent: "device registered."})
                        ]})
                    );
                    credentialsDiv.append(fragment);
                    document.getElementById("auth_result")!.textContent = " "
                    await dbCreate("Credentials:create",{registered: true});
                    // use registration.id as UID}
                }

                if (registryError) {
                    document.getElementById("auth_result")!.textContent = "Registration Failed"
                    console.log(registryError?.message)
                }

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

            if (authData)  {
                const credentialsDiv = document.getElementById("credentialsDiv") as HTMLElement;
                credentialsDiv.textContent = '';
                const fragment = document.createDocumentFragment();
                
                fragment.append(element.configure('p', { className: 'hint', style: 'margin-top: 0;', append:[
                    element.configure('span', { textContent: "device registered."})
                ]}));
                credentialsDiv.append(fragment);
                if (authData?.authenticated && authData.credentialId) {
                // use authData.credentialId as UID}
                }
                if (user) {
                    const userId= user[0].id?.id
                    if (userId){
                        dbUpdate("Credentials:update",{id :userId, registered: true})
                        setIndexedUid(true);      
                    }                 
                }
            }

            if (authError) {
                document.getElementById("auth_result")!.textContent = "Authentication Failed"
                console.log(authError?.message)
            }
        })();
    }
});