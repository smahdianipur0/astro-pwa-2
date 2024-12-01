import {
	createPasswordEntry,
	getAllPasswordEntries,
	deletePasswordEntry,
	type PasswordEntry,} from "../utils/surrealdb";
import { waitForElement } from "../utils/waitForElement";
import { configureElement } from '../utils/elementCreator';
import { password, showToast } from "../components/signals.ts";
import { createSignal, createEffect } from "solid-js";



// signals
const [newTitle, setNewTitle] = createSignal('')
const [newPassword, setNewPassword] = createSignal('');
const [entries, setEntries] = createSignal<PasswordEntry[]>([]) ;


// initialize entries
(async () => {setEntries(await getAllPasswordEntries() ?? []);})();

createEffect(() => {
  setNewPassword(password());
});



// await elements
(async () => {
	const inputGroup    = (await waitForElement("#input-group"))   as HTMLElement;
	const entriesList   = (await waitForElement("#entries-list"))   as HTMLElement;
	const passwordInput = (await waitForElement("#passwordInput")) as HTMLInputElement;
	const titleInput    = (await waitForElement("#titleInput"))    as HTMLInputElement;


// render entries based on signal
createEffect(() => {
	entriesList.textContent = '';
	const fragment = document.createDocumentFragment();
  
	[...(entries() ?? [])].reverse().forEach((entry) => {
	  fragment.append(
		configureElement(document.createElement('div'), {
		  className: 'entry-item',
		  append: [
			configureElement(document.createElement('div'), {
			  append: [
				configureElement(document.createElement('p'), {
				  className: 'hint',
				  textContent: entry.title || 'untitled'
				}),
				(() => configureElement(document.createElement('button'), {
				  className: 'copy-button',
				  id: entry.password ?? '',
				  textContent: entry.password ?? ''
				}))()
			  ]
			}),
			configureElement(document.createElement('div'), {
			  className: 's-container',
			  append: [
				configureElement(document.createElement('details'), {
				  name: 'delete-item',
				  append: [
					document.createElement('summary'),
					configureElement(document.createElement('button'), {
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
				await deletePasswordEntry(deleteButton.id);
				setEntries((await getAllPasswordEntries()) ?? []);
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

  // add entry
	inputGroup.addEventListener("click", (e) => {
		if ((e!.target as HTMLInputElement).matches("#addEntryButton")) {
			(async () => {
				await createPasswordEntry(newTitle(), newPassword());
				setNewTitle("");
        if ((document.getElementById("auto-pass-entry") as HTMLInputElement).checked){
				  setNewPassword("");
				}
				setEntries((await getAllPasswordEntries()) ?? []);
			})();
		}

    // auto-pass entry
    if ((e!.target as HTMLInputElement).matches("#auto-pass-entry")) {
      if ((e.target as HTMLInputElement).checked) {
         (document.getElementById("passwordInput")! as HTMLInputElement).readOnly = false;
         setNewPassword('');
      } else {
        (document.getElementById("passwordInput")! as HTMLInputElement).readOnly = true;
        createEffect(() => {
          setNewPassword(password());
        });
      }
   }
	});

  // bind input values to signals
  inputGroup.addEventListener("input", (e) => {
    if ((e!.target as HTMLInputElement).matches("#titleInput")) {
      setNewTitle((e!.target as HTMLInputElement).value);
    } else if ((e!.target as HTMLInputElement).matches("#passwordInput")) {
      setNewPassword((e!.target as HTMLInputElement).value);
    }
  });


	// bind signals to input values
	createEffect(() => {
		titleInput.value = newTitle();
	});

	createEffect(() => {
		passwordInput.value = newPassword();
	});


	// update add entry button state
	createEffect(() => {
		if (!newPassword()) {
			(document.getElementById("addEntryButton")! as HTMLButtonElement).disabled = true;
		} else {
			(document.getElementById("addEntryButton")! as HTMLButtonElement).disabled = false;
		}
	});

})();