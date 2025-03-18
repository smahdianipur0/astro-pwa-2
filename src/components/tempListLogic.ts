import {
	dbCreate,
	dbUpdate,
	dbDelete,
	dbReadAll,
	getEntryById,
	type PasswordEntry,
} from "../utils/surrealdb-indexed";
import { element } from "../utils/elementUtils";
import { password, showToast } from "../components/homeLogic.ts";
import { createSignal, createEffect } from "solid-js";
import Fuse from 'fuse.js'
import { classList, className } from "solid-js/web";



// signals
const [listTitle, setListTitle]       = createSignal('');
const [listPassword, setListPassword] = createSignal('');
const [listEntries, setListEntries]   = createSignal<PasswordEntry[]>([]);

const [updtingEntry, setUpdtingEntry]                     = createSignal('');
const [updatingListEntryTitle, setUpdatingListEntryTitle] = createSignal('');
const [updatingListEntryPass, setUpdatingListEntryPass]   = createSignal('');

const [searchInput, setSearchInput]     = createSignal("");
const [isSearching, setIsSearching]     = createSignal(false);
const [searchArray, setSearchArray]     = createSignal<PasswordEntry[]>([]);

const [listRecentDel, setListRecentDel] = createSignal<PasswordEntry[]>([]);




// initialize entries
(async () => {setListEntries(await dbReadAll("PasswordEntry")  ?? []);})();
(async () => {setListRecentDel(await dbReadAll("RecentDelPass") ?? []);})();

createEffect(() => { setListPassword(password()) });


