import { createSignal, createEffect } from 'solid-js';
import {
   generate_password,
   calculate_password_strength,
   calculate_password_strength2,
   guessable,
} from "../pkg/rust_lib";



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
      if(mpassword() === "") {
         (document.getElementById("copyMPassword")! as HTMLInputElement).classList.add("disabled")  
          } else {
         (document.getElementById("copyMPassword")! as HTMLInputElement).classList.remove("disabled") 
      }   
   }
});


document.getElementById("generate")!.addEventListener("change",(e)=>{
   if ((e!.target as HTMLInputElement).matches("#random")) {
         if ((e.target as HTMLInputElement).checked) {
            setCurrentPass(password());
         }
      }
      if ((e!.target as HTMLInputElement).matches("#manual")) {
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

createEffect(() => { document.getElementById("gp")!
   .textContent = password() });

createEffect(() => { document.getElementById("gu")!
   .textContent = guessable(currentPass()) });

createEffect(() => { document.getElementById("s1")!
   .textContent = calculate_password_strength(currentPass()) });

createEffect(() => { 
   if(calculate_password_strength2(currentPass()) !== "Zxcvbn cannot evaluate a blank password") {
    document.getElementById("s2")!
   .textContent = calculate_password_strength2(currentPass())  
   } else {
      document.getElementById("s2")!
      .textContent = ""  
   }
});    


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




import { encrypt, decrypt, count_characters } from "../pkg/rust_lib";

const [key, setKey]                 = createSignal("");
const [iv, setIv]                   = createSignal("");
const [plainText, setPlainText]     = createSignal("");
const [fbPlainText, setFbPlainText] = createSignal("");
const [cipherText, setCipherText]   = createSignal("");
const [resultE, setResultE]         = createSignal("");
const [resultD, setResultD]         = createSignal("");



document.getElementById("encryption")!.addEventListener("input",(e)=>{
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

   if((e!.target as HTMLInputElement).matches("#plain_text")){
      const value = (e!.target as HTMLInputElement).value;
      setPlainText(value.toString());
      setFbPlainText(value.toString());
   }

   if((e!.target as HTMLInputElement).matches("#cipher_text")){
      const value = (e!.target as HTMLInputElement).value;
      setCipherText(value.toString());
   }
   
});


document.getElementById("encryption")!.addEventListener("change",(e)=>{
   if ((e!.target as HTMLInputElement).matches("#auto_pass")) {
      if ((e.target as HTMLInputElement).checked) {
         (document.getElementById("plain_text")! as HTMLInputElement).readOnly = true;
         createEffect(() => { setPlainText(currentPass()) })
      } else {
         setPlainText(fbPlainText().toString());
         (document.getElementById("plain_text")! as HTMLInputElement).readOnly = false;
      }
   }
});



import QRCode from 'qrcode'

createEffect(() => {
   setResultE(encrypt(key(), iv(), plainText()));
   if ( key() !== "" && iv() !== "") {
      document.getElementById("result_e")!.textContent = resultE();
   }

   if (resultE() === "") {
      document.getElementById("result_e")!.textContent = "Enter Plain Text";
   }
   QRCode.toCanvas(
      document.getElementById("eqr")!,
      resultE(),
      { width: 160, margin: 1 },
   );
});

createEffect(() => {
   setResultD(decrypt(key(), iv(), cipherText()));
   if ( key() !== "" && iv() !== "") {
   document.getElementById("result_d")!.textContent = resultD();
   }

   if (resultD() === "") {
      document.getElementById("result_d")!.textContent = "Enter Cipher Text";
   }
   QRCode.toCanvas(
      document.getElementById("dqr")!,
      resultD(),
      { width: 160, margin: 1 },
   );
});


createEffect(() => {
   if(resultE() !== "IV is not 16 Characters" &&
      resultE() !== "Key is not 16 Characters" &&
      resultE() !== "") {
      document.getElementById("copy_e")!.classList.remove("disabled");
      document.getElementById("l_show_e")!.classList.remove("disabled");
      (document.getElementById("show_e")! as HTMLInputElement).disabled  = false;
   } else{
      document.getElementById("copy_e")!.classList.add("disabled");
      document.getElementById("l_show_e")!.classList.add("disabled");
      (document.getElementById("show_e")! as HTMLInputElement).checked   = false; 
      (document.getElementById("show_e")! as HTMLInputElement).disabled  = true;
   }
});

document.getElementById("encryption")!.addEventListener("click",(e)=>{
   if((e!.target as HTMLInputElement).matches("#copy_e")){
       if(resultE() !== "IV is not 16 Characters" &&
         resultE() !== "Key is not 16 Characters" &&
         resultE() !== "") {
         navigator.clipboard.writeText(resultE());  
         showToast();
      } 
   }
});


createEffect(() => {
   if(resultD() !== "IV is not 16 Characters" &&
      resultD() !== "Key is not 16 Characters" &&
      resultD() !== "Invalid Credentials"&&
      resultD() !== "") {
      document.getElementById("copy_d")!.classList.remove("disabled");
      document.getElementById("l_show_d")!.classList.remove("disabled");
      (document.getElementById("show_d")! as HTMLInputElement).disabled  = false;
   } else{
      document.getElementById("copy_d")!.classList.add("disabled");
      document.getElementById("l_show_d")!.classList.add("disabled");
      (document.getElementById("show_d")! as HTMLInputElement).checked   = false; 
      (document.getElementById("show_d")! as HTMLInputElement).disabled  = true;
   }
});

document.getElementById("encryption")!.addEventListener("click",(e)=>{
   if((e!.target as HTMLInputElement).matches("#copy_d")){
       if(resultD() !== "IV is not 16 Characters" &&
         resultD() !== "Key is not 16 Characters" &&
         resultD() !== "Invalid Credentials"&&
         resultD() !== "") {
         navigator.clipboard.writeText(resultD());  
         showToast();
      } 
   }
});



import { TOTP } from "totp-generator";

const [sKey, setSkey]           = createSignal("");
const [otpRe, setOtpRe]         = createSignal("");
const [countDown, setCountDown] = createSignal("");

function updateCountDown(){
   const currentTime = Math.round(new Date().getTime() / 1000);
   const remainingSeconds = 30 - (currentTime % 30);
   setCountDown(remainingSeconds.toString().padStart(2, '0'));   
}
setInterval(updateCountDown, 1000)


document.getElementById("encryption")!.addEventListener("change",(e)=>{
   if ((e!.target as HTMLInputElement).matches("#enc")) {
      if ((e.target as HTMLInputElement).checked) {
         setSkey(fbPlainText());
      }
   }
   if ((e!.target as HTMLInputElement).matches("#dec")) {
      if ((e.target as HTMLInputElement).checked) {
         setSkey(resultD());
      }
   }
});

function activateVarif() {
   (document.getElementById("use_varif")! as HTMLInputElement).style.opacity = "1";
   (document.getElementById("use_varif_l")! as HTMLInputElement).style.opacity = "1";
   (document.getElementById("use_varif")! as HTMLInputElement).disabled  = false;
};

function deactivateVarif() {
   (document.getElementById("use_varif")! as HTMLInputElement).style.opacity = "0.6";
   (document.getElementById("use_varif_l")! as HTMLInputElement).style.opacity = "0.6";
   (document.getElementById("use_varif")! as HTMLInputElement).checked   = false; 
   (document.getElementById("use_varif")! as HTMLInputElement).disabled  = true;
};


document.getElementById("encryption")!.addEventListener("input",(e)=>{
   if((e!.target as HTMLInputElement).matches("#plain_text")){
      const value = (e!.target as HTMLInputElement).value;
      setSkey(value.toString());
      if(sKey() !== "" ) { activateVarif() } else {deactivateVarif()}
   }
   if((e!.target as HTMLInputElement).matches("#cipher_text, #key, #iv")){
      if ((document.getElementById("dec")! as HTMLInputElement).checked){
         setSkey(decrypt(key(), iv(), cipherText()));
         if(sKey() !== "IV is not 16 Characters" &&
            sKey() !== "Key is not 16 Characters" &&
            sKey() !== "Invalid Credentials" &&
            sKey() !== "") { activateVarif() } else {deactivateVarif()}
      }
   }
});

document.getElementById("encryption")!.addEventListener("change",(e)=>{
   if ((e!.target as HTMLInputElement).matches("#enc")) {
      if ((e.target as HTMLInputElement).checked) {
         if(sKey() !== "" && 
         (document.getElementById("auto_pass")! as HTMLInputElement).checked === false )
           { activateVarif() } else {deactivateVarif()}
      }
   }
   if ((e!.target as HTMLInputElement).matches("#dec")) {
      if ((e.target as HTMLInputElement).checked) {
         if(sKey() !== "IV is not 16 Characters" &&
            sKey() !== "Key is not 16 Characters" &&
            sKey() !== "Invalid Credentials" &&
            sKey() !== "") { activateVarif() } else {deactivateVarif()}
      }
   }
   if ((e!.target as HTMLInputElement).matches("#auto_pass")) {
      if ((e.target as HTMLInputElement).checked) {
         if ((document.getElementById("enc")! as HTMLInputElement).checked){ deactivateVarif() }
      } else {
         if(sKey() !== "" ) { activateVarif() } else { deactivateVarif() } 
      }
   }
});



function updateOtp() {
   createEffect(() => {
      try { const { otp, expires } = TOTP.generate(sKey());
         setOtpRe(otp.toString());
      } catch (error) {
         setOtpRe("The provided key is not valid.");   
      }
   });
}
setInterval(updateOtp, 1000);



createEffect(() => {
   if(otpRe() !== "The provided key is not valid." ){
      document.getElementById("varif_detail")!.textContent = "Varification Code:"
      document.getElementById("varif_detail_re")!.textContent = otpRe();

      document.getElementById("varif_hint")!.textContent = 
      "This code is valid for the next ".concat( countDown().toString(), " seconds.");
      document.getElementById("varif_copy_hint")!.textContent = "Tap to copy";
   } else {
      document.getElementById("varif_detail")!.textContent = otpRe();
      document.getElementById("varif_detail_re")!.textContent = "";
      document.getElementById("varif_hint")!.textContent = "";
      document.getElementById("varif_copy_hint")!.textContent = "";
   } 
});

document.getElementById("varification")!.addEventListener("click",(e)=>{
   if((e!.target as HTMLInputElement).matches(
      "#varif_detail ,#varif_detail_re, #varif_copy_hint")){
      if(otpRe() !== "The provided key is not valid." ){
      navigator.clipboard.writeText(otpRe());  
      showToast(); 
     }
  }
});



import { onMount } from 'solid-js';

let timeoutId: number | undefined;

function showToast() {
  const toastElement = document.getElementById('toast')!;
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



document.getElementById("generateQR")!.addEventListener("input",(e)=>{
   if((e!.target as HTMLInputElement).matches("#text_for_qr")){
      const value = (e!.target as HTMLInputElement).value;
      if (value === "") {
          document.getElementById("gqr")!.style.height = "0"
      } else {
      document.getElementById("gqr")!.style.height = "160px"
      QRCode.toCanvas(
         document.getElementById("gqr")!,
         value,
         { width: 160, margin: 1 },
         );
      }
   }
});


const [otpReO, setOtpReO] = createSignal("");
const [keyO, setKeyO] = createSignal("");

document.getElementById("varificationOnly")!.addEventListener("input",(e)=>{
   if((e!.target as HTMLInputElement).matches("#text_for_varif")){
      const value = (e!.target as HTMLInputElement).value;
      setKeyO(value.toString())
   }
});


function updateOtpO() {
   createEffect(() => {
      try { const { otp, expires } = TOTP.generate(keyO());
         setOtpReO(otp.toString());
      } catch (error) {
         setOtpReO("The provided key is not valid.");   
      }
   });
}
setInterval(updateOtpO, 1000);

createEffect(() => {
   if (keyO() === "") {
      document.getElementById("varif_detail_o")!.textContent = "";
      document.getElementById("varif_detail_re_o")!.textContent = "";
      document.getElementById("varif_hint_o")!.textContent = "";
      document.getElementById("varif_copy_hint_o")!.textContent = "";
   } else {
      if (otpReO() !== "The provided key is not valid.") {
         document.getElementById("varif_detail_o")!.textContent = "Varification Code:";
         document.getElementById("varif_detail_re_o")!.textContent = otpReO();

         document.getElementById("varif_hint_o")!.textContent =
            "This code is valid for the next ".concat(countDown().toString()," seconds.",);
         document.getElementById("varif_copy_hint_o")!.textContent = "Tap to copy"

         document.getElementById("varificationOnly")!.addEventListener("click", (e) => {
            if ((e!.target as HTMLInputElement).matches(
               "#varif_detail_o ,#varif_detail_re_o, #varif_copy_hint_o ",)) {
               navigator.clipboard.writeText(otpReO());
               showToast();
            }
         });
      } else {
         document.getElementById("varif_detail_o")!.textContent = otpReO();
         document.getElementById("varif_detail_re_o")!.textContent = "";
         document.getElementById("varif_hint_o")!.textContent = "";
         document.getElementById("varif_copy_hint_o")!.textContent = "";
      }
   }
});