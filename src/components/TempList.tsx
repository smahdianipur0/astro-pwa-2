import type { JSX } from "solid-js";
import type { ReadResultTypes } from "../utils/surrealdb-indexed";
import Menu from "./ui/Menu";
import DeleteMenu from './ui/DeleteMenu'


export function Templist(entry?: ReadResultTypes["PasswordEntry"]): JSX.Element {
  if (entry) {
    return (
      <>
        <li style="background-color:transparent;">
          <div>
            <small class="ellipsis" style="width: var(--size-xl2)">
              {entry.title || "untitled"}
            </small>
            <button
              data-action="copy"
              class="not-prose ellipsis"
              style="text-align: start; width: var(--size-xl2);"
              id={entry.password ?? ""}
            >
              {entry.password ?? ""}
            </button>
          </div>

          <div class="not-prose s-container">
          <Menu 
            trigger={
                <div class='text-as-button flex-center-childs' style="margin-right: calc(var(--size-sm0)* -1);" >
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="oklch(var(--gray-95))"/></svg>
                </div>
            }
            content={

                <menu  id={`menu-${entry.id?.toString()}`}  class="glass" style="flex-direction:row; font-size:var(--font-sm1)">
                    <li style="margin-bottom: var(--size-xs3);">
                      <DeleteMenu  content= {
                        <button  data-action='delete' id={entry.id ?? ''}>Delete</button>  
                      }></DeleteMenu> 
                    </li>
                    <li>
                        <button 
                            class="not-prose flex-with-gap" 
                            style="margin-inline: var(--size-xs3);
                            color: oklch(var(--gray-95));
                            height: var(--size-sm3);"
                            data-action='update'
                            id={entry.id ?? ''}>
                            Update

                            <svg style="width: var(--size-sm3); height: var(--size-sm3);" viewBox="0 0 24 24"fill="none">
                                <path d="M21.03 2.97a3.578 3.578 0 0 1 0 5.06L9.062 20a2.25 2.25 0 0 1-.999.58l-5.116 1.395a.75.75 0 0 1-.92-.921l1.395-5.116a2.25 2.25 0 0 1 .58-.999L15.97 2.97a3.578 3.578 0 0 1 5.06 0ZM15 6.06 5.062 16a.75.75 0 0 0-.193.333l-1.05 3.85 3.85-1.05A.75.75 0 0 0 8 18.938L17.94 9 15 6.06Zm2.03-2.03-.97.97L19 7.94l.97-.97a2.079 2.079 0 0 0-2.94-2.94Z" />
                            </svg>

                        </button>
                    </li>
                </menu>
            }
            offset={-10}
          >
          </Menu>  

          </div>
        </li>
      </>
    );
  } else {
    return (
      <>
        <small style="text-align: center; padding-block :var(--size-sm3)">No records found</small>
      </>
    );
  }
}
