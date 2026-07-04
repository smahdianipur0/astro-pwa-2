import { For, createSignal } from "solid-js";
import { tempList } from "../logic/tempList";
import { showToast } from "../logic/misc";
import Popover from "./ui/Popover";
import DeleteMenu from "./ui/DeleteMenu";
import type { ReadResultTypes, ReadAllResultTypes } from "../utils/surrealdb-indexed";

function getList(): ReadAllResultTypes["PasswordEntry"] | [] {
  return tempList.get("isSearching") ? tempList.get("searchArray") : (tempList.get("entries") ?? []);
}

const [entries, setEntries] = createSignal<ReadAllResultTypes["PasswordEntry"] | []>(getList());

tempList.on(["isSearching", "searchArray"], () => {
  setEntries(getList());
});



function openEditDialog(entry: ReadResultTypes["PasswordEntry"]) {
  const dlg = document.getElementById("TempList-update") as HTMLDialogElement;
  (document.getElementById("TempList-update-title") as HTMLInputElement).value = entry.title;
  (document.getElementById("TempList-update-pass") as HTMLInputElement).value = entry.password;
  dlg.dataset._ = entry.id?.toString() ?? "";
  dlg.showModal();
}


export default function TempListItems() {
  return (
    <menu id="TempList-list" style="background: transparent;">
    <For
      each={entries()}
      fallback={ <small style="text-align: center; padding-block: var(--size-sm3)"> No records found </small>}
    >
      {(entry) => (        
        <li style=" width: var(--stretch);background-color:transparent;">
          <div class="VStack leading" style="--gap: 0;">
            <small class="ellipsis" style="width: var(--size-xl2)">
              {entry.title || "untitled"}
            </small>
            <button class="not-prose ellipsis" style="text-align: start; width: var(--size-xl2); line-height: var(--size-sm4);  "
              onClick={() => {
                navigator.clipboard.writeText(entry.password ?? "");
                showToast();
              }}
            >
              {entry.password ?? ""}
            </button>
          </div>

          <div class="flex-with-gap" style="justify-content: flex-end;">
            <Popover
              trigger={
                <div class="text-as-button ZStack" style="margin-right: calc(var(--size-sm0) * -1);">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="oklch(var(--gray-95))"/>
                  </svg>
                </div>
              }
            >
              <menu id={`menu-${entry.id?.toString()}`} class="glass subtle-shadow menu-horizontal">
                <li>
                  <DeleteMenu
                    content={
                      <button onClick={() => entry.id && tempList.deleteEntries(entry.id)}> Delete</button>
                    }
                  />
                </li>
                <li>
                  <button
                    class="not-prose flex-with-gap"
                    style="color: oklch(var(--gray-95)); gap: var(--size-xs2);"
                    onClick={() => openEditDialog(entry)}
                  >
                    <svg style="width: var(--size-sm3); height: var(--size-sm3);" viewBox="0 0 24 24" fill="none">
                      <path d="M21.03 2.97a3.578 3.578 0 0 1 0 5.06L9.062 20a2.25 2.25 0 0 1-.999.58l-5.116 1.395a.75.75 0 0 1-.92-.921l1.395-5.116a2.25 2.25 0 0 1 .58-.999L15.97 2.97a3.578 3.578 0 0 1 5.06 0ZM15 6.06 5.062 16a.75.75 0 0 0-.193.333l-1.05 3.85 3.85-1.05A.75.75 0 0 0 8 18.938L17.94 9 15 6.06Zm2.03-2.03-.97.97L19 7.94l.97-.97a2.079 2.079 0 0 0-2.94-2.94Z" />
                    </svg>
                    <div>Update</div>
                  </button>
                </li>
              </menu>
            </Popover>
          </div>
        </li>
      
      )}
    </For>
    </menu>
  );
}