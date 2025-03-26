import { element } from "../utils/elementUtils";
import { createSignal, createEffect } from "solid-js";
import {dbCreate, dbDelete, dbReadAll, type ReadAllResultTypes} from "../utils/surrealdb-indexed"

const [createVaultName, setCreateVaultName] = createSignal("");
const [vaultsList, setVaultsList] = createSignal<ReadAllResultTypes["Vaults"]>([]);
const [creationAllowed, setCreationAllowed] = createSignal(true);



const intialvaults = await dbReadAll("Vaults");
if (intialvaults){setVaultsList(intialvaults);};

createEffect(() => { 
    const filteredItems = vaultsList().filter(item => item.status === "available" && item.role === "owner");
    setCreationAllowed(filteredItems.length < 3);
});

createEffect(() => { 
    (async () => {
        const vaultHint = (await element.wait("#vault-hint")) as HTMLElement;
        if (creationAllowed()){
            vaultHint.textContent = "You can create a new vault. You can have up to 3 vaults in total" 
        } else {
            vaultHint.textContent = "You already own 3 vaults, which is the maximum allowed. Need a new one? Try deleting an existing vault first."
        }
    })();
});



(async () => {

    const vaultMenu = (await element.wait("#vault-menu")) as HTMLElement;
    const createVaultButton = ( await element.wait("#create-vault-button")) as HTMLButtonElement
    const vaultNameInput = ( await element.wait("#vault-name-input")) as HTMLInputElement

    vaultMenu.addEventListener("click",(e)=>{
        if((e!.target as HTMLInputElement).matches("#vault-create")){
            (document.getElementById("create-vault-dialog") as HTMLDialogElement).showModal();
        };
    });

    document.getElementById("create-vault-dialog")!.addEventListener("input",(e)=>{
        if((e!.target as HTMLInputElement).matches("#vault-name-input")){
             setCreateVaultName((e!.target as HTMLInputElement).value)
        };
    });

    document.getElementById("create-vault-dialog")!.addEventListener("click",(e)=>{
        if((e!.target as HTMLInputElement).matches("#create-vault-button")){

            (async () => {
                console.log("created");
                await dbCreate("Vaults:create", {
                    name:createVaultName(), 
                    crreatedAt: new Date().toISOString(),
                    status: "available",
                    role: "owner" 
                });

                const vaults = await dbReadAll("Vaults");
                if (vaults){setVaultsList(vaults)};
            })();
        };
    });

    createEffect(() => { createVaultButton.disabled = ( !creationAllowed() ||createVaultName() === "") ;});
    createEffect(() => { vaultNameInput.disabled = (!creationAllowed()) });
})();

createEffect(() => { 
    const vaultlist = document.getElementById("vault-list") as HTMLSelectElement
    vaultlist.textContent = "";
    vaultlist.disabled = false;
    const fragment = document.createDocumentFragment();
    if (vaultsList().length === 0){
        fragment.append(element.configure("option", {textContent: "No vaults found"}));
    } else { (vaultsList() ?? [])
        .sort((a, b) => new Date(b.crreatedAt).getTime() - new Date(a.crreatedAt).getTime())
        .forEach((entry) => {
            fragment.append( element.configure("option", {textContent:entry.name}));
        });
    }
    vaultlist.append(fragment);
})