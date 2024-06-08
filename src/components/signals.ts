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




const [password, setPassword] = createSignal(generate_password(16, true, true, true));

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
});


createEffect(() => { document.getElementById("gp")!
   .textContent = password() });

createEffect(() => { document.getElementById("gu")!
   .textContent = guessable(password()) });

createEffect(() => { document.getElementById("s1")!
   .textContent = calculate_password_strength(password()) });

createEffect(() => { document.getElementById("s2")!
   .textContent = calculate_password_strength2(password()) });






document.getElementById("maina")!.addEventListener("input",(e)=>{
   if((e!.target as HTMLInputElement).matches("#rangeInput")){
      const value = (e!.target as HTMLInputElement).value;
      setLength(Number(value));      
   }
});



document.getElementById("maina")!.addEventListener("change",(e)=>{
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
      