
import { el } from "../utils/elementUtils";
import { pass } from '../logic/pass';
import { showToast } from "../logic/misc.ts";
import { dbCreate,dbUpdate,dbDelete, getEntryById } from "../utils/surrealdb-indexed";
import { tempList } from "../logic/tempList.ts" 



(async () => {
  document.getElementById("add-drawer-trigger")!.classList.remove('blink');

  const inputGroup     = (await el.wait("#input-group"))      as HTMLElement;
  const entriesList    = (await el.wait("#entries-list"))     as HTMLElement;
  const passwordInput  = (await el.wait("#password-input"))   as HTMLInputElement;
  const titleInput     = (await el.wait("#title-input"))      as HTMLInputElement;
  const addEntryButton = (await el.wait("#add-entry-button")) as HTMLButtonElement;
  const searchInputEl  = (await el.wait("#search-input"))     as HTMLInputElement;

  
  document.getElementById("search-box")!.addEventListener("input",(e)=>{
    if((e!.target as HTMLInputElement).matches("#search-input")){
       tempList.setSearchInput((e!.target as HTMLInputElement).value)
    }
  });

  document.getElementById("search-box")!.addEventListener("click",(e)=>{
    if((e!.target as HTMLInputElement).matches("#cancel-search")){
      searchInputEl.value = '';
      tempList.setSearchInput('');
      tempList.setIsSearching(false)
    }
  });

  searchInputEl.addEventListener("focus", (e) => {tempList.setIsSearching(true);});
  searchInputEl.addEventListener("blur", (e) => {tempList.setIsSearching(tempList.get("searchInput").trim() !== "")});


// render entries based on signal
tempList.on(["isSearching", "searchArray", "entries"], pl => {

  entriesList.textContent = '';
  const fragment = document.createDocumentFragment();
  if (
    tempList.get("isSearching") ? tempList.get("searchArray").length === 0 : tempList.get("entries").length === 0) { 

    fragment.append(el.c("p", {textContent: "No records found", 
      className:"hint", 
      style:"padding-block :var(--size-sm3)" }));

  } else {

    (tempList.get("isSearching") ? tempList.get("searchArray")  : (tempList.get("entries") ?? [])
    .sort((a, b) => new Date(b.crreatedAt).getTime() - new Date(a.crreatedAt).getTime())).
    forEach((entry) => {

      fragment.append(
        el.c('div', { className: 'entry-item', append: [
          el.c('div', {append: [

            el.c('p', { className: 'hint ellipsis', 
              style: "width: var(--size-xl2)",
              textContent: entry.title || 'untitled'}),

            el.c('button', {dataset: {action: 'copy'}, 
              className: 'ellipsis',
              style:"text-align: start; width: var(--size-xl2);",
              id: entry.password ?? '',
              textContent: entry.password ?? ''})
          ]}),

          el.c('div', {className: 's-container',append: [

            el.c('details', { 
              name: 'delete-item', 
              className: 'right-to-left',
              append: [
                el.c('summary',{ className: 'right-to-left' }), 
                el.c('button', { dataset: {action: 'delete'},
                  id: entry.id?.id ?? '',
                  textContent: ' Delete'}),
              ]
            }),

            el.c('button', { dataset: {action: 'update'},id: entry.id?.id ?? '', append: [
              el.d("svg", { style: "width: var(--size-sm3); height: var(--size-sm3);",viewBox: "0 0 24 24", fill: "none",append: 
                el.d("path", {d: "M21.03 2.97a3.578 3.578 0 0 1 0 5.06L9.062 20a2.25 2.25 0 0 1-.999.58l-5.116 1.395a.75.75 0 0 1-.92-.921l1.395-5.116a2.25 2.25 0 0 1 .58-.999L15.97 2.97a3.578 3.578 0 0 1 5.06 0ZM15 6.06 5.062 16a.75.75 0 0 0-.193.333l-1.05 3.85 3.85-1.05A.75.75 0 0 0 8 18.938L17.94 9 15 6.06Zm2.03-2.03-.97.97L19 7.94l.97-.97a2.079 2.079 0 0 0-2.94-2.94Z"})
              })
            ]}),
          ]})
        ]})
      );
    });
  };
  
  entriesList.append(fragment);
});


  // delete entry
  entriesList.addEventListener("click", (e) => {
    const deleteButton = (e!.target as HTMLInputElement).closest("[data-action='delete']");
    if (deleteButton) {
      (async () => {
        const entry = await getEntryById("PasswordEntry", deleteButton.id);
        if (entry) {
          const { title, password,crreatedAt  } = entry;
          await dbCreate("RecentDelPass:create", {title: title, password: password, crreatedAt: crreatedAt });         
          tempList.updateRecentDelEntries();
        }
        await dbDelete("PasswordEntry:delete", deleteButton.id)
        tempList.updateEntries();
      })();
    }

  //update
  const updateButton = (e!.target as HTMLInputElement).closest("[data-action='update']");
  if (updateButton) {
    (async () => {
      (document.getElementById("edit-temp-list-dialog") as HTMLDialogElement).showModal();
        const entry = await getEntryById("PasswordEntry", updateButton.id);
        if (entry) {
          const { title, password } = entry;
          (document.getElementById("updating-temp-title-input") as HTMLInputElement).value = title;
          (document.getElementById("updating-temp-pass-input") as HTMLInputElement).value = password;
          (document.getElementById("edit-temp-list-dialog") as HTMLDialogElement).setAttribute("data-_", updateButton.id);

        }
    })();
  };

  // update dialog confirm
  document.getElementById("edit-temp-list-dialog")!.addEventListener("click", (e) => {
    if((e!.target as HTMLInputElement).matches("#update-temp-list-entry")) {
      (async () => {
      dbUpdate("PasswordEntry:update", {
        id: (document.getElementById("edit-temp-list-dialog") as HTMLDialogElement).dataset._!, 
        title:(document.getElementById("updating-temp-title-input") as HTMLInputElement).value, 
        password:(document.getElementById("updating-temp-pass-input") as HTMLInputElement).value});
      tempList.updateEntries();
      })();
    }
  });

  // copy password
  const copyButton = (e!.target as HTMLInputElement).closest("[data-action='copy']");
  if (copyButton) {
    (async () => {
      navigator.clipboard.writeText(copyButton.id);  
       showToast();
    })();
  }
  });

  // add entry
    inputGroup.addEventListener("click", (e) => {
    if ((e!.target as HTMLInputElement).matches("#add-entry-button")) {
      (async () => {
        await dbCreate("PasswordEntry:create", {
          title:tempList.get("title"),
          password: tempList.get("password"),
          crreatedAt: new Date().toISOString()
        });
        tempList.setTitle("")
        if ((document.getElementById("auto-pass-entry") as HTMLInputElement).checked){
          tempList.setPassword("");
        }
        tempList.updateEntries();
        addEntryButton.style.setProperty("--primary", "65% 0.12 174"); 
        addEntryButton.textContent= "Added";
        setTimeout(() => {
          addEntryButton.style.removeProperty("--primary");
          addEntryButton.textContent= "Add";
        }, 1000);

      })();
    }

    // auto-pass entry
    if ((e!.target as HTMLInputElement).matches("#auto-pass-entry")) {
      if ((e.target as HTMLInputElement).checked) {
    passwordInput.readOnly = false;
    tempList.setPassword("")
      } else {
        passwordInput.readOnly = true;
        tempList.setPassword(pass.get("rPassword"))
      }
   }
  });

  // bind input values to signals
  inputGroup.addEventListener("input", (e) => {
    if ((e!.target as HTMLInputElement).matches("#title-input")) {
      tempList.setTitle((e!.target as HTMLInputElement).value);
    }
    if ((e!.target as HTMLInputElement).matches("#password-input")) {
      tempList.setPassword((e!.target as HTMLInputElement).value);
    }
  });

  // bind signals to input values
  tempList.on(["title"], ({value}) => { titleInput.value = value})

  tempList.on(["password"], ({value}) => { 
    passwordInput.value = value;
    addEntryButton.disabled = (!value)
  });

  // initilize 
  tempList.updateEntries();
  tempList.setPassword(pass.get("rPassword"));
  pass.on(["rPassword"], ({value}) => { tempList.setPassword(value)});

})();
