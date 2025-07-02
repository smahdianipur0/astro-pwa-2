import { createStore, derive } from '../utils/state';
import {
   generate_password,
   calculate_password_strength,
   encrypt,
   decrypt,
   count_characters
} from "../pkg/rust_lib";
import { TOTP } from "totp-generator";


export const pass = createStore({

   state: { 

    	rPassword: "",
    	mPassword: "",
    	Password : "",

    	length :               16,
    	addSpecialCha:         true,
		addNumber:             true,
		capitalizeFirstLetter: true,

		key:             "",
		iv :             "",
		varificationKey: "", 
		keyMode:         "Auto",

		otpRes:    "",
		countDown: "",

		plainText:  "",
		cipherText: ""

    },

   methods: {

    	updateRPassword() { this.set('rPassword', generate_password(
    		this.get("length"), this.get("addSpecialCha"), this.get("addNumber"), this.get("capitalizeFirstLetter")
    	)); },
    	setMPassword (input: string) { this.set('mPassword', input) },
    	setPassword  (input: string) { this.set('Password', input) },

    	setLength(value: number) { this.set('length', value) },
    	incrementLength() { this.set('length', 
    		this.get("length") < 20 ? this.get("length") + 1  : this.get("length") 
    	)},
    	decrementLength(){ this.set('length', 
    		this.get("length") > 12 ? this.get("length") - 1  : this.get("length") 
    	)},

    	setAddSpecialCha         (value: boolean) { this.set('addSpecialCha', value) },
    	setAddNumber             (value: boolean) { this.set('addNumber', value) },
    	setCapitalizeFirstLetter (value: boolean) { this.set('capitalizeFirstLetter', value) },

    	setKey              (input: string)  { this.set('key', input) },
    	setIV               (input: string)  { this.set('iv', input) },
    	setVarificationKey  (input: string)  { this.set('varificationKey', input) },
    	setKeyMode          (input: string)  { this.set('keyMode', input) },

    	updateOtpRes (){
    		try { const { otp, expires } = TOTP.generate(this.get("secretKey").replace(/\s/g, ""));
         	this.set("otpRes" ,(otp.toString()));
	      } catch (error) {
	      	this.set("otpRes" ,"The provided key is not valid.");
	      }	   
	   },
	   updateCountDown(){  	
		   const currentTime = Math.round(new Date().getTime() / 1000);
		   const remainingSeconds = 30 - (currentTime % 30);
		   this.set("countDown", remainingSeconds.toString().padStart(2, '0'))  
	   },

		setPlainText  (input: string)  { this.set('plainText', input) },
		setCipherText (input: string)  { this.set('cipherText', input) },
    }, 

   derived: {
	    strength: derive(
	      ['Password'] as const, 
	      ({ get }) => ( calculate_password_strength(get('Password')))
	   ),
	    encryptedPass: derive(
	      ['Password', 'key', 'iv'] as const, 
	      ({ get }) => ( encrypt(get('key'),get('iv'), get('Password')))
	   ),	    
	    keyIvIsValid: derive(
	      ['key', 'iv'] as const, 
	      ({ get }) => (
	      	count_characters(get('key')) === "✔️" && 
	      	count_characters(get('iv'))  === "✔️"
	      )
	   ), 
	    keyIsEnc: derive(
	      ['varificationKey'] as const, 
	      ({ get }) => (/[A-Z]/.test(get("varificationKey")) && /[a-z]/.test(get("varificationKey")))
	   ),
	   secretKey: derive(
	      ['keyMode', 'key', 'iv', 'keyIsEnc', 'varificationKey'] as const, 
	      ({ get }) =>  { 
	      	if (get("keyMode") === "Plain" || 
 				   	get("keyMode") === "Auto" && get("keyIsEnc") === false ) {
		      	return get("varificationKey");
		  		 }

			   else if (get("keyMode") === "Encrypted" || 
			      	get("keyMode") === "Auto" && get("keyIsEnc") === true ){
			   	return decrypt(get("key"), get("iv"), get("varificationKey"));
			   }
	      } 
	   ),
	   resultE: derive(
	      ['key', 'iv', 'plainText'] as const, 
	      ({ get }) => (encrypt(get('key'),get('iv'), get('plainText')))
	   ),
	   resultD: derive(
	      ['key', 'iv', 'cipherText'] as const, 
	      ({ get }) => (decrypt(get('key'),get('iv'), get('cipherText')))
	   ),	   
	}
});

pass.on(["length", "addSpecialCha","addNumber", "capitalizeFirstLetter"], pl =>{
	pass.updateRPassword();
});

pass.on(["rPassword", "mPassword"], pl =>{
	pass.setPassword(pl.value);
});

pass.on(["secretKey"], pl => {
	pass.updateOtpRes()
})

setInterval(pass.updateOtpRes, 1000);
setInterval(pass.updateCountDown, 1000);
