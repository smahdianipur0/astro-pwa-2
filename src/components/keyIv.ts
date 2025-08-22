import { count_characters } from "../pkg/rust_lib";
import { pass } from '../logic/pass';
import { el } from "../utils/elementUtils";


(async () => {
    const keyIv  = (await el.wait("#KeyIv"))  as HTMLElement;
 
    keyIv.addEventListener("input",(e)=>{
        if((e!.target as HTMLInputElement).matches("#KeyIv-k-input")){
            const value = (e!.target as HTMLInputElement).value;
            pass.setKey(value.toString())
            document.getElementById("KeyIv-k-chars")!.textContent = count_characters(pass.get("key"));
        }
        if((e!.target as HTMLInputElement).matches("#KeyIv-i-input")){
            const value = (e!.target as HTMLInputElement).value;
            pass.setIV(value.toString())
            document.getElementById("KeyIv-i-chars")!.textContent = count_characters(pass.get("iv"));
        }
    });

})();

