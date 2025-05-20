import { createSignal, createEffect } from 'solid-js';
import {
   generate_password,
   calculate_password_strength,
   calculate_password_strength2,
   guessable,
   encrypt,
   decrypt,
} from "../pkg/rust_lib";
import { TOTP } from "totp-generator";
import { key, iv, keyIvIsValid } from "../components/credentialsLogic.ts";


// password generator signals
export const [password, setPassword] = createSignal(generate_password(16, true, true, true));
const [mpassword, setMPassword]      = createSignal("");
const [currentPass, setCurrentPass]  = createSignal("");

const [length, setLength]                               = createSignal(16);
const [addSpecialCha, setAddSpecialCha]                 = createSignal(true);
const [addNumber, setAddNumber]                         = createSignal(true);
const [capitalizeFirstLetter, setCapitalizeFirstLetter] = createSignal(true);


document.getElementById("generate")!.addEventListener("input",(e)=>{
   // length input
   if((e!.target as HTMLInputElement).matches("#char_input")){
      const value = (e!.target as HTMLInputElement).value;
      setLength(Number(value));
   }

   // manual password input
   if((e!.target as HTMLInputElement).matches("#mPassword")){
      const value = (e!.target as HTMLInputElement).value;
      setMPassword(value.toString());
      setCurrentPass(mpassword()) 
      if(mpassword() === "") {
         (document.getElementById("copyMPassword")! as HTMLInputElement).disabled  = true;  
          } else {
         (document.getElementById("copyMPassword")! as HTMLInputElement).disabled  = false; 
      }   
   }
});

// plus and minus buttons
document.getElementById("generate")!.addEventListener("click",(e)=>{
   if((e!.target as HTMLInputElement).matches("#plus_chars , #plus_chars_icon")){
      setLength( length => length + 1 ); 
   }
    if((e!.target as HTMLInputElement).matches("#minus_chars, #minus_chars_icon")){
      setLength( length => length - 1 ); 
   }
});

