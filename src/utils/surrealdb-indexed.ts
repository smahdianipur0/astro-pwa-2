import { Surreal } from "surrealdb";
import { surrealdbWasmEngines } from "@surrealdb/wasm";
import type { dbBaseType } from "./surrealdb-utils";
import { dbCreate, dbUpdate, dbDelete, dbGetAll, dbGetById } from "./surrealdb-utils";

async function getDb() {
	const db = new Surreal({
		engines: surrealdbWasmEngines(),
	});
	try {
		await db.connect("indxdb://demo");
		await db.use({ namespace: "hello", database: "demodb" });
		return db;
	} catch (err) {
		console.error("Failed to connect to SurrealDB:", err instanceof Error ? err.message : String(err));
		await db.close();
		throw err;
	}
}

// Specific types for each table
export type PasswordEntry = dbBaseType & {
	title: string;
	password: string;
};

export type EmailEntry = dbBaseType & {
	email: string;
	createdAt?: string;
};

// Password entries
export async function createPasswordEntry(title: string, password: string): Promise<void> {
	await dbCreate<PasswordEntry>(getDb, "PasswordEntry", { title, password });
}

export async function updatePasswordEntry(id: string, title: string, password: string): Promise<void> {
	await dbUpdate<PasswordEntry>(getDb, "PasswordEntry", id, { title, password });
}

export async function deletePasswordEntry(id: string): Promise<void> {
	await dbDelete(getDb, "PasswordEntry", id);
}

export async function getAllPasswordEntries(): Promise<PasswordEntry[] | undefined> {
	return await dbGetAll<PasswordEntry>(getDb, "PasswordEntry");
}

// Recent Deleted Passwords
export async function createRecentDelPass(title: string, password: string): Promise<void> {
	await dbCreate<PasswordEntry>(getDb, "RecentDelPass", { title, password });
}

export async function deleteRecentDelPass(id: string): Promise<void> {
	await dbDelete(getDb, "RecentDelPass", id);
}

export async function getAllRecentDelPass(): Promise<PasswordEntry[] | undefined> {
	return await dbGetAll<PasswordEntry>(getDb, "RecentDelPass");
}

// Email entries
export async function createEmailEntry(email: string): Promise<void> {
	await dbCreate<EmailEntry>(getDb, "Emails", {
		email,
		createdAt: new Date().toISOString(),
	});
}

export async function getAllEmails(): Promise<EmailEntry[] | undefined> {
	return await dbGetAll<EmailEntry>(getDb, "Emails");
}

export async function deleteEmail(id: string): Promise<void> {
	await dbDelete(getDb, "Emails", id);
}

// get an entry by ID
export async function getEntryById<T extends dbBaseType>(tableName: string, id: string): Promise<T | undefined> {
	return await dbGetById<T>(getDb, tableName, id);
}
