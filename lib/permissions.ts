export type Role = "admin" | "dentist" | "assistant";
export type Action = "create" | "read" | "update" | "delete";
export type Resource =
  | "users"
  | "catalog"
  | "patients"
  | "appointments"
  | "quotes"
  | "prescriptions"
  | "certificates";

const clinicalResources: Resource[] = [
  "patients",
  "appointments",
  "quotes",
  "prescriptions",
  "certificates",
];

export function canAccessResource(role: Role, resource: Resource, action: Action) {
  if (role === "admin") return true;
  if (clinicalResources.includes(resource)) return true;
  if (resource === "catalog" && action === "read") return true;
  return false;
}
