import { element } from "../utils/elementUtils";
import { createSignal, createEffect } from "solid-js";
import { dbCreate, dbReadAll,dbUpdate,dbUpserelate, dbReadRelation, type ReadAllResultTypes, } from "../utils/surrealdb-indexed"
import {editableVaultList, selectedVault} from "./recordsLogic"




const [cardsList, setcardsList]                       = createSignal<ReadAllResultTypes["Cards"]>([]);
const [addCardSelectedVault, setAddCardSelectedVault] = createSignal("");
const [selectedCard, setcselectedCard]                = createSignal("");
const [cardName, setCardName]                         = createSignal("");



const intialcardsList = await dbReadRelation("Vaults", "Vaults_has", "Cards", addCardSelectedVault());
if (intialcardsList) {setcardsList(intialcardsList)}

createEffect(() => { (async () => {
    const intialcardsList = await dbReadRelation("Vaults", "Vaults_has", "Cards", addCardSelectedVault());
    if (intialcardsList) {setcardsList(intialcardsList);}
})(); });


// show modal and pre select vault
document.getElementById("card-menu-div")!.addEventListener("click",(e)=>{
    if((e!.target as HTMLInputElement).matches("#card-form-button")){
        (document.getElementById("card-form") as HTMLDialogElement).showModal();
        const select = document.getElementById("select-vault-for-card") as HTMLSelectElement;
        const value = selectedVault();
        select.value = Array.from(select.options).some(o => o.value === value) ? value : select.options[0]?.value || '';
    };
});

declare global {
    interface Window {
        handleCardForm: (form: HTMLFormElement, event: SubmitEvent) => boolean;
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
                fragment.append(element.configure("option", { textContent: "New Card" }));
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



createEffect(() => {
const fragment = document.createDocumentFragment();

    if (selectedCard() === "") {
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
});

// ok button disabled
createEffect(() => { 
    (document.getElementById("add-card-button") as HTMLButtonElement).disabled = (selectedCard() === "" && cardName() === "")
});
    

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
        setAddCardSelectedVault((e!.target as HTMLInputElement).value.toString());
    };
    if((e!.target as HTMLInputElement).matches("#select-card-list")){
        setcselectedCard((e!.target as HTMLInputElement).value.toString())
    };
    if((e!.target as HTMLInputElement).matches("#new-card-input")){
        setCardName((e!.target as HTMLInputElement).value.toString())
    };
});


window.handleCardForm = (form: HTMLFormElement, event: SubmitEvent): boolean => {
    const action = (event.submitter as HTMLButtonElement)?.value;
  
    if (action === 'cancel') { return true;}
  
    const data = new FormData(form);
    console.log('vault:', data.get("select vault"));
    console.log('card:', data.get("select card"));
    console.log('new card:', data.get("new card")); 
    console.log('Comments:', data.getAll('comments'));
  
    // dbUpserelate("Cards:upserelate", {id:"somecard", name:"good", status:"available", "to:Vaults_has": {in:"test2", role:"owner"} });
    return true;
};

const initialFormHTML = form.innerHTML;
dialog.addEventListener('close', () => {form.innerHTML = initialFormHTML; });
