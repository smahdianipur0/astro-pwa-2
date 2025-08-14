import {count_characters } from "../pkg/rust_lib";
import { pass } from '../logic/pass';

const KeyIv = () => {

    let keyChars: HTMLSpanElement ;
    let ivChars: HTMLSpanElement ;

    return (<>
        <form autocomplete="off">
            <section style="position: relative;">

                <input type="text" name="Key" placeholder="Key" 
                    onInput={(e) => {
                        const value = (e!.target as HTMLInputElement).value;
                        pass.setKey(value.toString());
                        keyChars.textContent = count_characters(pass.get("key")).toString();
                      }}/>

                <span 
                    ref={(e) => keyChars = e } 
                    style={ ` ${chars} 
                    top :calc( (var(--size-md3) - var(--size-sm4)) / 2);`}></span> 


                <input type="text" name="IV" placeholder="IV" 
                    onInput={(e) => {
                        const value = (e!.target as HTMLInputElement).value;
                        pass.setIV(value.toString())
                        ivChars.textContent = count_characters(pass.get("iv")).toString();
                    }}/>

                <span 
                    ref={(e) => ivChars = e } 
                    style={ ` ${chars} 
                    bottom: calc( (var(--size-md3) - var(--size-sm4)) / 2);`} ></span>

            </section>
        </form>
    </>);
}

const chars = `position: absolute;
  right: var(--size-sm2);
  pointer-events: none;`

export default KeyIv;