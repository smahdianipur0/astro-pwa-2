import { createStore, derive } from '../utils/state';
import Fuse from 'fuse.js'
import { dbReadAll,type ReadAllResultTypes } from "../utils/surrealdb-indexed";


export const tempList = createStore({
    state: {
    	title:        "",
    	password:     "",
    	searchInput:  "",
    	isSearching:  false,

    	entries:         ([]) as ReadAllResultTypes["PasswordEntry"] | [],
    	recentDelEntries:([]) as ReadAllResultTypes["PasswordEntry"] | [],
	},

    methods: {
    	setTitle        (value: string)  { this.set('title', value) },
    	setPassword     (value: string)  { this.set('password', value) },
    	setSearchInput  (value: string)  { this.set('searchInput', value) },
    	setIsSearching  (value: boolean) { this.set('isSearching', value) },

    	async updateEntries          () {( this.set('entries', await dbReadAll("PasswordEntry") ?? []!)) },
    	async updateRecentDelEntries () {( this.set('recentDelEntries',  await dbReadAll("RecentDelPass") ?? []!));}
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