import { dbCreate, dbDelete, dbReadAll, getEntryById } from "../utils/surrealdb-indexed";
import { element } from "../utils/elementUtils";
import { showToast } from "../components/homeLogic";
import {  createEffect } from "solid-js";
import {listEntries,  setListEntries,
        listRecentDel,setListRecentDel,} from '../logic/tempList'

(async () => {

  const recentdellist  = (await element.wait("#recent-del-list"))  as HTMLElement;

    // render recent deleted entries based on signal
  createEffect(() => {
    recentdellist.textContent = '';
    const fragment = document.createDocumentFragment();

    if (listRecentDel().length === 0){
      fragment.append(element.configure("p", {textContent: "No records found", 
        className:"hint",
        style:"padding-block:var(--gap-x04)" }));
    } else {
    
    (listRecentDel() ?? [])
    .sort((a, b) => new Date(b.crreatedAt).getTime() - new Date(a.crreatedAt).getTime())
    .forEach((entry) => {
      fragment.append(
        element.configure('div', { className: 'entry-item',append: [
          element.configure('div', { append: [

            element.configure('p', { className: 'hint ellipsis',
              style: "width:20ch",
              textContent: entry.title || 'untitled'}),

            element.configure('button', { dataset: {action: 'copy'},
              className: 'ellipsis',
              style:"text-align: start; width: 19ch;",
              id: entry.password ?? '',
              textContent: entry.password ?? ''})

          ]}),

          element.configure('div', { className: 's-container',append: [
            element.configure('details', {
              name: 'delete-item',
              className: 'right-to-left',
              append: [

                element.configure('summary', { className: 'right-to-left',}),

                element.configure('button', {dataset: {action: 'delete'},
                  id: entry.id?.id ?? '',
                  textContent: ' Delete'})
              ]
            }), 
            element.configure('button',{dataset: { action: 'restore'},id: entry.id?.id ?? '', append: [
              element.draw("svg", { style: "width: var(--gap-x04); height: var(--gap-x04);",viewBox: "0 0 24 24", fill: "none",append: 
                element.draw("path", {d: "M4.75 2a.75.75 0 0 1 .743.648l.007.102v5.69l4.574-4.56a6.41 6.41 0 0 1 8.879-.179l.186.18a6.41 6.41 0 0 1 0 9.063l-8.846 8.84a.75.75 0 0 1-1.06-1.062l8.845-8.838a4.91 4.91 0 0 0-6.766-7.112l-.178.17L6.562 9.5h5.688a.75.75 0 0 1 .743.648l.007.102a.75.75 0 0 1-.648.743L12.25 11h-7.5a.75.75 0 0 1-.743-.648L4 10.25v-7.5A.75.75 0 0 1 4.75 2Z",})
              })
            ]}),          
          ]})
        ]})
      );
    });
  }
    
    recentdellist.append(fragment);
  });

  // delete recent deleted entry
  recentdellist.addEventListener("click", (e) => {
    const deleteButton = (e!.target as HTMLInputElement).closest("[data-action='delete']");
    if (deleteButton) {
      (async () => {
        await dbDelete("RecentDelPass:delete", deleteButton.id);
        await setListRecentDel(await dbReadAll("RecentDelPass") ?? []);
      })();
    }
    const copyButton = (e!.target as HTMLInputElement).closest("[data-action='copy']");
    if (copyButton) {
      (async () => {
        navigator.clipboard.writeText(copyButton.id);  
         showToast();
      })();
    }
    const restoreButton = (e!.target as HTMLInputElement).closest("[data-action='restore']");
    if (restoreButton) {
      (async() => {
        (document.getElementById("restore-dialog") as HTMLDialogElement).showModal();
        const entry = await getEntryById("RecentDelPass", restoreButton.id);  
        console.log(entry)
        if (entry) {
          (document.getElementById("restore-list") as HTMLDialogElement).textContent = "";
          (document.getElementById("restore-list") as HTMLDialogElement)!.append(

            element.configure('p', { className: 'hint', style:"margin:0",
              id: entry.crreatedAt ?? '',
              textContent: entry.title || 'untitled'}),

            element.configure('div', { className: 'ellipsis' ,style:"text-align: start",
              id: entry.id?.id ?? '',
              textContent: entry.password ?? ''})
          );
        }
      })();
    }
  });


  document.getElementById("restore-dialog")!.addEventListener("click", (e) => {
    if((e!.target as HTMLInputElement).matches("#confirm-restore")) {
      (async () => {

      const title = document.getElementById("restore-list")?.children[0].textContent;
      const crreatedAt = document.getElementById("restore-list")?.children[0].id as string;

        const id = document.getElementById("restore-list")?.children[1].id as string;
      const password = document.getElementById("restore-list")?.children[1].textContent;

        console.log(id,title, password);

        if (title && password) {
          await dbCreate("PasswordEntry:create", {title:title, password:password, crreatedAt: crreatedAt });
          setListEntries(await dbReadAll("PasswordEntry") ?? []);

          await dbDelete("RecentDelPass:delete", id);
          setListRecentDel(await dbReadAll("RecentDelPass") ?? []);
        }
      })();
    }
  });
})();
  
