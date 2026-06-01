import { describe, expect, it } from "vitest";
import { canAccessResource, type Resource, type Role } from "../lib/permissions";

const roles: Role[] = ["admin", "dentist", "assistant"];
const clinical: Resource[] = [
  "patients",
  "appointments",
  "quotes",
  "prescriptions",
  "certificates",
];

describe("role permissions", () => {
  it("lets all roles CRUD clinical resources", () => {
    for (const role of roles) {
      for (const resource of clinical) {
        expect(canAccessResource(role, resource, "create")).toBe(true);
        expect(canAccessResource(role, resource, "read")).toBe(true);
        expect(canAccessResource(role, resource, "update")).toBe(true);
        expect(canAccessResource(role, resource, "delete")).toBe(true);
      }
    }
  });

  it("restricts users and catalog writes to admin", () => {
    expect(canAccessResource("admin", "users", "create")).toBe(true);
    expect(canAccessResource("dentist", "users", "read")).toBe(false);
    expect(canAccessResource("assistant", "users", "delete")).toBe(false);
    expect(canAccessResource("admin", "catalog", "update")).toBe(true);
    expect(canAccessResource("dentist", "catalog", "read")).toBe(true);
    expect(canAccessResource("assistant", "catalog", "read")).toBe(true);
    expect(canAccessResource("dentist", "catalog", "update")).toBe(false);
    expect(canAccessResource("assistant", "catalog", "delete")).toBe(false);
  });
});
