import { createSignal, createEffect } from 'solid-js';

export const [count, setCount] = createSignal(0);
createEffect(() => {  
	document.getElementById("createEffect")!.textContent = count().toString()});

export const [len, setLen] = createSignal(16);
createEffect(() => {  
	document.getElementById("createEffect-2")!.textContent = len().toString()});