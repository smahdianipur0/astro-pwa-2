import type { JSX } from "solid-js";
import type { ReadResultTypes } from "../utils/surrealdb-indexed";

export function RecordCards(entry: ReadResultTypes["Cards"]): JSX.Element {
  return (
    <>
      <fieldset class="box-shadow" style="margin-block: var(--size-sm3);">
        <div class="not-prose">
          <div 
            class="flex-spread-childs" 
            style="border-bottom: 1px solid oklch(var(--gray-25) / 1); padding-bottom: var(--size-sm1); margin-bottom: var(--size-sm1);"
          >
            <p 
              class="ellipsis" 
              style="width: 20ch; font-weight: 600; font-style: italic;"
            >
              {entry.name || 'untitled'}
            </p>

            <div class="flex-with-gap" style="justify-content: flex-end;">
              <details class="right-to-left">
                <summary class="right-to-left"></summary>
                <button 
                  data-action="delete"
                  id={entry.id ?? ''}
                >
                  Delete
                </button>
              </details>

              <button 
                data-action="update"
                id={entry.id ?? ''}
              >
                <svg 
                  style="width: var(--size-sm3); height: var(--size-sm3);" 
                  viewBox="0 0 24 24" 
                  fill="none"
                >
                  <path d="M21.03 2.97a3.578 3.578 0 0 1 0 5.06L9.062 20a2.25 2.25 0 0 1-.999.58l-5.116 1.395a.75.75 0 0 1-.92-.921l1.395-5.116a2.25 2.25 0 0 1 .58-.999L15.97 2.97a3.578 3.578 0 0 1 5.06 0ZM15 6.06 5.062 16a.75.75 0 0 0-.193.333l-1.05 3.85 3.85-1.05A.75.75 0 0 0 8 18.938L17.94 9 15 6.06Zm2.03-2.03-.97.97L19 7.94l.97-.97a2.079 2.079 0 0 0-2.94-2.94Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column;">
          {(entry.data ?? []).map((dataItem: string) => (
            <button
              data-action="copy"
              class="not-prose ellipsis"
              style="text-align: start; width: var(--size-xl2); font-weight: 200"
            >
              {dataItem}
            </button>
          ))}
        </div>
      </fieldset>
    </>
  );
}