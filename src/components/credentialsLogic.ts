import { createSignal, createEffect } from 'solid-js';
import {count_characters } from "../pkg/rust_lib";
import { trpc } from "../utils/trpc";
import queryHelper, { cache } from "../utils/query-helper"
import {client} from '@passwordless-id/webauthn'



// Key and IV signals
export const [key, setKey]                    = createSignal("");
export const [iv, setIv]                      = createSignal("");
export const [keyIvIsValid, setKeyIvIsValid ] = createSignal(false)
export const [userName, setUserName] = createSignal("");


// encryption inputs
document.getElementById("key-IV")!.addEventListener("input",(e)=>{
   if((e!.target as HTMLInputElement).matches("#key")){
      const value = (e!.target as HTMLInputElement).value;
      setKey(value.toString());
      document.getElementById("key_indic")!.textContent = count_characters(key()).toString();
   }
   if((e!.target as HTMLInputElement).matches("#iv")){
      const value = (e!.target as HTMLInputElement).value;
      setIv(value.toString());
      document.getElementById("iv_indic")!.textContent = count_characters(iv()).toString();
   }
});

// check for Key and IV validity
createEffect(() => {
	setKeyIvIsValid(
		count_characters(key()).toString() === "✔️" &&
			count_characters(iv()).toString() === "✔️",
	);
});

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
            const [data, error] = await queryHelper.direct("db", () => trpc.challenge.query());
            if (data?.message) {
                const authentication: any = await client.authenticate({
                  challenge: data.message,
                  timeout: 60000
                });

                if (authentication){document.getElementById("auth_result")!.textContent = "Connectoing to the server"}
                const [authData, authError] = await queryHelper.direct("auth", async () => {
                    return await trpc.authenticate.mutate({
                        challenge: data.message,
                        authenticationData: authentication,
                    });
                });
                if (typeof authData?.message === 'object') {
                    document.getElementById("auth_result")!.textContent =
                    authData?.message.userVerified === true
                        ? `Authenticated`
                        : authError?.message 
                        ??"Authentication Failed";
                } else {
                    document.getElementById("auth_result")!.textContent = "Authentication Failed";
                }
                /// use authData.credentialId as UID
            }
        })();
    }  
});

