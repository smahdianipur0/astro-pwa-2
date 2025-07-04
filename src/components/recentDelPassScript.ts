import { dbCreate, dbDelete, dbReadAll, getEntryById } from "../utils/surrealdb-indexed";
import { el } from "../utils/elementUtils";
import { showToast } from "../logic/misc";
import { tempList } from "../logic/tempList.ts" 
import { render } from "solid-js/web"
import { List, dialog} from './RecentDelPass'


export async function restore(id:string){
    (document.getElementById("RecentDelPass-restore") as HTMLDialogElement).showModal();
    const entry = await getEntryById("RecentDelPass", id);  
    if (entry) {
        (document.getElementById("RecentDelPass-restore-item") as HTMLDialogElement).textContent = "";
        render(() => dialog(entry), document.getElementById("RecentDelPass-restore-item") as HTMLDialogElement);
    }
}

(async () => {
    const recentdellist  = (await el.wait("#RecentDelPass-list"))  as HTMLElement;

    tempList.updateRecentDelEntries();

    tempList.on(["recentDelEntries"], ({value}) => {
        recentdellist.textContent = '';

        if (value.length === 0){
            render(() => List(), recentdellist);
        } else {
            (value ?? [])
            .sort((a, b) => new Date(b.crreatedAt).getTime() - new Date(a.crreatedAt).getTime())
            .forEach((entry) => {
                render(() => List(entry), recentdellist);
            });
        }
    });


  // copy
  recentdellist.addEventListener("click", (e) => {
    const copyButton = (e!.target as HTMLInputElement).closest("[data-action='copy']");
    if (copyButton) {
      (async () => {
        navigator.clipboard.writeText(copyButton.id);  
         showToast();
      })();
    }
  });

  //confirm restore
  document.getElementById("RecentDelPass-restore")!.addEventListener("click", (e) => {
    if((e!.target as HTMLInputElement).matches("#RecentDelPass-restore-ok")) {
      (async () => {

      const title = document.getElementById("RecentDelPass-restore-item")?.children[0].textContent;
      const crreatedAt = document.getElementById("RecentDelPass-restore-item")?.children[0].id as string;

      const id = document.getElementById("RecentDelPass-restore-item")?.children[1].id as string;
      const password = document.getElementById("RecentDelPass-restore-item")?.children[1].textContent;


        if (title && password) {
          await dbCreate("PasswordEntry:create", {title:title, password:password, crreatedAt: crreatedAt });
          tempList.updateEntries();

          await dbDelete(id);
          tempList.updateRecentDelEntries();
        }
      })();
    }
  });
})();
  