import { createSignal, createEffect } from 'solid-js';
import {count_characters } from "../pkg/rust_lib";



// Key and IV signals
export const [key, setKey]                    = createSignal("");
export const [iv, setIv]                      = createSignal("");
export const [keyIvIsValid, setKeyIvIsValid ] = createSignal(false)



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
