import { element } from "../utils/elementUtils";
import { createSignal, createEffect } from "solid-js";
import { dbCreate, dbReadAll,dbUpdate, type ReadAllResultTypes, type ReadrResultTypes } from "../utils/surrealdb-indexed"
import {editableVaultList} from "./recordsLogic"


const [cardsList, setcardsList]          = createSignal<ReadAllResultTypes["Cards"]>([]);
const [selectedVault, setSelectedVault]  = createSignal("");
const [selectedCard, setcselectedCard]   = createSignal("");

// set cards from cards table where in.id is selectedVault() to cardsList

document.getElementById("card-menu-div")!.addEventListener("click",(e)=>{
    if((e!.target as HTMLInputElement).matches("#card-form-button")){
        (document.getElementById("card-form") as HTMLDialogElement).showModal();
    };
});

declare global {
    interface Window {
        handleCardgForm: (form: HTMLFormElement, event: SubmitEvent) => boolean;
    }
}

const dialog = document.getElementById('card-form') as HTMLDialogElement;
const form   = dialog.querySelector('form')         as HTMLFormElement;


createEffect(() => {
    (async () => {
        const selectCardList = document.getElementById("select-card-list") as HTMLInputElement;
        if (!selectCardList) return;

        selectCardList.textContent = "";

        selectCardList.disabled = (editableVaultList().length === 0);

        if (editableVaultList().length !== 0) {
            const fragment = document.createDocumentFragment();

            const availableCards = (cardsList() ?? []).filter(item => item.status === "available");

            if (availableCards.length === 0) {
                fragment.append(element.configure("option", { textContent: "New Card" }));
            } else {
                availableCards
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .forEach((entry) => {
                        fragment.append(
                            element.configure("option", { textContent: entry.name, id: entry.id?.id })
                        );
                    });
            }

            selectCardList.append(fragment);
        }
    })();
});

async function handleCardSelection() {

    const value = (document.getElementById("select-card-list") as HTMLSelectElement)!.value;;
    const fragment = document.createDocumentFragment();

    if (value === "New Card") {
        fragment.append(element.configure("input", {
            style: "margin-top:var(--gap-x02)",
            type: "text", 
            placeholder:"Card Name",
            id:"new-card-input",
            name: "new card"
        }));
    } else {
        const cardInput = document.getElementById("new-card-input") as HTMLInputElement;
        if (cardInput) {cardInput.remove()}
    }

    document.getElementById("card-select-field")!.append(fragment);
}


handleCardSelection();


dialog!.addEventListener("click",(e)=>{
    if((e!.target as HTMLInputElement).matches("#add-field")){
        e.preventDefault();
        const fragment = document.createDocumentFragment();
        fragment.append(
         element.configure('textarea', {name:"comments"})
        );
        document.getElementById("card-fields")!.append(fragment)
        return false
    };
});

dialog!.addEventListener("input",(e)=>{
    if((e!.target as HTMLInputElement).matches("#select-vault-for-card")){
        setSelectedVault((e!.target as HTMLInputElement).value.toString());
    };
    if((e!.target as HTMLInputElement).matches("#select-card-list")){
        handleCardSelection();
    };
});


window.handleCardgForm = (form: HTMLFormElement, event: SubmitEvent): boolean => {
    const action = (event.submitter as HTMLButtonElement)?.value;
  
    if (action === 'cancel') { return true;}
  
    const data = new FormData(form);
    console.log('vault:', data.get("select vault"));
    console.log('card:', data.get("select card"));
    console.log('new card:', data.get("new card")); 
    console.log('Comments:', data.getAll('comments'));
  
    return true;
};

const initialFormHTML = form.innerHTML;
dialog.addEventListener('close', () => {
  form.innerHTML = initialFormHTML;
    (async () => {
        handleCardSelection();
    })();
});