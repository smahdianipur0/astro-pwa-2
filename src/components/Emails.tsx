import type { ReadAllResultTypes } from "../utils/surrealdb-indexed"
import TwoStepAction from './ui/TwoStepAction'
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

                            <p
                                class="not-prose ellipsis"
                                style={`text-align: start; 
                                width: var(--size-xl2);
                                font-weight: 700;
                                color: oklch(var(--gray-95));
                                padding: var(--padding-0);
                                padding-inline: 0;`}>
                                {entry.email ?? ''}
                            </p>
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
                                <TwoStepAction color="var(--danger)" icon= "delete" >
                                    <button onClick={() => entry.id && email.deleteEmail(entry.id)}>Delete</button>
                                </TwoStepAction>
                            </li>
                        }
                    >
                        <button
                            class="not-prose ellipsis"
                            onClick={() => {
                                navigator.clipboard.writeText(entry.email ?? "");
                                showToast(entry.email ?? "");
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