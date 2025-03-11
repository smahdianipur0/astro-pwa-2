// Roles
export enum Role {
    OWNER = "owner",
    VIEWER = "viewer",
}

// actions
const vaultActions = ["create", "delete", "read"] as const;
const cardActions = ["add", "remove", "edit"] as const;

// type-safe permission strings
type VaultPermission = `vault:${typeof vaultActions[number]}`;
type CardPermission = `card:${typeof cardActions[number]}`;
export type Permission = VaultPermission | CardPermission;

// role-based permissions
export const rolePermissions: Record<Role, Permission[]> = {
[Role.OWNER]: [
    // Vault permissions
    "vault:create", 
    "vault:delete", 
    "vault:read",
    // Card permissions
    "card:add", 
    "card:remove", 
    "card:edit"
],
[Role.VIEWER]: ["vault:read"], 
};

// check if a role has a required permission
export function hasPermission(role: Role, requiredPermission: Permission): boolean {
return rolePermissions[role]?.includes(requiredPermission) ?? false;
}

// check if a user can create a new vault
export function canCreateVault(vaultCount: number): boolean {
return vaultCount < 3; // Maximum 3 vaults per user
}