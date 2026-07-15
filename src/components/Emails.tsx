import type { ReadAllResultTypes } from "../utils/surrealdb-indexed"
import Popover from "./ui/Popover";
import DeleteMenu from './ui/DeleteMenu'
import { showToast } from "../logic/misc";
import { email } from "../logic/email";


const EmailsList = (entries:ReadAllResultTypes["Emails"], isEditing:boolean) => {

    return(<>
        {entries.length !== 0 && ( entries.map((entry) => (
            <li  
                data-swapy-slot={entry.createdAt}
                style='width: 100%; 
                background-color:transparent; 
                padding-inline: 0;'>  

                <div data-swapy-item={entry.id} class="HStack" style="height: var(--size-sm4); --gap:0">

                    <div>
                        <button 
                            class="not-prose ellipsis" 
                            onClick={() => { 
                                navigator.clipboard.writeText(entry.email ?? "");
                                showToast();
                            }}
                            style={`text-align: start; 
                            width: ${isEditing ? " var(--size-xl2) ;" : "calc(var(--size-xl4) - var(--size-sm2));"};
                            font-weight: 700;
                            color: oklch(var(--gray-95));
                            padding: var(--padding-0);
                            padding-inline: 0;`}>
                            {entry.email ?? ''} </button>
                    </div>

                    {isEditing && <div class="HStack slide-in-right">

                        <div class="HStack">
                            <Popover 
                                trigger={
                                    <div class='text-as-button ZStack' style="margin-right: calc(var(--size-sm0)* -1);" >
                                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="oklch(var(--gray-95))"/></svg>
                                    </div>
                                }
                            >
                                <menu class="glass subtle-shadow menu-horizontal">
                                    <li>
                                        <DeleteMenu  content= {
                                            <button   onClick={() => entry.id && email.deleteEmail(entry.id)}>Delete</button>  
                                        }></DeleteMenu>                                
                                    </li>
                                </menu>
                            </Popover>                  
                        </div>

                        <div data-swapy-handle style="width: var(--size-md2);display: flex;justify-content: flex-end;" > 
                            <div class="swapy-handle"></div> 
                        </div>

                    </div> }
                </div>
            </li> 
        )))}
    </>);
}

export default EmailsList