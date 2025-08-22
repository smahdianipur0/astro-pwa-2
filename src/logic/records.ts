import { dbquery, dbReadAll, type ReadAllResultTypes } from "../utils/surrealdb-indexed";
import { createStore, derive } from "../utils/state";
import { RecordId } from "surrealdb";

export const records = createStore({
	state: {
		vaultName: "",
		cardName: "",

		vaultsList: [] as ReadAllResultTypes["Vaults"] | [],
		cardsList: [] as ReadAllResultTypes["Cards"] | [],

		selectedVault: "",
		selectedCard: "",
	},

	methods: {
		setVaultName(value: string) {
			this.set("vaultName", value);
		},
		setCardName(value: string) {
			this.set("cardName", value);
		},

		async updateVaultsList() {
			this.set("vaultsList", (await dbReadAll("Vaults")) ?? []);
		},
		async updateCardsList() {
			if (this.get("selectedVault") !== "") {
				const result = await dbquery(
					`SELECT * FROM $vault -> Contain -> Cards;`,
					{ vault: new RecordId("Vaults", this.get("selectedVault").toString()) },
				);

				this.set("cardsList", result[0] ?? []);
			}
		},

		setSelectedVault(value: string) {
			this.set("selectedVault", value);
		},
		setSelectedCard(value: string) {
			this.set("selectedCard", value);
		},
	},

	derived: {
		editableVaultList: derive(["vaultsList"] as const, ({ get }) =>
			(get("vaultsList") as ReadAllResultTypes["Vaults"] | []).filter(
				(item) => item.status === "available" && item.role === "owner",
			),
		),
	},
});
