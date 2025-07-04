import type { JSX } from "solid-js";
import  type { ReadResultTypes } from "../utils/surrealdb-indexed"
import Menu from "./ui/Menu";
import DeleteMenu from './ui/DeleteMenu'
import { email } from '../logic/email'


export function Emails(entry:ReadResultTypes["Emails"]): JSX.Element {

    return(<>
        
        <li style='width: 100%; background-color:transparent; padding-inline: 0;'>
            <div>
                <button 
                    id = {entry.email ?? ''}
                    data-action='copy' 
                    class="not-prose ellipsis" 
                    style='text-align: start; 
                    width: var(--size-xl2); 
                    color: oklch(var(--gray-95))'>
                    {entry.email ?? ''} </button>
            </div>

            <div class="not-prose s-container">
                <Menu 
                    trigger={
                        <div class='text-as-button flex-center-childs' style="margin-right: calc(var(--size-sm0)* -1);" >
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="oklch(var(--gray-95))"/></svg>
                        </div>
                    }
                    content={
                        <menu id={`menu-${entry.id?.toString()}`} class="glass" style="font-size:var(--font-sm1)">
                            <li>
                                <DeleteMenu
                                    content= {
                                        <button onClick={() =>{ 
                                        email.addDelete(entry.id?.toString() ?? '');
                                        document.getElementById(`menu-${entry.id?.toString()}`)?.remove();
                                    }} >Delete</button>  
                                    }
                                 ></DeleteMenu>                                
                            </li>
                        </menu>
                    }
                    offset={-10}
                >
                </Menu>                  
            </div>                
        </li>
    </>);
}