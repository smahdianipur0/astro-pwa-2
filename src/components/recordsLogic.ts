import { element } from "../utils/elementUtils";
import { createSignal, createEffect } from "solid-js";
import { dbCreate, dbReadAll, dbUpdate, type ReadAllResultTypes } from "../utils/surrealdb-indexed"


export const [createVaultName, setCreateVaultName]     = createSignal("");
export const [vaultsList, setVaultsList]               = createSignal<ReadAllResultTypes["Vaults"]>([]);
export const [editableVaultList, setEditableVaultList] = createSignal<ReadAllResultTypes["Vaults"]>([]);
export const [creationAllowed, setCreationAllowed]     = createSignal(true);

const intialvaults = await dbReadAll("Vaults");
if (intialvaults){setVaultsList(intialvaults);};


createEffect(() => { setEditableVaultList(vaultsList().filter(item => item.status === "available" && item.role === "owner")) });
createEffect(() => { setCreationAllowed(editableVaultList().length < 3) });

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

    const vaultMenu          = (await element.wait("#vault-menu"))          as HTMLElement;
    const createVaultButton  = (await element.wait("#create-vault-button")) as HTMLButtonElement
    const vaultNameInput     = (await element.wait("#vault-name-input"))    as HTMLInputElement

    const deleteVaultButton  = (await element.wait("#delete-vault-button")) as HTMLButtonElement
    const selectDeleteVaults = (await element.wait("#delete-vault-list"))   as HTMLSelectElement;


    vaultMenu.addEventListener("click",(e)=>{
        if((e!.target as HTMLInputElement).matches("#vault-create")){
            (document.getElementById("create-vault-dialog") as HTMLDialogElement).showModal();
        };
        if((e!.target as HTMLInputElement).matches("#vault-delete")){
            (document.getElementById("delete-vault-dialog") as HTMLDialogElement).showModal();
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
                await dbCreate("Vaults:create", {
                    name:createVaultName(), 
                    updatedAt: new Date().toISOString(),
                    status: "available",
                    role: "owner" 
                });
                const vaults = await dbReadAll("Vaults");
                if (vaults){setVaultsList(vaults)};
            })();
        };
    });

    document.getElementById("delete-vault-dialog")!.addEventListener("click",(e)=>{
        if((e!.target as HTMLInputElement).matches("#delete-vault-button")){
            const id = selectDeleteVaults.options[selectDeleteVaults.selectedIndex]?.id;
            const value = selectDeleteVaults.options[selectDeleteVaults.selectedIndex]?.value;
            (async () => {
                await dbUpdate("Vaults:update", {
                    id:id, 
                    name: value,
                    updatedAt: new Date().toISOString(),
                    status:"deleted"
                });

                const vaults = await dbReadAll("Vaults");
                if (vaults){setVaultsList(vaults)};
            })();
        };
    });

    createEffect(() => { createVaultButton.disabled = (!creationAllowed() || createVaultName() === "")});
    createEffect(() => { vaultNameInput.disabled    = (!creationAllowed()) });

    createEffect(() => { deleteVaultButton.disabled = editableVaultList().length === 0});

})();

createEffect(() => { 

    //vaults list
    const vaultlist = document.getElementById("vault-list") as HTMLSelectElement
    vaultlist.textContent = "";
    vaultlist.disabled = false;

    const fragment = document.createDocumentFragment();

    if (vaultsList().filter(item => item.status === "available").length === 0){

        fragment.append(element.configure("option", {textContent: "No vaults found"}));
    } else { 
         (vaultsList() ?? [])
         .filter(item => item.status === "available")
         .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
         .forEach((entry) => {

            fragment.append( element.configure("option", {textContent:entry.name, id:entry.id?.id }));
        });
    }
    vaultlist.append(fragment);


    //delete vaults list
    const deleteVaultlist = document.getElementById("delete-vault-list") as HTMLSelectElement
    deleteVaultlist.textContent = "";

    //vaults list for card creation
    const cardVaultlist = document.getElementById("select-vault-for-card") as HTMLSelectElement
    cardVaultlist.textContent = "";

    const fragment2 = document.createDocumentFragment();

    if (editableVaultList().length === 0){
        fragment2.append(element.configure("option", {textContent: "No vaults found"}));
    } else { 
         (editableVaultList() ?? [])
         .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
         .forEach((entry) => {

            fragment2.append( element.configure("option", {textContent:entry.name, id:entry.id?.id}));
        });
    }

    const fragment2Clone = fragment2.cloneNode(true);
    deleteVaultlist.append(fragment2);
    cardVaultlist.append(fragment2Clone);

});