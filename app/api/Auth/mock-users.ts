import type { AuthSessionUser } from "@/lib/auth/auth-contract";
import { MOCK_TEAM_MEMBERS } from "@/providers/salesFixtures";

export type MockUserRole =
  | "Admin"
  | "SalesManager"
  | "BusinessDevelopmentManager"
  | "SalesRep"
  | "Client";

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
const SHARED_DEMO_TENANT_ID = "11111111-1111-1111-1111-111111111111";
const SHARED_DEMO_TENANT_NAME = "Shared Demo Tenant";
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

const createTenantBoundUser = (
  tenant: { id: string; name: string },
  user: Omit<IMockUser, "tenantId" | "tenantName">,
): IMockUser => ({
  ...user,
  tenantId: tenant.id,
  tenantName: tenant.name,
});

const createAutoSalesUser = (
  user: Omit<IMockUser, "tenantId" | "tenantName">,
): IMockUser =>
  createTenantBoundUser(
    {
      id: AUTO_SALES_TENANT_ID,
      name: AUTO_SALES_TENANT_NAME,
    },
    user,
  );

const createSharedDemoUser = (
  user: Omit<IMockUser, "tenantId" | "tenantName">,
): IMockUser =>
  createTenantBoundUser(
    {
      id: SHARED_DEMO_TENANT_ID,
      name: SHARED_DEMO_TENANT_NAME,
    },
    user,
  );

const createAutoSalesRepUser = (member: (typeof MOCK_TEAM_MEMBERS)[number]): IMockUser => {
  const [firstName, ...rest] = member.name.split(" ");

  return createAutoSalesUser({
    clientIds: [],
    email: toAutoSalesRepEmail(member.name),
    firstName: firstName ?? member.name,
    id: member.id,
    lastName: rest.join(" ") || "Rep",
    password: AUTO_SALES_REP_PASSWORD,
    role: AUTO_SALES_ADMIN_MEMBER_IDS.has(member.id) ? "Admin" : "SalesRep",
  });
};

const autoSalesRepUsers = MOCK_TEAM_MEMBERS.filter((member) =>
  isClientFacingRole(member.role),
).map(createAutoSalesRepUser);

const validateMockUserConfiguration = (entries: Map<string, IMockUser>) => {
  for (const [email, user] of entries) {
    if (email.endsWith("@autosales.com") && user.tenantId !== AUTO_SALES_TENANT_ID) {
      throw new Error(`Mock user ${email} must belong to the AutoSales tenant.`);
    }

    if (email === "clients@autosales.com" && user.role !== "Client") {
      throw new Error("clients@autosales.com must be configured as a Client user.");
    }
  }
};

const users = new Map<string, IMockUser>([
  [
    "admin@autosales.com",
    createAutoSalesUser({
      clientIds: [],
      email: "admin@autosales.com",
      firstName: "Admin",
      id: "admin-autosales",
      lastName: "User",
      password: "Admin123",
      role: "Admin",
    }),
  ],
  [
    "clients@autosales.com",
    createAutoSalesUser({
      clientIds: ["c1"],
      email: "clients@autosales.com",
      firstName: "Client",
      id: "legacy-client-viewer",
      lastName: "Tester",
      password: "Clients123",
      role: "Client",
    }),
  ],
  [
    "salesrep@autosales.com",
    createAutoSalesUser({
      clientIds: [],
      email: "salesrep@autosales.com",
      firstName: "Lebo",
      id: "tm02",
      lastName: "Dlamini",
      password: AUTO_SALES_REP_PASSWORD,
      role: "Admin",
    }),
  ],
  [
    "admin@salesautomation.com",
    createSharedDemoUser({
      clientIds: [],
      email: "admin@salesautomation.com",
      firstName: "Admin",
      id: "1",
      lastName: "User",
      password: "Admin@123",
      role: "Admin",
    }),
  ],
  [
    "salesrep@salesautomation.com",
    createSharedDemoUser({
      clientIds: [],
      email: "salesrep@salesautomation.com",
      firstName: "Lebo",
      id: "tm02",
      lastName: "Dlamini",
      password: "Pass@123",
      role: "SalesRep",
    }),
  ],
  [
    "client@boxfusion.com",
    createSharedDemoUser({
      clientIds: ["c1"],
      email: "client@boxfusion.com",
      firstName: "Boxfusion",
      id: "client-c1-user",
      lastName: "Client",
      password: "Pass@123",
      role: "Client",
    }),
  ],
  ...autoSalesRepUsers.map((user) => [user.email, user] as const),
]);

validateMockUserConfiguration(users);

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
    tenantId: SHARED_DEMO_TENANT_ID,
    tenantName: tenantName || SHARED_DEMO_TENANT_NAME,
  };

  users.set(normalizedEmail, user);

  return user;
};

export const updateMockUser = (
  email: string,
  updates: Partial<Pick<IMockUser, "firstName" | "lastName" | "tenantName">>,
) => {
  const normalizedEmail = email.toLowerCase();
  const existingUser = users.get(normalizedEmail);

  if (!existingUser) {
    return null;
  }

  const nextUser: IMockUser = {
    ...existingUser,
    firstName: updates.firstName ?? existingUser.firstName,
    lastName: updates.lastName ?? existingUser.lastName,
    tenantName: updates.tenantName ?? existingUser.tenantName,
  };

  users.set(normalizedEmail, nextUser);

  return nextUser;
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
