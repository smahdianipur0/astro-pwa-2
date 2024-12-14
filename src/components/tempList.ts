import {
	createPasswordEntry,
	getAllPasswordEntries,
	deletePasswordEntry,
	createRecentDelPass,
	getAllRecentDelPass,
	deleteRecentDelPass,
	getEntryById,
	type PasswordEntry,
} from "../utils/surrealdb";
import { element } from "../utils/elementUtils";
import { password, showToast } from "../components/signals.ts";
import { createSignal, createEffect } from "solid-js";
// import Fuse from 'fuse.js'



// signals
const [listTitle, setListTitle]        = createSignal('')
const [listPassword, setListPassword]  = createSignal('');
const [listEntries, setListEntries]    = createSignal<PasswordEntry[]>([]);
const [listRecentDel, setListRecentDel]= createSignal<PasswordEntry[]>([]);


// initialize entries
(async () => {setListEntries(await getAllPasswordEntries() ?? []);})();
(async () => {setListRecentDel(await getAllRecentDelPass() ?? []);})();

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



	// const fuse = new Fuse(listEntries(), {
	// 	keys: ['title']
	//   })

	// const searched = fuse.search('jon').map(entry => entry.item);


// render entries based on signal
createEffect(() => {
	entriesList.textContent = '';
	const fragment = document.createDocumentFragment();
  
	(listEntries() ?? []).reverse().forEach((entry) => {
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
								className: 'copy-button',
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
									})
								]
							})
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
				// Get the record by its ID
				const entry = await getEntryById("PasswordEntry", deleteButton.id);
				if (entry) {
					const { title, password } = entry;
					await createRecentDelPass(title, password);
          await setListRecentDel(await getAllRecentDelPass() ?? []);
				}
				await deletePasswordEntry(deleteButton.id);
				setListEntries((await getAllPasswordEntries()) ?? []);
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
				await createPasswordEntry(listTitle(), listPassword());
				setListTitle("");
        if ((document.getElementById("auto-pass-entry") as HTMLInputElement).checked){
				  setListPassword("");
				}
				setListEntries((await getAllPasswordEntries()) ?? []);
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
    } else if ((e!.target as HTMLInputElement).matches("#password-input")) {
      setListPassword((e!.target as HTMLInputElement).value);
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
									className: 'copy-button',
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
				await deleteRecentDelPass(deleteButton.id);
				setListRecentDel((await getAllRecentDelPass()) ?? []);
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