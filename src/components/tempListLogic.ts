import {
	dbCreate,
	dbUpdate,
	dbDelete,
	dbReadAll,
	getEntryById,
	type ReadAllResultTypes
} from "../utils/surrealdb-indexed";
import { element } from "../utils/elementUtils";
import { password, showToast } from "../components/homeLogic.ts";
import { createSignal, createEffect } from "solid-js";
import Fuse from 'fuse.js'



// signals
const [listTitle, setListTitle]       = createSignal('');
const [listPassword, setListPassword] = createSignal('');
const [listEntries, setListEntries]   = createSignal<ReadAllResultTypes["PasswordEntry"]>([]);

const [updtingEntry, setUpdtingEntry]                     = createSignal('');
const [updatingListEntryTitle, setUpdatingListEntryTitle] = createSignal('');
const [updatingListEntryPass, setUpdatingListEntryPass]   = createSignal('');

const [searchInput, setSearchInput]     = createSignal("");
const [isSearching, setIsSearching]     = createSignal(false);
const [searchArray, setSearchArray]     = createSignal<ReadAllResultTypes["PasswordEntry"]>([]);
const [listRecentDel, setListRecentDel] = createSignal<ReadAllResultTypes["PasswordEntry"]>([]);




// initialize entries
(async () => {setListEntries(await dbReadAll("PasswordEntry")  ?? []);})();
(async () => {setListRecentDel(await dbReadAll("RecentDelPass") ?? []);})();

createEffect(() => { setListPassword(password()) });



