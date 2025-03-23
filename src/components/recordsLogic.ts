import { element } from "../utils/elementUtils";
import { createSignal, createEffect } from "solid-js";
import {dbCreate, dbDelete, dbReadAll, type ReadAllResultTypes} from "../utils/surrealdb-indexed"

const [createVaultName, setCreateVaultName] = createSignal("");
const [vaults, setVaults] = createSignal<ReadAllResultTypes["Vaults"]>([]);

const intialvaults = await dbReadAll("Vaults");
if (intialvaults){setVaults(intialvaults);};

(async () => {

    const vaultMenu = (await element.wait("#vault-menu")) as HTMLElement;
    const createVaultButton = ( await element.wait("#create-vault-button")) as HTMLButtonElement

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
                await dbCreate("Vaults:create", {name:createVaultName(), crreatedAt: new Date().toISOString() });
                const vaults = await dbReadAll("Vaults");
                if (vaults){setVaults(vaults)};
            })();
        };
    });

    createEffect(() => { createVaultButton.disabled = (createVaultName() === "") ;});

})();

createEffect(() => { 
    const vaultlist = document.getElementById("vault-list") as HTMLSelectElement
    vaultlist.textContent = "";
    vaultlist.disabled = false;
    const fragment = document.createDocumentFragment();
    if (vaults().length === 0){
        fragment.append(element.configure("option", {textContent: "No vaults found"}));
    } else { (vaults() ?? [])
        .sort((a, b) => new Date(b.crreatedAt).getTime() - new Date(a.crreatedAt).getTime())
        .forEach((entry) => {
            fragment.append( element.configure("option", {textContent:entry.name}));
        });
    }
    vaultlist.append(fragment);
})