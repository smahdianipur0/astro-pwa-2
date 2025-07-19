import type { JSX } from "solid-js";

export function initialAuthUi(): JSX.Element {
    return (<>
        <div 
            class="prose" 
            style="display: flex; 
            gap: var(--size-sm0); 
            justify-content: space-between;">

            <input
                id="user_name"
                type="text"
                placeholder="Name"
                autocomplete="off"
                style="margin-bottom: var(--size-sm0); width: 100%;"/>

            <button
                id="registration"
                style="margin-bottom: var(--size-sm0); width: fit-content; white-space: nowrap;"
                disabled={true}>
                Sign Up</button>
        </div>

        <small style="margin-top: 0;">

            <span>Allready Signed Up ? </span>
            <button
                class="not-prose"
                id="authentication"
                style="font-weight: 600; 
                text-decoration: underline; 
                color: oklch(var(--gray-95))">
                Sign In</button>

        </small>
    </>);
}