import type { JSX } from "solid-js";
import type { ReadResultTypes } from "../utils/surrealdb-indexed"
import Menu from "./ui/Menu";
import DeleteMenu from './ui/DeleteMenu'


export function Emails(entry:ReadResultTypes["Emails"], isEditing:boolean): JSX.Element {

    return(<>

        <li  
            data-swapy-slot={entry.crreatedAt}
            style='width: 100%; 
            background-color:transparent; 
            padding-inline: 0;'>  

            <div data-swapy-item={entry.id} class="flex-spread-childs max-width" style="height: var(--size-sm4);">

                <div>
                    <button 
                        id = {entry.email ?? ''}
                        data-action='copy' 
                        class="not-prose ellipsis" 
                        style={`text-align: start; 
                        width: ${isEditing ? " calc(var(--size-xl2) - var(--size-sm2))" : "var(--size-xl3)"};
                        font-weight: 600;
                        color: oklch(var(--gray-95));
                        padding: var(--padding-0);
                        padding-inline: 0;`}>
                        {entry.email ?? ''} </button>
                </div>

                {isEditing && <div class="flex-spread-childs slide-in-right">

                    <div class="flex-with-gap" style="justify-content: flex-end;">
                        <Menu 
                            trigger={
                                <div class='text-as-button flex-center-childs' style="margin-right: calc(var(--size-sm0)* -1);" >
                                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="oklch(var(--gray-95))"/></svg>
                                </div>
                            }
                            content={
                                <menu class="glass subtle-shadow menu-horizontal">
                                    <li>
                                        <DeleteMenu  content= {
                                            <button  data-action='delete' id={entry.id?.toString() ?? ''}>Delete</button>  
                                        }></DeleteMenu>                                
                                    </li>
                                </menu>
                            }
                            offset={-5}
                        >
                        </Menu>                  
                    </div>

                    <div data-swapy-handle style="width: var(--size-md2);display: flex;justify-content: flex-end;" > 
                        <div class="swapy-handle"></div> 
                    </div>

                </div> }
            </div>
        </li> 
    </>);
}