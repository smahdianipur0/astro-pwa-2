import { createStore, derive } from '../utils/state';
import {
   generate_password,
   calculate_password_strength,
   calculate_password_strength2,
   guessable,
   encrypt,
   decrypt,
   count_characters
} from "../pkg/rust_lib";


export const pass = createStore({
    state: { 
    	rPassword: generate_password(16, true, true, true),
    	mPassword: "",
    	Password : "",

    	length :               16,
    	addSpecialCha:         true,
		addNumber:             true,
		capitalizeFirstLetter: true,

		key: "",
		iv : "",
    },

    methods: {
    	updateRPassword() { this.set('rPassword', generate_password(
    		this.get("length"), this.get("addSpecialCha"), this.get("addNumber"), this.get("capitalizeFirstLetter")
    	)); },
    	setmPassword (input: string) { this.set('mPassword', input); },
    	setPassword  (input: string) { this.set('mPassword', input); },

    	setLength                (value: number)  { this.set('length', value); },
    	setAddSpecialCha         (value: boolean) { this.set('addSpecialCha', value); },
    	setAddNumber             (value: boolean) { this.set('addNumber', value); },
    	setCapitalizeFirstLetter (value: boolean) { this.set('capitalizeFirstLetter', value); },

    	setKey (input: string)  { this.set('key', input); },
    	setIV  (input: string)  { this.set('iv', input); },
    }, 

    derived: {
	    guessable: derive(
	      ['Password'] as const, 
	      ({ get }) => ( guessable(get('Password')))
	    ),
	    strength1: derive(
	      ['Password'] as const, 
	      ({ get }) => ( calculate_password_strength(get('Password')))
	    ),
	    strength2: derive(
	      ['Password'] as const, 
	      ({ get }) => ( calculate_password_strength2(get('Password')))
	    ),
	    keyIvIsValid: derive(
	      ['key', 'iv'] as const, 
	      ({ get }) => ( 
	      	count_characters(get('key')) === "✔️" && 
	      	count_characters(get('iv')) === "✔️"
	      	)
	    ),
	}
});

pass.on(["length", "addSpecialCha","addNumber", "capitalizeFirstLetter"], pl =>{
	pass.updateRPassword();
});

pass.on(["rPassword", "mPassword"], pl =>{
	pass.setPassword(pl.value);
});