(async () => {
	document.getElementById("add-drawer-trigger")!.classList.remove('blink');

	const inputGroup     = (await element.wait("#input-group"))      as HTMLElement;
	const entriesList    = (await element.wait("#entries-list"))     as HTMLElement;
	const passwordInput  = (await element.wait("#password-input"))   as HTMLInputElement;
	const titleInput     = (await element.wait("#title-input"))      as HTMLInputElement;
	const addEntryButton = (await element.wait("#add-entry-button")) as HTMLButtonElement;
	const searchInputEl  = (await element.wait("#search-input"))     as HTMLInputElement;

	
	document.getElementById("search-box")!.addEventListener("input",(e)=>{
		if((e!.target as HTMLInputElement).matches("#search-input")){
		   setSearchInput((e!.target as HTMLInputElement).value);
		}
	});

	document.getElementById("search-box")!.addEventListener("click",(e)=>{
		if((e!.target as HTMLInputElement).matches("#cancel-search")){
			searchInputEl.value = ''
		   	setSearchInput('');
			setIsSearching(false)
		}
	});

	searchInputEl.addEventListener("focus", (e) => {setIsSearching(true);});
	searchInputEl.addEventListener("blur", (e) => {setIsSearching(searchInput().trim() !== "")});


	createEffect(() => {
		const fuse = new Fuse(listEntries(), { keys: ['title'] });
		const searched = fuse.search(searchInput()).map(entry => entry.item);
		setSearchArray(searched);
	});


// render entries based on signal
createEffect(() => {
	entriesList.textContent = '';
	const fragment = document.createDocumentFragment();

	if (
		isSearching() ? searchArray().length === 0 : listEntries().length === 0) { 
		fragment.append(element.configure("p", {textContent: "No records found", 
			className:"hint", 
			style:"padding-block :var(--gap-x04)" }));

  } else {
		(isSearching() ? searchArray() : (listEntries() ?? [])
		.sort((a, b) => new Date(b.crreatedAt).getTime() - new Date(a.crreatedAt).getTime()))
		.forEach((entry) => {

			fragment.append(
				element.configure('div', { className: 'entry-item', append: [
					element.configure('div', {append: [

						element.configure('p', { className: 'hint ellipsis', 
							style: "width: 20ch",
							textContent: entry.title || 'untitled'}),

						element.configure('button', {dataset: {action: 'copy'}, 
							className: 'ellipsis',
							style:"text-align: start; width: 19ch;",
							id: entry.password ?? '',
							textContent: entry.password ?? ''})
					]}),

					element.configure('div', {className: 's-container',append: [

						element.configure('details', { 
							name: 'delete-item', 
							className: 'right-to-left',
							append: [
								element.configure('summary',{ className: 'right-to-left' }), 
								element.configure('button', { dataset: {action: 'delete'},
									id: entry.id?.id ?? '',
									textContent: ' Delete'}),
							]
						}),

						element.configure('button', { dataset: {action: 'update'},id: entry.id?.id ?? '', append: [
							element.draw("svg", { style: "width: var(--gap-x04); height: var(--gap-x04);",viewBox: "0 0 24 24", fill: "none",append: 
								element.draw("path", {d: "M21.03 2.97a3.578 3.578 0 0 1 0 5.06L9.062 20a2.25 2.25 0 0 1-.999.58l-5.116 1.395a.75.75 0 0 1-.92-.921l1.395-5.116a2.25 2.25 0 0 1 .58-.999L15.97 2.97a3.578 3.578 0 0 1 5.06 0ZM15 6.06 5.062 16a.75.75 0 0 0-.193.333l-1.05 3.85 3.85-1.05A.75.75 0 0 0 8 18.938L17.94 9 15 6.06Zm2.03-2.03-.97.97L19 7.94l.97-.97a2.079 2.079 0 0 0-2.94-2.94Z"})
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
					setListRecentDel(await dbReadAll("RecentDelPass") ?? []);
				}
				await dbDelete("PasswordEntry:delete", deleteButton.id)
				setListEntries((await dbReadAll("PasswordEntry")) ?? []);
			})();
		}

	//update
  const updateButton = (e!.target as HTMLInputElement).closest("[data-action='update']");
	if (updateButton) {
		(async () => {
			(document.getElementById("edit-temp-list-dialog") as HTMLDialogElement).showModal();
				setUpdtingEntry(updateButton.id);
				const entry = await getEntryById("PasswordEntry", updateButton.id);
				if (entry) {
					const { title, password } = entry;
					console.log(title, password);
					setUpdatingListEntryTitle(title);
					(document.getElementById("updating-temp-title-input") as HTMLInputElement).value = title;

					setUpdatingListEntryPass(password);
					(document.getElementById("updating-temp-pass-input") as HTMLInputElement).value = password;
				}
		})();
	}

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
					title:listTitle(),
					password: listPassword(),
					crreatedAt: new Date().toISOString()
				});
				setListTitle("");
        if ((document.getElementById("auto-pass-entry") as HTMLInputElement).checked){
				  setListPassword("");
				}
				setListEntries((await dbReadAll("PasswordEntry")) ?? []);
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
         setListPassword('');
      } else {
        passwordInput.readOnly = true;
        createEffect(() => {
          setListPassword(password());
        });
      }
   }
	});

  // bind input values to signals
  inputGroup.addEventListener("input", (e) => {
    if ((e!.target as HTMLInputElement).matches("#title-input")) {
      setListTitle((e!.target as HTMLInputElement).value);
    }
    if ((e!.target as HTMLInputElement).matches("#password-input")) {
      setListPassword((e!.target as HTMLInputElement).value);
    }
  });


  // update dialog inputs
  document.getElementById("edit-temp-list-dialog")!.addEventListener("input", (e) => {
      if ((e!.target as HTMLInputElement).matches("#updating-temp-title-input")) {
      setUpdatingListEntryTitle((e!.target as HTMLInputElement).value);
    }
    if ((e!.target as HTMLInputElement).matches("#updating-temp-pass-input")) {
      setUpdatingListEntryPass((e!.target as HTMLInputElement).value);
    }
	});

  // update dialog confirm
  document.getElementById("edit-temp-list-dialog")!.addEventListener("click", (e) => {
  	if((e!.target as HTMLInputElement).matches("#update-temp-list-entry")) {
  		(async () => {
			dbUpdate("PasswordEntry:update", {
				id: updtingEntry(), 
				title:updatingListEntryTitle(), 
				password:updatingListEntryPass()});
			setListEntries((await dbReadAll("PasswordEntry")) ?? []);
			})();
		}
	});


	// bind signals to input values
	createEffect(() => { titleInput.value = listTitle();});

	createEffect(() => { passwordInput.value = listPassword();});

	// update add entry button state
	createEffect(() => { addEntryButton.disabled = (!listPassword());});
})();

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