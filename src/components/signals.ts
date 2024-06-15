import { createSignal, createEffect } from 'solid-js';

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
      if(mpassword() === "") {
         document.getElementById("copyMPassword")!.classList.add("disabled")  
          } else {
         document.getElementById("copyMPassword")!.classList.remove("disabled") 
      }   
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
      document.getElementById("s2")!.textContent= "";
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




import { encrypt } from "../pkg/rust_lib";
import { decrypt } from "../pkg/rust_lib";
import { count_characters }  from "../pkg/rust_lib";

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
      if ((event.target as HTMLInputElement).checked) {
         document.getElementById("plain_text").readOnly = true;
         createEffect(() => { setPlainText(currentPass()) })
      } else {
         setPlainText(fbPlainText())
         document.getElementById("plain_text").readOnly = false;
      }
   }
});

import QRCode from 'qrcode'


createEffect(() => {
   setResultE(encrypt(key(), iv(), plainText()));
   document.getElementById("result_e")!.textContent = resultE();
   if (resultE() === "") {
      document.getElementById("result_e")!.textContent = "Enter Plain Text";
   }
   QRCode.toCanvas(
      document.getElementById("eqr")!,
      resultE(),
      { width: 160, margin: 1 },
      // function (error) { if (error) console.error(error);console.log("success!");},
   );
});

createEffect(() => {
   setResultD(decrypt(key(), iv(), cipherText()));
   document.getElementById("result_d")!.textContent = resultD();
   if (resultD() === "") {
      document.getElementById("result_d")!.textContent = "Enter Cipher Text";
   }
   QRCode.toCanvas(
      document.getElementById("dqr")!,
      resultD(),
      { width: 160, margin: 1 },
      // function (error) { if (error) console.error(error);console.log("success!");},
   );
});


createEffect(() => {
   if(resultE() !== "IV is not 16 Characters" &&
      resultE() !== "Key is not 16 Characters" &&
      resultE() !== "") {
      document.getElementById("copy_e")!.classList.remove("disabled");
      document.getElementById("l_show_e")!.classList.remove("disabled");
      document.getElementById("show_e").disabled  = false;
   } else{
      document.getElementById("copy_e")!.classList.add("disabled");
      document.getElementById("l_show_e")!.classList.add("disabled");
      document.getElementById("show_e").checked   = false; 
      document.getElementById("show_e").disabled  = true;
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
      document.getElementById("show_d").disabled  = false;
   } else{
      document.getElementById("copy_d")!.classList.add("disabled");
      document.getElementById("l_show_d")!.classList.add("disabled");
      document.getElementById("show_d").checked   = false; 
      document.getElementById("show_d").disabled  = true;
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



document.getElementById("encryption")!.addEventListener("input",(e)=>{
   if ((document.getElementById("enc")! as HTMLInputElement).checked) {
      if((e!.target as HTMLInputElement).matches("#plain_text")){
         const value = (e!.target as HTMLInputElement).value;
         setSkey(value.toString());
      }
   }
   if ((document.getElementById("dec")! as HTMLInputElement).checked) {
      if((e!.target as HTMLInputElement).matches("#cipher_text")){
         setSkey(decrypt(key(), iv(), cipherText()));
      }
   }
});

document.getElementById("encryption")!.addEventListener("change",(e)=>{
   if ((e!.target as HTMLInputElement).matches("#enc")) {
      if ((event.target as HTMLInputElement).checked) {
         setSkey(fbPlainText());
      }
   }
   if ((e!.target as HTMLInputElement).matches("#dec")) {
      if ((event.target as HTMLInputElement).checked) {
         setSkey(resultD());
      }
   }
});



function updateOtp() {
   createEffect(() => {
   try { 
      
      const { otp, expires } = TOTP.generate(sKey());
      setOtpRe(otp.toString());
   } catch (error) {
      setOtpRe("The provided key is not valid.");
   }
   document.getElementById("varif_detail_re")!.textContent = otpRe();
});
}
setInterval(updateOtp, 1000);




function updateCountDown(){
   const currentTime = Math.round(new Date().getTime() / 1000);
   const remainingSeconds = 30 - (currentTime % 30);
   setCountDown(remainingSeconds.toString().padStart(2, '0'));
   document.getElementById("varif_hint")!.textContent = countDown();
}
setInterval(updateCountDown, 1000)




import { onMount } from 'solid-js';

let timeoutId: number | undefined;

function showToast() {
  const toastElement = document.getElementById('toast');
  if (toastElement) {
    toastElement.style.top = '85dvh';
    timeoutId = window.setTimeout(() => {
      toastElement.style.top = '110dvh';
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