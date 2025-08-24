import { createStore, derive } from '../utils/state';
import Fuse from 'fuse.js'
import { dbReadAll, getEntryById, dbCreate, dbDelete, type ReadAllResultTypes } from "../utils/surrealdb-indexed";
import type { RecordId } from 'surrealdb';


export const tempList = createStore({
    state: {
    	title:        "",
    	password:     "",
    	searchInput:  "",
    	isSearching:  false,

    	entries:         ([]) as ReadAllResultTypes["PasswordEntry"] | [],
    	recentDelEntries:([]) as ReadAllResultTypes["RecentDelPass"] | [],
	},

    methods: {
    	setTitle        (value: string)  { this.set('title', value) },
    	setPassword     (value: string)  { this.set('password', value) },
    	setSearchInput  (value: string)  { this.set('searchInput', value) },
    	setIsSearching  (value: boolean) { this.set('isSearching', value) },

    	async updateEntries          () { this.set('entries', await dbReadAll("PasswordEntry") ?? []!) },
    	async updateRecentDelEntries () { this.set('recentDelEntries',  await dbReadAll("RecentDelPass") ?? []!);},

    	async deleteEntries(id : RecordId<"PasswordEntry">) {
    		const entry = await getEntryById(id);
    		if (entry) {
	            const { title, password, createdAt  } = entry;
	            await dbCreate("RecentDelPass:create", {title: title, password: password, createdAt: createdAt });
	        }
	        dbDelete(id)
	        this.set('entries', await dbReadAll("PasswordEntry") ?? []!);
    		this.set('recentDelEntries',  await dbReadAll("RecentDelPass") ?? []!);
    	},

    	async deleteRecentDelEntris (id) {
    		await dbDelete(id);
    		this.set('recentDelEntries',  await dbReadAll("RecentDelPass") ?? []!)
    	}
    }, 

    derived: {
	    searchArray: derive(
	      ['entries', 'searchInput'] as const, 
	      ({ get }) => {
	      	    const fuse  = new Fuse(get("entries"), { keys: ['title'] });
			    const searched = fuse.search(get("searchInput")).map(entry => entry.item);
			    return(searched as ReadAllResultTypes["PasswordEntry"] | []);
	      	}
	    )
	}
});