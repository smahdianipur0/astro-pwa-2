
import { el } from "../utils/elementUtils";
import { pass } from '../logic/pass';
import { showToast } from "../logic/misc.ts";
import { dbCreate,dbUpdate,dbDelete, getEntryById } from "../utils/surrealdb-indexed";
import { tempList } from "../logic/tempList.ts" 



(async () => {
  document.getElementById("TempList")!.classList.remove('blink');

  const inputGroup     = (await el.wait("#input-group"))      as HTMLElement;
  const entriesList    = (await el.wait("#TempList-list"))     as HTMLElement;
  const passwordInput  = (await el.wait("#TempList-inputs-password"))   as HTMLInputElement;
  const titleInput     = (await el.wait("#TempList-inputs-title"))      as HTMLInputElement;
  const addEntryButton = (await el.wait("#TempList-inputs-add")) as HTMLButtonElement;
  const searchInputEl  = (await el.wait("#TempList-search-input"))     as HTMLInputElement;

  
  document.getElementById("TempList-search")!.addEventListener("input",(e)=>{
    if((e!.target as HTMLInputElement).matches("#TempList-search-input")){
       tempList.setSearchInput((e!.target as HTMLInputElement).value)
    }
  });

  document.getElementById("TempList-search")!.addEventListener("click",(e)=>{
    if((e!.target as HTMLInputElement).matches("#TempList-search-cancel")){
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

    fragment.append(el.c("small", {textContent: "No records found",  
      style:"text-align: center; padding-block :var(--size-sm3)" }));

  } else {

    (tempList.get("isSearching") ? tempList.get("searchArray")  : (tempList.get("entries") ?? [])
    .sort((a, b) => new Date(b.crreatedAt).getTime() - new Date(a.crreatedAt).getTime())).
    forEach((entry) => {

      fragment.append(
        el.c('li', {style:"background-color:transparent;", append: [
          el.c('div', {append: [

            el.c('small', { className: 'ellipsis', 
              style: "width: var(--size-xl2)",
              textContent: entry.title || 'untitled'}),

            el.c('button', {dataset: {action: 'copy'}, 
              className: 'not-prose ellipsis',
              style:"text-align: start; width: var(--size-xl2);",
              id: entry.password ?? '',
              textContent: entry.password ?? ''})
          ]}),

          el.c('div', {className: 'not-prose s-container',append: [

            el.c('details', { 
              name: 'delete-item', 
              className: 'right-to-left',
              append: [
                el.c('summary',{ className: 'right-to-left' }), 
                el.c('button', { dataset: {action: 'delete'},
                  id: entry.id ?? '',
                  textContent: ' Delete'}),
              ]
            }),

            el.c('button', { dataset: {action: 'update'},id: entry.id ?? '', append: [
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
        await dbDelete(deleteButton.id)
        tempList.updateEntries();
      })();
    }

  //update
  const updateButton = (e!.target as HTMLInputElement).closest("[data-action='update']");
  if (updateButton) {
    (async () => {
      (document.getElementById("TempList-update") as HTMLDialogElement).showModal();
        const entry = await getEntryById("PasswordEntry", updateButton.id);
        if (entry) {
          const { title, password } = entry;
          (document.getElementById("TempList-update-title") as HTMLInputElement).value = title;
          (document.getElementById("TempList-update-pass") as HTMLInputElement).value = password;
          (document.getElementById("TempList-update") as HTMLDialogElement).setAttribute("data-_", updateButton.id);

        }
    })();
  };

  // update dialog confirm
  document.getElementById("TempList-update")!.addEventListener("click", (e) => {
    if((e!.target as HTMLInputElement).matches("#TempList-update-ok")) {
      (async () => {
      dbUpdate("PasswordEntry:update", {
        id: (document.getElementById("TempList-update") as HTMLDialogElement).dataset._!, 
        title:(document.getElementById("TempList-update-title") as HTMLInputElement).value, 
        password:(document.getElementById("TempList-update-pass") as HTMLInputElement).value});
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
    if ((e!.target as HTMLInputElement).matches("#TempList-inputs-add")) {
      (async () => {
        await dbCreate("PasswordEntry:create", {
          title:tempList.get("title"),
          password: tempList.get("password"),
          crreatedAt: new Date().toISOString()
        });
        tempList.setTitle("")
        if ((document.getElementById("TempList-inputs-auto-pass") as HTMLInputElement).checked){
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
    if ((e!.target as HTMLInputElement).matches("#TempList-inputs-auto-pass")) {
      if ((e.target as HTMLInputElement).checked) {
    passwordInput.readOnly = false;
    tempList.setPassword("")
      } else {
        passwordInput.readOnly = true;
        tempList.setPassword(pass.get("Password"))
      }
   }
  });

  // bind input values to signals
  inputGroup.addEventListener("input", (e) => {
    if ((e!.target as HTMLInputElement).matches("#TempList-inputs-title")) {
      tempList.setTitle((e!.target as HTMLInputElement).value);
    }
    if ((e!.target as HTMLInputElement).matches("#TempList-inputs-password")) {
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
  tempList.setPassword(pass.get("Password"));
  pass.on(["Password"], ({value}) => { tempList.setPassword(value)});

})();
