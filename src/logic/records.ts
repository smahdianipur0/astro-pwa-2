import { dbReadAll, dbReadRelation, type ReadAllResultTypes } from "../utils/surrealdb-indexed"
import { createStore, derive } from "../utils/state"

export const records = createStore({
    state: { 
    	vaultName: "" ,
    	cardName:  "" ,

    	vaultsList:([]) as ReadAllResultTypes["Vaults"] | [],
    	cardsList:([])  as ReadAllResultTypes["Cards"] | [],

    	selectedVault: "",
    	selectedCard:  "",
    },

    methods: {
    	setVaultName(value: string) { this.set('vaultName', value); },
    	setCardName(value: string)  { this.set('cardName', value); },

    	async updateVaultsList () { this.set('vaultsList', await dbReadAll("Vaults") ?? []) },
    	async updateCardsList ()  { 
    		if (this.get("selectedVault") !== "") { this.set('cardsList', await dbReadRelation(
    			`Vaults:${this.get("selectedVault")}`, "Vaults_has", "Cards"
    			) ?? []!) 
    		}
    	},

    	
    	setSelectedVault(value: string) { this.set('selectedVault', value); },
    	setSelectedCard(value: string)  { this.set('selectedCard', value); },
    }, 

    derived: {
	    editableVaultList: derive(
	      ['vaultsList'] as const, 
	      ({ get }) => ( 
	      	(get("vaultsList")as ReadAllResultTypes["Vaults"] | [])
	      	.filter(item => item.status === "available" && item.role === "owner"))
	    )
	}
});

