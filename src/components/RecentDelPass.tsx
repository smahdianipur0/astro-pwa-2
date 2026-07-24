import type { ReadResultTypes, ReadAllResultTypes } from "../utils/surrealdb-indexed";
import Popover from "./ui/Popover";
import DeleteMenu from './ui/DeleteMenu'
import { showToast } from "../components/ui/toast.ts";
import { tempList } from "../logic/tempList";


function openRestoreDialog(entry: ReadResultTypes["RecentDelPass"]) {
  (document.getElementById("RecentDelPass-restore-item") as HTMLElement).dataset.id = entry.id?.toString() ?? "";
  (document.getElementById("RecentDelPass-restore-item") as HTMLElement).dataset.date = entry.createdAt ?? "";
  (document.getElementById("RecentDelPass-restore-item-title")    as HTMLElement).textContent = entry.title;
  (document.getElementById("RecentDelPass-restore-item-password") as HTMLElement).textContent = entry.password;
  (document.getElementById("RecentDelPass-restore")    as HTMLDialogElement).showModal()
}


const RecentDelPassItems = (entries: ReadAllResultTypes["RecentDelPass"] | [])=> {
  return (
    <>
      {entries.length === 0 ? (
        <small style="text-align: center; padding-block: var(--size-sm3)"> No records found </small>
      ):(
    
      entries.map((entry) => (
        <li style="background-color: transparent;">
          <div>

            <small class="ellipsis"style="width: var(--size-xl2)">
              {entry.title || 'untitled'}
            </small>

            <button  class="not-prose ellipsis"
            style="text-align: start; width: var(--size-xl2);"
            onClick={() => {
                navigator.clipboard.writeText(entry.password ?? "");
                showToast();
              }}
            > {entry.password ?? ''}</button>

          </div>

          <div class="ZStack" style="justify-content: flex-end;">

            <Popover 
              trigger={
                  <div class='text-as-button ZStack' style="margin-right: calc(var(--size-sm0)* -1);" >
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="oklch(var(--gray-95))"/></svg>
                  </div>
              }
            >
              <menu class="glass subtle-shadow menu-horizontal" >
                <li>
                  <DeleteMenu  content= {
                    <button onClick={() => entry.id && tempList.deleteRecentDelEntris(entry.id)}>Delete</button>  
                  }></DeleteMenu>                          
                </li>

                <li>
                  <button  class="not-prose HStack" 
                    style="color: oklch(var(--gray-95)); gap: var(--size-xs2);"
                    onClick={() => openRestoreDialog(entry)}> 
                    
                    <svg style="width: var(--size-sm3); height: var(--size-sm3); padding-top: 2px;" viewBox="0 0 24 24" fill="none" >
                      <path d="M4.75 2a.75.75 0 0 1 .743.648l.007.102v5.69l4.574-4.56a6.41 6.41 0 0 1 8.879-.179l.186.18a6.41 6.41 0 0 1 0 9.063l-8.846 8.84a.75.75 0 0 1-1.06-1.062l8.845-8.838a4.91 4.91 0 0 0-6.766-7.112l-.178.17L6.562 9.5h5.688a.75.75 0 0 1 .743.648l.007.102a.75.75 0 0 1-.648.743L12.25 11h-7.5a.75.75 0 0 1-.743-.648L4 10.25v-7.5A.75.75 0 0 1 4.75 2Z" />
                    </svg>

                    <div>Rstrore</div>
                    
                  </button>
                </li>
              </menu>
            </Popover> 
          </div>
        </li>
      ))
    )}
  </>)
}
export default RecentDelPassItems