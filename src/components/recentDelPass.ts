import { dbCreate, dbDelete, dbReadAll, getEntryById } from "../utils/surrealdb-indexed";
import { el } from "../utils/elementUtils";
import { showToast } from "../logic/misc";
import { tempList } from "../logic/tempList.ts" 


(async () => {

  const recentdellist  = (await el.wait("#recent-del-list"))  as HTMLElement;

  tempList.updateRecentDelEntries();

  tempList.on(["recentDelEntries"], ({value}) => {
    recentdellist.textContent = '';
    const fragment = document.createDocumentFragment();

    if (value.length === 0){
      fragment.append(el.c("p", {textContent: "No records found", 
        className:"hint",
        style:"padding-block:var(--size-sm3)" }));
    } else {
    
    (value ?? [])
    .sort((a, b) => new Date(b.crreatedAt).getTime() - new Date(a.crreatedAt).getTime())
    .forEach((entry) => {
      fragment.append(
        el.c('div', { className: 'entry-item',append: [
          el.c('div', { append: [

            el.c('p', { className: 'hint ellipsis',
              style: "width:var(--size-xl2)",
              textContent: entry.title || 'untitled'}),

            el.c('button', { dataset: {action: 'copy'},
              className: 'ellipsis',
              style:"text-align: start; width:var(--size-xl2);",
              id: entry.password ?? '',
              textContent: entry.password ?? ''})

          ]}),

          el.c('div', { className: 's-container',append: [
            el.c('details', {
              name: 'delete-item',
              className: 'right-to-left',
              append: [

                el.c('summary', { className: 'right-to-left',}),

                el.c('button', {dataset: {action: 'delete'},
                  id: entry.id?.split(":")[1] ?? '',
                  textContent: ' Delete'})
              ]
            }), 
            el.c('button',{dataset: { action: 'restore'},id: entry.id?.split(":")[1] ?? '', append: [
              el.d("svg", { style: "width: var(--size-sm3); height: var(--size-sm3);",viewBox: "0 0 24 24", fill: "none",append: 
                el.d("path", {d: "M4.75 2a.75.75 0 0 1 .743.648l.007.102v5.69l4.574-4.56a6.41 6.41 0 0 1 8.879-.179l.186.18a6.41 6.41 0 0 1 0 9.063l-8.846 8.84a.75.75 0 0 1-1.06-1.062l8.845-8.838a4.91 4.91 0 0 0-6.766-7.112l-.178.17L6.562 9.5h5.688a.75.75 0 0 1 .743.648l.007.102a.75.75 0 0 1-.648.743L12.25 11h-7.5a.75.75 0 0 1-.743-.648L4 10.25v-7.5A.75.75 0 0 1 4.75 2Z",})
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
        tempList.updateRecentDelEntries();
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

            el.c('p', { className: 'hint', style:"margin:0",
              id: entry.crreatedAt ?? '',
              textContent: entry.title || 'untitled'}),

            el.c('div', { className: 'ellipsis' ,style:"text-align: start",
              id: entry.id?.split(":")[1] ?? '',
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
          tempList.updateEntries();

          await dbDelete("RecentDelPass:delete", id);
          tempList.updateRecentDelEntries();
        }
      })();
    }
  });
})();
  
