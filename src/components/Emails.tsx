import type { ReadAllResultTypes } from "../utils/surrealdb-indexed"
import DeleteMenu from './ui/DeleteMenu'
import Swiper from './ui/Swiper.tsx'
import { showToast } from "../components/ui/toast.ts";
import { email } from "../logic/email";

const EmailsList = (entries: ReadAllResultTypes["Emails"], isEditing: boolean) => {
    return (<>
        {entries.length !== 0 && (entries.map((entry) => (

            <li
                data-swapy-slot={entry.createdAt}
                style='width: 100%; height: var(--size-md3);
                background-color:transparent; 
                padding-inline: 0;'>
                {isEditing ? (
                    <div data-swapy-item={entry.id} class="HStack x-stretch">

                            <button
                                class="not-prose ellipsis"
                                onClick={() => {
                                    navigator.clipboard.writeText(entry.email ?? "");
                                    showToast();
                                }}
                                style={`text-align: start; 
                                width: var(--size-xl2);
                                font-weight: 700;
                                color: oklch(var(--gray-95));
                                padding: var(--padding-0);
                                padding-inline: 0;`}>
                                {entry.email ?? ''}
                            </button>
                            <div style="flex:1"></div>

                        <div class="HStack slide-in-right">
                            <div data-swapy-handle style="width: var(--size-md2);display: flex;justify-content: flex-end;">
                                <div class="swapy-handle"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Swiper
                        options={
                            <li>
                                <DeleteMenu content={
                                    <button onClick={() => entry.id && email.deleteEmail(entry.id)}>Delete</button>
                                }></DeleteMenu>
                            </li>
                        }
                    >
                        <button
                            class="not-prose ellipsis"
                            onClick={() => {
                                navigator.clipboard.writeText(entry.email ?? "");
                                showToast();
                            }}
                            style={`text-align: start; 
                            font-weight: 700;
                            color: oklch(var(--gray-95));
                            padding: var(--padding-0);
                            padding-inline: 0;`}>
                            {entry.email ?? ''}
                        </button>
                    </Swiper>
                )}
            </li>
        )))}
    </>);
}
export default EmailsList