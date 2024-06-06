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
const [length, setLength] = createSignal(16);

createEffect(() => {
	document.getElementById("gp")!.textContent = generate_password(
		length(),
		true,
		true,
		true,
	).toString();
});




const guess = guessable(password);
const strength = calculate_password_strength(password);
const strength2 = calculate_password_strength2(password);


document.getElementById("gu")!.textContent = guess.toString();
document.getElementById("s1")!.textContent = strength.toString();
document.getElementById("s2")!.textContent = strength2.toString();



document.getElementById("maina")!.addEventListener("input",(e)=>{
   if((e!.target as HTMLInputElement).matches("#rangeInput")){
      const value = (e!.target as HTMLInputElement).value;
      setLength(Number(value));      
   }

   if((e!.target as HTMLInputElement).matches("#Input")){

      const value = (e!.target as HTMLInputElement).value;
      const guess = guessable(value);
      const strength = calculate_password_strength(value);
      const strength2 = calculate_password_strength2(value);

      document.getElementById("gu")!.textContent = guess.toString();
      document.getElementById("s1")!.textContent = strength.toString();
      document.getElementById("s2")!.textContent = strength2.toString();
      
   }
});
      