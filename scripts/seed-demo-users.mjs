const DEFAULT_BASE_URL = "https://sales-automation-api.azurewebsites.net";

const users = {
  admin: {
    email: "admin@salesautomation.com",
    firstName: "Admin",
    lastName: "User",
    password: "Admin@123",
    phoneNumber: "+27 71 000 0001",
    tenantName: "Shared Demo Tenant",
  },
  salesRep: {
    email: "salesrep@salesautomation.com",
    firstName: "Demo",
    lastName: "Rep",
    password: "Pass@123",
    phoneNumber: "+27 71 000 0002",
    role: "SalesRep",
  },
};

const baseUrl = (process.env.BACKEND_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

const request = async (path, init = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return {
    ok: response.ok,
    payload,
    status: response.status,
  };
};

const login = async (email, password) => {
  const response = await request("/api/auth/login", {
    body: JSON.stringify({ email, password }),
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      typeof response.payload === "object" && response.payload && "message" in response.payload
        ? response.payload.message
        : `Login failed for ${email} with status ${response.status}.`,
    );
  }

  return response.payload;
};

const register = async (payload) => {
  const response = await request("/api/auth/register", {
    body: JSON.stringify(payload),
    method: "POST",
  });

  if (response.ok) {
    return {
      created: true,
      payload: response.payload,
    };
  }

  return {
    created: false,
    payload: response.payload,
    status: response.status,
  };
};

const getMessage = (payload, fallback) => {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail;
    }

    if (typeof payload.title === "string" && payload.title.trim()) {
      return payload.title;
    }
  }

  return fallback;
};

const ensureAdmin = async () => {
  return {
    created: false,
    login: await login(users.admin.email, users.admin.password),
    warning: "Using documented shared-tenant admin account.",
  };
};

const ensureSalesRep = async (tenantId) => {
  const result = await register({
    ...users.salesRep,
    tenantId,
  });

  if (result.created) {
    return {
      created: true,
      login: result.payload,
    };
  }

  const salesRepLogin = await login(users.salesRep.email, users.salesRep.password);

  return {
    created: false,
    login: salesRepLogin,
    warning: getMessage(result.payload, "Sales rep already existed."),
  };
};

const main = async () => {
  console.log(`Seeding demo users against ${baseUrl}`);

  const admin = await ensureAdmin();
  const tenantId = admin.login?.tenantId;

  if (!tenantId) {
    throw new Error("Could not determine tenantId from admin account.");
  }

  const salesRep = await ensureSalesRep(tenantId);

  console.log("");
  console.log(`Admin:  ${users.admin.email} / ${users.admin.password}`);
  console.log(`SalesRep: ${users.salesRep.email} / ${users.salesRep.password}`);
  console.log(`Tenant: ${admin.login?.tenantName || users.admin.tenantName} (${tenantId})`);

  if (admin.warning) {
    console.log(`Admin note: ${admin.warning}`);
  }

  if (salesRep.warning) {
    console.log(`SalesRep note: ${salesRep.warning}`);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
