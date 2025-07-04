import { dbCreate, dbReadAll, dbDelete, type ReadAllResultTypes} from "../utils/surrealdb-indexed";
import { createStore } from "../utils/state";

export const email = createStore({
    state: { 
        emailInput: "" ,
        emailList: ([]) as ReadAllResultTypes["Emails"] | [],
    },
    methods: {
        setEmailInput(value: string) { this.set('emailInput', value); },

        async updateEmailList(){
            this.set('emailList',await dbReadAll("Emails") ?? []) 
        },

        async addEmail(newEmail: string) {
            await dbCreate("Emails:create", {email:newEmail, crreatedAt: new Date().toISOString()});
            this.set('emailList',await dbReadAll("Emails") ?? [])
        },

        async addDelete(id: string) {
            await dbDelete(id);
            this.set('emailList',await dbReadAll("Emails") ?? [])
        }
    }, 
});