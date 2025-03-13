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
(async () => {setListEntries(await dbReadAll("password")  ?? []);})();
(async () => {setListRecentDel(await dbReadAll("recentDelPass") ?? []);})();

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
  
	(isSearching() ? searchArray() : (listEntries() ?? []).reverse()).forEach((entry) => {
		fragment.append(
			element.configure(document.createElement('div'), {
				className: 'entry-item',
				append: [
					element.configure(document.createElement('div'), {
						append: [
							element.configure(document.createElement('p'), {
								className: 'hint',
								textContent: entry.title || 'untitled'
							}),
							element.configure(document.createElement('button'), {
								className: 'copy-button ellipsis',
								id: entry.password ?? '',
								textContent: entry.password ?? ''
							})
						]
					}),
					element.configure(document.createElement('div'), {
						className: 's-container',
						append: [
							element.configure(document.createElement('details'), {
								name: 'delete-item',
								className: 'right-to-left',
								append: [
									element.configure(document.createElement('summary'),{
										className: 'right-to-left',
									}), 
									element.configure(document.createElement('button'), {
										className: 'delete-button',
										id: entry.id?.id ?? '',
										textContent: ' Delete'
									}),
								]
							}),
							element.configure(document.createElement('button'), {
								className: 'update-button',
								id: entry.id?.id ?? '',
								textContent: '📝'
							}),
						]
					})
				]
			})
		);
	});
  
	entriesList.append(fragment);
  });

  // delete entry
	entriesList.addEventListener("click", (e) => {
		const deleteButton = (e!.target as HTMLInputElement).closest(".delete-button");
		if (deleteButton) {
			(async () => {
				// Get the record by its ID deleteButton.id
				const entry = await getEntryById("password", deleteButton.id);
				if (entry) {
					const { title, password } = entry;
					await dbCreate("recentDelPass:create", {title: title, password: password})
					await setListRecentDel(await dbReadAll("recentDelPass") ?? []);
				}
				await dbDelete("password:delete", deleteButton.id)
		
				setListEntries((await dbReadAll("password")) ?? []);
			})();
		}

	//update
  const updateButton = (e!.target as HTMLInputElement).closest(".update-button");
	if (updateButton) {
		(async () => {
			(document.getElementById("edit-temp-list-dialog") as HTMLDialogElement).showModal();
				setUpdtingEntry(updateButton.id);
				const entry = await getEntryById("password", updateButton.id);
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
				await dbCreate("password:create", {title:listTitle(),password: listPassword()} )
				setListTitle("");
        if ((document.getElementById("auto-pass-entry") as HTMLInputElement).checked){
				  setListPassword("");
				}
				setListEntries((await dbReadAll("password")) ?? []);
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
			dbUpdate("password:update", {
				id: updtingEntry(), 
				title:updatingListEntryTitle(), 
				password:updatingListEntryPass()});
			setListEntries((await dbReadAll("password")) ?? []);
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
	  
		(listRecentDel() ?? []).reverse().forEach((entry) => {
			fragment.append(
				element.configure(document.createElement('div'), {
					className: 'entry-item',
					style: 'margin-left: calc(var(--gap-x03)* -1);',
					append: [
						element.configure(document.createElement('div'), {
							append: [
								element.configure(document.createElement('p'), {
									className: 'hint',
									textContent: entry.title || 'untitled'
								}),
								element.configure(document.createElement('button'), {
									className: 'copy-button ellipsis',
									id: entry.password ?? '',
									textContent: entry.password ?? ''
								})
							]
						}),
						element.configure(document.createElement('div'), {
							className: 's-container',
							append: [
								element.configure(document.createElement('details'), {
									name: 'delete-item',
									className: 'right-to-left',
									append: [
										element.configure(document.createElement('summary'), {
											className: 'right-to-left',
										}),
										element.configure(document.createElement('button'), {
											className: 'delete-button',
											id: entry.id?.id ?? '',
											textContent: ' Delete'
										})
									]
								})
							]
						})
					]
				})
			);
		});
	  
		recentdellist.append(fragment);
	});

	// delete recent deleted entry
	recentdellist.addEventListener("click", (e) => {
		const deleteButton = (e!.target as HTMLInputElement).closest(".delete-button");
		if (deleteButton) {
			(async () => {
				await dbDelete("recentDelPass:delete", deleteButton.id);
				await setListRecentDel(await dbReadAll("recentDelPass") ?? []);
			})();
		}
        const copyButton = (e!.target as HTMLInputElement).closest(".copy-button");
		if (copyButton) {
			(async () => {
				navigator.clipboard.writeText(copyButton.id);  
         showToast();
			})();
		}
	});

})();