// await elements
(async () => {
	// Remove the blinking animation when JS loads
	const drawerTrigger = await element.wait("#add-drawer-trigger");
	drawerTrigger.style.animation = 'none';

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

	searchInputEl.addEventListener("focus", (e) => {
		setIsSearching(true);
	});

	searchInputEl.addEventListener("blur", (e) => {
		if(searchInput().trim() !== "") {setIsSearching(true)} else{ setIsSearching(false) };
	});


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
		fragment.append(element.configure("p", {textContent: "Loading records...", 
			className:"hint", 
			style:"padding-top:var(--gap-x04)" }));

  } else {
		(isSearching() ? searchArray() : (listEntries() ?? []).reverse()).forEach((entry) => {

			fragment.append(
				element.configure('div', { className: 'entry-item', append: [
					element.configure('div', {append: [

						element.configure('p', { className: 'hint ellipsis', 
							style: "width: 20ch",
							textContent: entry.title || 'untitled'}),

						element.configure('button', {
							className: 'copy-button ellipsis',
							id: entry.password ?? '',
							textContent: entry.password ?? ''})
					]}),

					element.configure('div', {className: 's-container',append: [

						element.configure('details', { name: 'delete-item', className: 'right-to-left',append: [

							element.configure('summary',{ className: 'right-to-left', }), 

							element.configure('button', { className: 'delete-button', 
								id: entry.id?.id ?? '',
								textContent: ' Delete'}),
						]}),
						element.configure('button', {
							className: 'update-button',
							id: entry.id?.id ?? '',
							textContent: '✏️'}),
					]})
				]})
			);
		});
	};
  
	entriesList.append(fragment);
  });

  // delete entry
	entriesList.addEventListener("click", (e) => {
		const deleteButton = (e!.target as HTMLInputElement).closest(".delete-button");
		if (deleteButton) {
			(async () => {
				// Get the record by its ID deleteButton.id
				const entry = await getEntryById("PasswordEntry", deleteButton.id);
				if (entry) {
					const { title, password } = entry;
					await dbCreate("RecentDelPass:create", {title: title, password: password});
					await setListRecentDel(await dbReadAll("RecentDelPass") ?? []);
				}
				await dbDelete("PasswordEntry:delete", deleteButton.id)
		
				setListEntries((await dbReadAll("PasswordEntry")) ?? []);
			})();
		}

	//update
  const updateButton = (e!.target as HTMLInputElement).closest(".update-button");
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
  const copyButton = (e!.target as HTMLInputElement).closest(".copy-button");
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
				await dbCreate("PasswordEntry:create", {title:listTitle(),password: listPassword()} )
				setListTitle("");
        if ((document.getElementById("auto-pass-entry") as HTMLInputElement).checked){
				  setListPassword("");
				}
				setListEntries((await dbReadAll("PasswordEntry")) ?? []);
			})();
		}

    // auto-pass entry
    if ((e!.target as HTMLInputElement).matches("#auto-pass-entry")) {
      if ((e.target as HTMLInputElement).checked) {
         (document.getElementById("password-input")! as HTMLInputElement).readOnly = false;
         setListPassword('');
      } else {
        (document.getElementById("password-input")! as HTMLInputElement).readOnly = true;
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
	createEffect(() => {
		titleInput.value = listTitle();
	});

	createEffect(() => {
		passwordInput.value = listPassword();
	});


	// update add entry button state
	createEffect(() => {
		if (!listPassword()) {
			addEntryButton.disabled = true;
		} else {
			addEntryButton.disabled = false;
		}
	});

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
				style:"padding-top:var(--gap-x04)" }));
		} else {
	  
		(listRecentDel() ?? []).reverse().forEach((entry) => {
			fragment.append(
				element.configure('div', { className: 'entry-item',append: [
					element.configure('div', { append: [

						element.configure('p', { className: 'hint ellipsis',
							style: "width:20ch",
							textContent: entry.title || 'untitled'}),

						element.configure('button', { className: 'copy-button ellipsis',
							id: entry.password ?? '',
							textContent: entry.password ?? ''})

					]}),

					element.configure('div', { className: 's-container',append: [
						element.configure('details', {
							name: 'delete-item',
							className: 'right-to-left',
							append: [

								element.configure('summary', { className: 'right-to-left',}),

								element.configure('button', { className: 'delete-button',
									id: entry.id?.id ?? '',
									textContent: ' Delete'})
							]
						}),
						element.configure('button',{
							className: 'restore-button',
							id: entry.id?.id ?? '',
							textContent: "📤"})
					]})
				]})
			);
		});
	}
	  
		recentdellist.append(fragment);
	});

	// delete recent deleted entry
	recentdellist.addEventListener("click", (e) => {
		const deleteButton = (e!.target as HTMLInputElement).closest(".delete-button");
		if (deleteButton) {
			(async () => {
				await dbDelete("RecentDelPass:delete", deleteButton.id);
				await setListRecentDel(await dbReadAll("RecentDelPass") ?? []);
			})();
		}
    const copyButton = (e!.target as HTMLInputElement).closest(".copy-button");
		if (copyButton) {
			(async () => {
				navigator.clipboard.writeText(copyButton.id);  
         showToast();
			})();
		}
		const restoreButton = (e!.target as HTMLInputElement).closest(".restore-button");
		if (restoreButton) {
			(async() => {
				(document.getElementById("restore-dialog") as HTMLDialogElement).showModal();
				const entry = await getEntryById("RecentDelPass", restoreButton.id);	
				console.log(entry)
				if (entry) {
					(document.getElementById("restore-list") as HTMLDialogElement).textContent = "";
					(document.getElementById("restore-list") as HTMLDialogElement)!.append(

						element.configure('p', { className: 'hint', style:"margin:0",
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

	  		const id = document.getElementById("restore-list")?.children[1].id as string;
	  		const title = document.getElementById("restore-list")?.children[0].textContent;
				const password = document.getElementById("restore-list")?.children[1].textContent;

	  		console.log(id,title, password);

	  		if (title && password) {
		  		await dbCreate("PasswordEntry:create", {title:title, password:password });
					setListEntries(await dbReadAll("PasswordEntry") ?? []);

					await dbDelete("RecentDelPass:delete", id);
					setListRecentDel(await dbReadAll("RecentDelPass") ?? []);
				}
			})();
		}
	});
})();