// checkboxes for password generator
document.getElementById("generate")!.addEventListener("change",(e)=>{
   if ((e!.target as HTMLInputElement).matches("#first-tab-id-pass")) {
         if ((e.target as HTMLInputElement).checked) {
            setCurrentPass(password());
         }
      }
   if ((e!.target as HTMLInputElement).matches("#second-tab-id-pass")) {
      if ((e.target as HTMLInputElement).checked) {
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

// plus and minus buttons disabler effect
createEffect(() => {
   (document.getElementById("char_input")!as HTMLInputElement).value = length().toString();
   if (length() >= 20) {
      (document.getElementById("plus_chars")! as HTMLInputElement).disabled  = true;
   } else {
      (document.getElementById("plus_chars")! as HTMLInputElement).disabled  = false;
   }
   if (length() <= 12) {
      (document.getElementById("minus_chars")! as HTMLInputElement).disabled  = true;
   } else {
      (document.getElementById("minus_chars")! as HTMLInputElement).disabled  = false;
   }
});

// password generator
createEffect(() => { 
   setPassword(generate_password(
      length(),
      addSpecialCha(),
      addNumber(),
      capitalizeFirstLetter(),
   ));
   document.getElementById("gp")!.textContent = password();
   setCurrentPass(password())
});


// password strength measurements effect
createEffect(() => { document.getElementById("gu")!
   .textContent = guessable(currentPass()) });

createEffect(() => { document.getElementById("s1")!
   .textContent = calculate_password_strength(currentPass()) });

createEffect(() => { 
   if(calculate_password_strength2(currentPass()) !== "Zxcvbn cannot evaluate a blank password") {
    document.getElementById("s2")!.textContent = calculate_password_strength2(currentPass())
   } else {
      document.getElementById("s2")!.textContent = ""  
   }
});    


// password strength box effect
createEffect(() => { 
   const gu = guessable(currentPass());

   document.getElementById("box")!.style.setProperty("--box-w", 
      gu === "Enter password" ? "0%" :
      gu === "Too Guessable" ? "36%" :
      gu === "Very Guessable" ? "52%" :
      gu === "Somewhat Guessable" ? "68%" :
      gu === "Safely Unguessable" ? "84%" :
      gu === "Very Unguessable" ? "100%" : "0%"
   );

   document.getElementById("box")!.style.setProperty("--box-p", 
      gu === "Enter password" ? "0%" :
      gu === "Too Guessable" ? "0%" :
      gu === "Very Guessable" ? "16%" :
      gu === "Somewhat Guessable" ? "32%" :
      gu === "Safely Unguessable" ? "48%" :
      gu === "Very Unguessable" ? "64%" : "0%"
   );
});


// copy password and redo effect
document.getElementById("redo")!.classList.remove('blink')

document.getElementById("generate")!.addEventListener("click",(e)=>{
   if((e!.target as HTMLInputElement).matches("#gp ,#ttc")){
      navigator.clipboard.writeText(password());  
      showToast(); 
   }

   if((e!.target as HTMLInputElement).matches("#copyMPassword")){
      if(mpassword() !== "") {
         navigator.clipboard.writeText(mpassword());  
         showToast(); 
      }
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


// encryption for password
const [resultP, setResultP] = createSignal("");

//textContenyt and disabled Conditions for Encrypted Pasword
createEffect(() => {
   setResultP(encrypt(key(), iv(), currentPass()));
   document.getElementById("encrypted-pass")!.textContent = resultP();
   if(resultP() !== "" && keyIvIsValid() === true) {
      (document.getElementById("encrypted-pass")! as HTMLButtonElement).disabled  = false;
      (document.getElementById("encrypted-pass-copy")! as HTMLButtonElement).disabled  = false;
      document.getElementById("encrypted-pass-copy")!.textContent = "tap to copy";
   } else {
      (document.getElementById("encrypted-pass")! as HTMLButtonElement).disabled  = true;
      (document.getElementById("encrypted-pass-copy")! as HTMLButtonElement).disabled  = true;
      document.getElementById("encrypted-pass-copy")!.textContent = "";  
   }
});


// copy Encrypted Pasword
document.getElementById("generate")!.addEventListener("click",(e)=>{
   if((e!.target as HTMLInputElement).matches("#encrypted-pass, #encrypted-pass-copy")){
      if(resultP() !== "" && keyIvIsValid() === true) {
         navigator.clipboard.writeText(resultP());  
         showToast(); 
      }
   }
});


//varifaction 
const [inKey, setInKey]         = createSignal("");
const [otpOps, setOtpOps]       = createSignal("Auto");
const [keyIsEnc, setKeyIsEnc]   = createSignal(false);
const [sKey, setSkey]           = createSignal("");
const [otpRe, setOtpRe]         = createSignal("");
const [countDown, setCountDown] = createSignal("");


function updateCountDown(){
   const currentTime = Math.round(new Date().getTime() / 1000);
   const remainingSeconds = 30 - (currentTime % 30);
   setCountDown(remainingSeconds.toString().padStart(2, '0'));   
}
setInterval(updateCountDown, 1000);


document.getElementById("varification")!.addEventListener("input",(e)=>{
   if((e!.target as HTMLInputElement).matches("#varification-key")){
      const value = (e!.target as HTMLInputElement).value;
      setInKey(value.toString());
   }
   if((e!.target as HTMLInputElement).matches("#varification-key-ops")){
      const value = (e!.target as HTMLInputElement).value;
      setOtpOps(value.toString());
   }
});

//detect if key is encrypted or not
createEffect(() => {
   setKeyIsEnc(/[A-Z]/.test(inKey()) && /[a-z]/.test(inKey()));
});


// set sKey based on options and detection
createEffect(() => {

   if ((otpOps() === "Plain") || 
      (otpOps() === "Auto" && keyIsEnc() === false )) {
      setSkey(inKey());
   }

   else if ((otpOps() === "Encrypted") || 
      (otpOps() === "Auto" && keyIsEnc() === true )){
      setSkey(decrypt(key(), iv(), inKey()));
   }
});

function updateOtp() {
   createEffect(() => {
      try { const { otp, expires } = TOTP.generate(sKey().replace(/\s/g, ""));
         setOtpRe(otp.toString());
      } catch (error) {
         setOtpRe("The provided key is not valid.");   
      }
   });
}
setInterval(updateOtp, 1000);


createEffect(() => {
   switch (true) {
      case (sKey() === ""):
         document.getElementById("varif_detail")!.textContent = ""
         document.getElementById("varif_detail_res")!.textContent = "";
         document.getElementById("varif_hint")!.textContent = "";
         document.getElementById("varif_copy_hint")!.textContent = "";
         break;

      case (sKey() !== inKey() && (!keyIvIsValid() || sKey() === "Invalid Credentials")):
         document.getElementById("varif_detail")!.textContent = sKey();
         document.getElementById("varif_detail_res")!.textContent = "";
         document.getElementById("varif_hint")!.textContent = "";
         document.getElementById("varif_copy_hint")!.textContent = "";
         break;

      case (otpRe() === "The provided key is not valid."):
         document.getElementById("varif_detail")!.textContent = otpRe();
         document.getElementById("varif_detail_res")!.textContent = "";
         document.getElementById("varif_hint")!.textContent = "";
         document.getElementById("varif_copy_hint")!.textContent = "";
         break;

      default:
         document.getElementById("varif_detail")!.textContent = "Varification Code:";
         document.getElementById("varif_detail_res")!.textContent = otpRe();
         document.getElementById("varif_hint")!.textContent =
            "This code is valid for the next ".concat(countDown().toString(), " seconds.");
         document.getElementById("varif_copy_hint")!.textContent = "Tap to copy";
   }
});


document.getElementById("varification")!.addEventListener("click", (e) => {
   if (
      (e!.target as HTMLInputElement).matches("#varif_detail ,#varif_detail_res, #varif_copy_hint",) &&
      document.getElementById("varif_detail_res")!.textContent !== ""
   ) {
      navigator.clipboard.writeText(otpRe());
      showToast();
   }
});

let timeoutId: number | undefined;

export function showToast() {
  const toastElement = document.getElementById('toast')!;
  if (toastElement) {
    toastElement.style.bottom = 'var(--size-lg1)';
    toastElement.style.scale = '1';
    toastElement.style.transition = 'bottom 0.25s var(--move), scale 0.5s var(--appear)';

    timeoutId = window.setTimeout(() => {
      toastElement.style.bottom = '-100%';
      toastElement.style.scale = '0.55';
      toastElement.style.transition = 'bottom 0.4s ease-in, scale 0.4s ease-in';
    }, 2000);
  }
}