import { createSignal } from "solid-js";
import { type ReadAllResultTypes } from "../utils/surrealdb-indexed"

export const [createVaultName, setCreateVaultName]     = createSignal("");
export const [vaultsList, setVaultsList]               = createSignal<ReadAllResultTypes["Vaults"]>([]);
export const [editableVaultList, setEditableVaultList] = createSignal<ReadAllResultTypes["Vaults"]>([]);
export const [creationAllowed, setCreationAllowed]     = createSignal(true);
export const [selectedVault, setSelectedVault]         = createSignal("");

export const [cardsList, setcardsList]                       = createSignal<ReadAllResultTypes["Cards"]>([]);
export const [addCardSelectedVault, setAddCardSelectedVault] = createSignal("");
export const [selectedCard, setSelectedCard]                 = createSignal("");
export const [cardName, setCardName]                         = createSignal("");