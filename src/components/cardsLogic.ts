import { element } from "../utils/elementUtils";
import { createSignal, createEffect } from "solid-js";
import { dbUpserelate, dbReadRelation, type ReadAllResultTypes } from "../utils/surrealdb-indexed"
import { editableVaultList, selectedVault} from "./recordsLogic"
import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 20)

// signals
export const [cardsList, setcardsList]                = createSignal<ReadAllResultTypes["Cards"]>([]);
export const [addCardSelectedVault, setAddCardSelectedVault] = createSignal("");
const [selectedCard, setSelectedCard]                 = createSignal("");
const [cardName, setCardName]                         = createSignal("");


// initialize addCardSelectedVault
const selectVaultToAddCard = document.getElementById("select-vault-for-card") as HTMLSelectElement;
if (selectVaultToAddCard){ setAddCardSelectedVault(selectVaultToAddCard.options[0]?.value)}

// initialize cardsList
export async function updateCardsList(): Promise<void> {
  const initialCardsList = await dbReadRelation("Vaults", "Vaults_has", "Cards", addCardSelectedVault());
  if (initialCardsList) {setcardsList(initialCardsList);}
}

updateCardsList();


// update cardsList
createEffect(() => { (async () => {
    const intialcardsList = await dbReadRelation("Vaults", "Vaults_has", "Cards", addCardSelectedVault());
    if (intialcardsList) {setcardsList(intialcardsList);}
})(); });

// initial handleCardForm
declare global {
    interface Window {
        handleCardForm: (form: HTMLFormElement, event: SubmitEvent) => boolean;
    }
}

const dialog = document.getElementById('card-form') as HTMLDialogElement;
const form   = dialog.querySelector('form')         as HTMLFormElement;


// bind listeners
document.getElementById("card-menu-div")!.addEventListener("click",(e)=>{
    if((e!.target as HTMLInputElement).matches("#card-form-button")){
        (document.getElementById("card-form") as HTMLDialogElement).showModal();
        const value = selectedVault();
        selectVaultToAddCard.value = 
            Array.from(selectVaultToAddCard.options).some(o => o.value === value) ? value :
            selectVaultToAddCard.options[0]?.value || '';
    };
});

dialog!.addEventListener("click",(e)=>{
    if((e!.target as HTMLInputElement).matches("#add-field")){
        e.preventDefault();
        const fragment = document.createDocumentFragment();
        fragment.append(element.configure('textarea', {name:"comments"}) );
        document.getElementById("card-fields")!.append(fragment)
        return false
    };
});

dialog!.addEventListener("input",(e)=>{
    if((e!.target as HTMLInputElement).matches("#select-vault-for-card")){
        setAddCardSelectedVault((e!.target as HTMLInputElement).value.toString());
    };
    if((e!.target as HTMLInputElement).matches("#select-card-list")){
        setSelectedCard((e!.target as HTMLInputElement).value.toString())
    };
    if((e!.target as HTMLInputElement).matches("#new-card-input")){
        setCardName((e!.target as HTMLInputElement).value.toString())
    };
});

// update availible cards to select
createEffect(() => {
    (async () => {
        const selectCardList = document.getElementById("select-card-list") as HTMLInputElement;
        if (!selectCardList) return;

        selectCardList.textContent = "";
        setSelectedCard("");

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

// card name input
createEffect(() => {
    const fragment = document.createDocumentFragment();

    if (selectedCard() === "" || selectedCard() === "New Card") {

        const cardInput = document.getElementById("new-card-input") as HTMLInputElement;
        if (cardInput) {cardInput.remove()}

        fragment.append(element.configure("input", {
            style: "margin-top:var(--gap-x02)",
            type: "text", 
            placeholder:"Card Name",
            id:"new-card-input",
            name: "new card"
        }));

        document.getElementById("card-select-field")!.append(fragment)

    } else {
        const cardInput = document.getElementById("new-card-input") as HTMLInputElement;
        if (cardInput) {cardInput.remove()}
    }
});

// ok button disabled
createEffect(() => { 
    (document.getElementById("add-card-button") as HTMLButtonElement).disabled = (selectedCard() === "" && cardName() === "")
});
    
// handle form
window.handleCardForm = (form: HTMLFormElement, event: SubmitEvent): boolean => {
    const action = (event.submitter as HTMLButtonElement)?.value;
  
    if (action === 'cancel') { return true;}
  
    const data = new FormData(form);

    const selectElement = document.getElementById("select-card-list") as HTMLSelectElement;
    const selectedOptionId = selectElement.options[selectElement.selectedIndex].id;

    const id   = ( data.get("select card") === "New Card") ? nanoid() : selectedOptionId;
    const name = ( data.get("select card") === "New Card") ? data.get("new card") as string : data.get("select card") as string ; 

    dbUpserelate("Cards:upserelate", {
        id:id, 
        name:name, 
        status:"available", 
        data: data.getAll('comments') as string[],
        "to:Vaults_has": {
            in: data.get("select vault") as string} 
        });
    updateCardsList();
    return true;
};

// reset the form on close
const initialFormHTML = form.innerHTML;
dialog.addEventListener('close', () => {form.innerHTML = initialFormHTML; });

// await dbReadRelation("Vaults", "Vaults_has", "Cards", "test3")
