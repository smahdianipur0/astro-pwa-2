import { createSignal, createEffect } from 'solid-js';

export const [count, setCount] = createSignal(0);
createEffect(() => {  
	document.getElementById("createEffect")!.textContent = count().toString()});

export const [len, setLen] = createSignal(16);
createEffect(() => {  
	document.getElementById("createEffect-2")!.textContent = len().toString()});



import { generate_password }            from "../pkg/rust_lib";
import { calculate_password_strength }  from "../pkg/rust_lib";
import { calculate_password_strength2 } from "../pkg/rust_lib";
import { guessable }                    from "../pkg/rust_lib";


const [password, setPassword]       = createSignal(generate_password(16, true, true, true));
const [mpassword, setMPassword]     = createSignal("");
const [currentPass, setCurrentPass] = createSignal("");

const [length, setLength]                               = createSignal(16);
const [addSpecialCha, setAddSpecialCha]                 = createSignal(true);
const [addNumber, setAddNumber]                         = createSignal(true);
const [capitalizeFirstLetter, setCapitalizeFirstLetter] = createSignal(true);

createEffect(() => { setPassword(generate_password(
      length(),
      addSpecialCha(),
      addNumber(),
      capitalizeFirstLetter(),
   ));
   setCurrentPass(password())
});


document.getElementById("generate")!.addEventListener("input",(e)=>{
   if((e!.target as HTMLInputElement).matches("#rangeInput")){
      const value = (e!.target as HTMLInputElement).value;
      setLength(Number(value));      
   }
   if((e!.target as HTMLInputElement).matches("#mPassword")){
      const value = (e!.target as HTMLInputElement).value;
      setMPassword(value.toString());
      setCurrentPass(mpassword())     
   }
});


document.getElementById("generate")!.addEventListener("change",(e)=>{
   if ((e!.target as HTMLInputElement).matches("#random")) {
         if ((event.target as HTMLInputElement).checked) {
            setCurrentPass(password());
         }
      }
      if ((e!.target as HTMLInputElement).matches("#manual")) {
         if ((event.target as HTMLInputElement).checked) {
            setCurrentPass(mpassword());
         }
      }
   if((e!.target as HTMLInputElement).matches("#add_special_cha")){
      if ((e!.target as HTMLInputElement).checked){ 
         setAddSpecialCha(true) } else { setAddSpecialCha(false) 
      }
   }

   if((e!.target as HTMLInputElement).matches("#add_number")){
      if ((e!.target as HTMLInputElement).checked){ 
         setAddNumber(true) } else { setAddNumber(false) 
      }
   }

   if((e!.target as HTMLInputElement).matches("#capitalize_first_letter")){
      if ((e!.target as HTMLInputElement).checked){ 
         setCapitalizeFirstLetter(true) } else { setCapitalizeFirstLetter(false) 
      }
   }

});

createEffect(() => { document.getElementById("gp")!
   .textContent = password() });

createEffect(() => { document.getElementById("gu")!
   .textContent = guessable(currentPass()) });

createEffect(() => { document.getElementById("s1")!
   .textContent = calculate_password_strength(currentPass()) });

createEffect(() => { document.getElementById("s2")!
   .textContent = calculate_password_strength2(currentPass()) });


createEffect(() => { 
   const gu= guessable(currentPass());
       if (gu === "Enter password") {
      document.getElementById("box")!.style.setProperty("--box-w", "0%");
      document.getElementById("box")!.style.setProperty("--box-p", "0%");
   }   if (gu === "Too Guessable") {
      document.getElementById("box")!.style.setProperty("--box-w", "36%");
      document.getElementById("box")!.style.setProperty("--box-p", "0%");
   }   if (gu === "Very Guessable") {
      document.getElementById("box")!.style.setProperty("--box-w", "52%");
      document.getElementById("box")!.style.setProperty("--box-p", "16%");
   }   if (gu === "Somewhat Guessable") {
      document.getElementById("box")!.style.setProperty("--box-w", "68%");
      document.getElementById("box")!.style.setProperty("--box-p", "32%");
   }   if (gu === "Safely Unguessable") {
      document.getElementById("box")!.style.setProperty("--box-w", "84%");
      document.getElementById("box")!.style.setProperty("--box-p", "48%");
   }   if (gu === "Very Unguessable") {
      document.getElementById("box")!.style.setProperty("--box-w", "100%");
      document.getElementById("box")!.style.setProperty("--box-p", "64%");
   }
});



document.getElementById("generate")!.addEventListener("click",(e)=>{
   if((e!.target as HTMLInputElement).matches("#gp ,#ttc")){
      navigator.clipboard.writeText(password());  
      showToast(); 
   }

   if((e!.target as HTMLInputElement).matches("#copyMPassword")){
      navigator.clipboard.writeText(mpassword());  
      showToast(); 
   }

   if((e!.target as HTMLInputElement).matches("#redo")){
      setPassword(generate_password(
      length(),
      addSpecialCha(),
      addNumber(),
      capitalizeFirstLetter(),
      ));
      setCurrentPass(password())
   }
});





import { onMount } from 'solid-js';

let timeoutId: number | undefined;

function showToast() {
  const toastElement = document.getElementById('toast');
  if (toastElement) {
    toastElement.style.bottom = 'var(--portion)';
    timeoutId = window.setTimeout(() => {
      toastElement.style.bottom = '-100%';
    }, 2000);
  }
}

function clearToastTimeout() {
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  }
}

onMount(() => {
   return () => {
      clearToastTimeout();
   };
});


