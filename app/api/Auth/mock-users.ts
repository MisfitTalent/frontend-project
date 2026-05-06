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

const users = new Map<string, IMockUser>([
  [
    "admin@autosales.com",
    {
      email: "admin@autosales.com",
      firstName: "Admin",
      id: "admin-shared-demo",
      lastName: "User",
      password: "Admin123",
      role: "Admin",
      tenantId: "11111111-1111-1111-1111-111111111111",
      tenantName: "Shared Demo Tenant",
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
      firstName: "Lebo",
      id: "tm02",
      lastName: "Dlamini",
      password: "Pass@123",
      role: "SalesRep",
      tenantId: "11111111-1111-1111-1111-111111111111",
      tenantName: "Shared Demo Tenant",
    },
  ],
  [
    "client@boxfusion.com",
    {
      clientIds: ["c1"],
      email: "client@boxfusion.com",
      firstName: "Boxfusion",
      id: "client-c1-user",
      lastName: "Client",
      password: "Pass@123",
      role: "Client",
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

export const toAuthPayload = (user: IMockUser) => ({
  clientIds: user.clientIds ?? null,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  roles: [user.role],
  tenantId: user.tenantId,
  tenantName: user.tenantName,
  token: createMockToken(user.email),
  userId: user.id,
});
