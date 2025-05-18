import { createSignal } from "solid-js";
import {type ReadAllResultTypes} from "../utils/surrealdb-indexed";



export const [listTitle, setListTitle]       = createSignal('');
export const [listPassword, setListPassword] = createSignal('');
export const [listEntries, setListEntries]   = createSignal<ReadAllResultTypes["PasswordEntry"]>([]);
export const [updtingEntry, setUpdtingEntry]                     = createSignal('');
export const [updatingListEntryTitle, setUpdatingListEntryTitle] = createSignal('');
export const [updatingListEntryPass, setUpdatingListEntryPass]   = createSignal('');

export const [searchInput, setSearchInput]     = createSignal("");
export const [isSearching, setIsSearching]     = createSignal(false);
export const [searchArray, setSearchArray]     = createSignal<ReadAllResultTypes["PasswordEntry"]>([]);
export const [listRecentDel, setListRecentDel] = createSignal<ReadAllResultTypes["PasswordEntry"]>([]);