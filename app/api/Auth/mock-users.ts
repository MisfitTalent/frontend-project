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

const users = new Map<string, IMockUser>([
  [
    "admin@autosales.com",
    {
      email: "admin@autosales.com",
      firstName: "Admin",
      id: "legacy-admin",
      lastName: "User",
      password: "Admin123",
      role: "Admin",
      tenantId: "mock-tenant-autosales",
      tenantName: "AutoSales Mock Workspace",
    },
  ],
  [
    "admin@salesautomation.com",
    {
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

export const toAuthPayload = (user: IMockUser) => ({
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  roles: [user.role],
  tenantId: user.tenantId,
  tenantName: user.tenantName,
  token: createMockToken(user.email),
  userId: user.id,
});
