import { createSignal } from 'solid-js';
import { trpc } from "../utils/trpc";
import queryHelper  from "../utils/query-helper"
import {client} from '@passwordless-id/webauthn'
import { element } from "../utils/elementUtils";
import { dbCreate, dbReadAll, dbUpdate, } from "../utils/surrealdb-indexed"

// import {syncVaults} from "../utils/syncLayer"
// (async () => { await syncVaults();})();
 

const [userName, setUserName] = createSignal("");
const [indexedUid, setIndexedUid] = createSignal(false);


// initiate auth state based on indexed database
const user = await dbReadAll("Credentials");

if (user && user?.length === 0) {
    dbCreate("Credentials:create", { registered: false });
    setIndexedUid(false);
}

if (user && user?.length !== 0) {
    const userId = user[0].id?.id;
    if (userId && user[0].registered === true) {
        setIndexedUid(true);
    }
} 


// auth functions
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

async function regQueryChallenge() {
    const [data, error] = await queryHelper.direct("db", () => trpc.challenge.query());

    if (data?.message) {
        const registration: any = await client.register({
            user: userName(),
            challenge: data.message,
        });
        return { registration, challenge: data.message };
    }
    if (!data) {
        console.error("No data received from challenge query", error);
    }
    return { registration: undefined, challenge: "" };
}

async function validateAuthentication(challenge: string, authentication: any) {
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

async function validateRegistration(challenge: string, registration: any) {
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


const authResult = document.getElementById("auth_result") as HTMLElement;
const credentialsDiv = document.getElementById("credentialsDiv") as HTMLElement;

function updateSucceededAuth() {
    credentialsDiv.textContent = '';

    const fragment = document.createDocumentFragment();

    fragment.append( element.configure('p', {  className: 'hint', style: 'margin-top: 0;',append: [
        element.configure('span', { textContent: "device registered." })
    ]}));

    credentialsDiv.append(fragment);
    authResult.textContent = "";
}


// initial ui based on states
(async () => {
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
    } else {
        updateSucceededAuth()
    }
})();


// get user name
document.getElementById("credentials")!.addEventListener("input",(e)=>{
    if((e!.target as HTMLInputElement).matches("#user_name")){
       const value = (e!.target as HTMLInputElement).value;
       setUserName(value.toString());
       (document.getElementById("registration")! as HTMLInputElement).disabled  = (userName() === "");
    }
});


document.getElementById("credentials")!.addEventListener("click", (e) => {
    
    if ((e!.target as HTMLInputElement).matches("#registration")) {

        (async () => {
            try {
                const { registration, challenge } = await regQueryChallenge();
                if (!registration){authResult.textContent = "Connection failed"}
                if ( registration){authResult.textContent = "Connectoing to the server"}

                const {registryData,registryError} = await validateRegistration(challenge, registration)

                // handle Succeeded regestration 
                if (registryError){authResult.textContent = "Registration Failed"; return}
                if (!registryData){authResult.textContent = "Registration Failed"; return}
                if (!user) return;
                const userId = user[0]?.id?.id;
                if (!userId) return;

                // handle Failed regestration 
                updateSucceededAuth()                    
                dbUpdate("Credentials:update", { id: userId, registered: true, UID: registration.id });
                setIndexedUid(true);  

            } catch (error) {
                authResult.textContent = "Registration Failed"
            }

        })();
    }

    // start authentication
    if ((e!.target as HTMLInputElement).matches("#authentication")) {
        (async () => {
         
            try {
                const { authentication, challenge } = await authQueryChallenge();
                if (!authentication) { authResult.textContent = "Failed to start authentication"; return; }
                authResult.textContent = "Connecting to the server...";
                
                const { authData, authError } = await validateAuthentication(challenge, authentication);
              
                // handle Faild auth
                if (authError) {authResult.textContent = "Authentication Failed"; return;}
                if (!authData) {authResult.textContent = "Authentication Failed"; return;}
                if (!authData.authenticated || !authData.credentialId) {authResult.textContent = "Authentication Failed"; return; }      
                if (!user ) { return }
                if (!user[0].id ) { return }
                const userId = user[0].id.id;

                // handle Succeeded auth 
                updateSucceededAuth();
                dbUpdate("Credentials:update", { id: userId, registered: true, UID: authData.credentialId });
                setIndexedUid(true);
            } catch (error) {
                console.error("Authentication flow error:", error);
                authResult.textContent = "Authentication Failed";
            }
        })();
    }
});