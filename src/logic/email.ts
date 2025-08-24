import { dbCreate, dbReadAll, dbDelete, type ReadAllResultTypes} from "../utils/surrealdb-indexed";
import { createStore } from "../utils/state";
import type { RecordId } from "surrealdb";

export const email = createStore({
    state: { 
        emailInput: "" ,
        emailList: ([]) as ReadAllResultTypes["Emails"] | [],
        isEditing: false
    },
    methods: {
        setEmailInput(value: string) { this.set('emailInput', value) },

        async updateEmailList(){
            this.set('emailList',await dbReadAll("Emails") ?? []) 
        },

        async addEmail(newEmail: string) {
            await dbCreate("Emails:create", {email:newEmail, createdAt: new Date().toISOString()});
            this.set('emailList',await dbReadAll("Emails") ?? [])
        },

        async deleteEmail(id: RecordId<string>) {
            await dbDelete(id);
            this.set('emailList',await dbReadAll("Emails") ?? [])
        },

        setIsEditing(isEditing: boolean) { this.set('isEditing', isEditing) }
    }, 
});