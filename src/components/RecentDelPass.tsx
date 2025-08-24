import type { JSX } from "solid-js";
import type { ReadResultTypes } from "../utils/surrealdb-indexed";
import Menu from "./ui/Menu";
import DeleteMenu from './ui/DeleteMenu'


export function List(entry?: ReadResultTypes["RecentDelPass"]): JSX.Element {
  if (entry) {
    return (<>

    <li id={entry.id?.toString()} style="background-color: transparent;">
      <div>

        <small class="ellipsis"style="width: var(--size-xl2)">
          {entry.title || 'untitled'}
        </small>

        <button
          data-action="copy"
          class="not-prose ellipsis"
          style="text-align: start; width: var(--size-xl2);"
          id={entry.password ?? ''}>
          {entry.password ?? ''}</button>

      </div>

      <div class="flex-with-gap" style="justify-content: flex-end;">

        <Menu 
            trigger={
                <div class='text-as-button flex-center-childs' style="margin-right: calc(var(--size-sm0)* -1);" >
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="oklch(var(--gray-95))"/></svg>
                </div>
            }
            content={

                <menu class="glass subtle-shadow menu-horizontal" >
                    
                    <li>
                      <DeleteMenu  content= {
                        <button  data-action='delete' id={entry.id?.toString() ?? ''}>Delete</button>  
                      }></DeleteMenu>                          
                    </li>

                    <li>
                      <button 
                          class="not-prose flex-with-gap" 
                          style="color: oklch(var(--gray-95)); gap: var(--size-xs2);"
                          data-action="restore"
                          id={entry.id?.toString() ?? ''}> 
                          
                        <svg style="width: var(--size-sm3); height: var(--size-sm3); padding-top: 2px;" viewBox="0 0 24 24" fill="none" >
                          <path d="M4.75 2a.75.75 0 0 1 .743.648l.007.102v5.69l4.574-4.56a6.41 6.41 0 0 1 8.879-.179l.186.18a6.41 6.41 0 0 1 0 9.063l-8.846 8.84a.75.75 0 0 1-1.06-1.062l8.845-8.838a4.91 4.91 0 0 0-6.766-7.112l-.178.17L6.562 9.5h5.688a.75.75 0 0 1 .743.648l.007.102a.75.75 0 0 1-.648.743L12.25 11h-7.5a.75.75 0 0 1-.743-.648L4 10.25v-7.5A.75.75 0 0 1 4.75 2Z" />
                        </svg>

                        <div>Rstrore</div>
                        
                      </button>
                    </li>
                </menu>
            }
            offset={-5}
          >
          </Menu> 

     </div>
    </li>

    </>);

  } else {
    return (
      <>
        <small style="text-align: center; padding-block :var(--size-sm3)">No records found</small>
      </>
    );
  }
}

export function dialog(entry?: ReadResultTypes["PasswordEntry"]): JSX.Element {

    return (<>

        <small id={entry?.createdAt ?? ''} style="margin:0" > {entry?.title || 'untitled'}</small>      
        <div id={entry?.id?.toString() ?? ''} class="ellipsis" >{entry?.password ?? ''}</div>

    </>);
}