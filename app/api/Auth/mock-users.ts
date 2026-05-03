import type { AuthSessionUser } from "@/lib/auth/auth-contract";
import { MOCK_TEAM_MEMBERS } from "@/providers/salesFixtures";

export type MockUserRole =
  | "Admin"
  | "SalesManager"
  | "BusinessDevelopmentManager"
  | "SalesRep";

export interface IMockUser {
  clientIds?: string[];
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  password: string;
  role: MockUserRole;
  tenantId: string;
  tenantName: string;
}

const AUTO_SALES_TENANT_ID = "mock-tenant-autosales";
const AUTO_SALES_TENANT_NAME = "AutoSales Mock Workspace";
const AUTO_SALES_REP_PASSWORD = "Sales123";
const AUTO_SALES_ADMIN_MEMBER_IDS = new Set(["tm02"]);

const isClientFacingRole = (role: string) =>
  [
    "Account Executive",
    "Sales Consultant",
    "Client Success",
    "Business Development",
    "Pipeline Director",
  ].some((token) => role.includes(token));

const toAutoSalesRepEmail = (name: string) =>
  `${name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, ".")}@autosales.com`;

const createAutoSalesRepUser = (member: (typeof MOCK_TEAM_MEMBERS)[number]): IMockUser => {
  const [firstName, ...rest] = member.name.split(" ");

  return {
    clientIds: [],
    email: toAutoSalesRepEmail(member.name),
    firstName: firstName ?? member.name,
    id: member.id,
    lastName: rest.join(" ") || "Rep",
    password: AUTO_SALES_REP_PASSWORD,
    role: AUTO_SALES_ADMIN_MEMBER_IDS.has(member.id) ? "Admin" : "SalesRep",
    tenantId: AUTO_SALES_TENANT_ID,
    tenantName: AUTO_SALES_TENANT_NAME,
  };
};

const autoSalesRepUsers = MOCK_TEAM_MEMBERS.filter((member) =>
  isClientFacingRole(member.role),
).map(createAutoSalesRepUser);

const users = new Map<string, IMockUser>([
  [
    "admin@autosales.com",
    {
      clientIds: [],
      email: "admin@autosales.com",
      firstName: "Admin",
      id: "legacy-admin",
      lastName: "User",
      password: "Admin123",
      role: "Admin",
      tenantId: AUTO_SALES_TENANT_ID,
      tenantName: AUTO_SALES_TENANT_NAME,
    },
  ],
  [
    "clients@autosales.com",
    {
      clientIds: ["c1"],
      email: "clients@autosales.com",
      firstName: "Client",
      id: "legacy-client-viewer",
      lastName: "Tester",
      password: "Clients123",
      role: "SalesRep",
      tenantId: AUTO_SALES_TENANT_ID,
      tenantName: AUTO_SALES_TENANT_NAME,
    },
  ],
  [
    "salesrep@autosales.com",
    {
      clientIds: [],
      email: "salesrep@autosales.com",
      firstName: "Lebo",
      id: "tm02",
      lastName: "Dlamini",
      password: AUTO_SALES_REP_PASSWORD,
      role: "Admin",
      tenantId: AUTO_SALES_TENANT_ID,
      tenantName: AUTO_SALES_TENANT_NAME,
    },
  ],
  [
    "admin@salesautomation.com",
    {
      clientIds: [],
      email: "admin@salesautomation.com",
      firstName: "Admin",
      id: "1",
      lastName: "User",
      password: "Admin@123",
      role: "Admin",
      tenantId: "11111111-1111-1111-1111-111111111111",
      tenantName: "Shared Demo Tenant",
    },
  ],
  [
    "salesrep@salesautomation.com",
    {
      clientIds: [],
      email: "salesrep@salesautomation.com",
      firstName: "Demo",
      id: "2",
      lastName: "Rep",
      password: "Pass@123",
      role: "SalesRep",
      tenantId: "11111111-1111-1111-1111-111111111111",
      tenantName: "Shared Demo Tenant",
    },
  ],
  ...autoSalesRepUsers.map((user) => [user.email, user] as const),
]);

let nextId = 3;

export const findUserByEmail = (email: string) => users.get(email.toLowerCase());

export const createMockToken = (email: string) =>
  `mock-token::${email.toLowerCase()}::${Date.now()}`;

export const getUserFromToken = (token: string) => {
  const parts = token.split("::");
  const email = parts[1];

  return email ? findUserByEmail(email) : undefined;
};

export const registerMockUser = ({
  email,
  firstName,
  lastName,
  password,
  role,
  tenantName,
}: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: MockUserRole;
  tenantName?: string;
}) => {
  const normalizedEmail = email.toLowerCase();

  if (users.has(normalizedEmail)) {
    return null;
  }

  const user: IMockUser = {
    clientIds: [],
    email: normalizedEmail,
    firstName,
    id: String(nextId++),
    lastName,
    password,
    role,
    tenantId: "11111111-1111-1111-1111-111111111111",
    tenantName: tenantName || "Shared Demo Tenant",
  };

  users.set(normalizedEmail, user);

  return user;
};

export const toAuthPayload = (user: IMockUser): AuthSessionUser => ({
  clientIds: user.clientIds ?? [],
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  roles: [user.role],
  tenantId: user.tenantId,
  tenantName: user.tenantName,
  token: createMockToken(user.email),
  userId: user.id,
});
