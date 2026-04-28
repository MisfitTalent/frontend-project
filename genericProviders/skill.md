---

name: generic-provider

description: >

  Use this skill whenever the user wants to create, update, or modify a React context

  provider for any feature — CRUD entities, auth, settings, notifications, or any

  other domain concept. Triggers include: "create a provider for X", "add a context

  for X", "build a provider that fetches X", "I need state management for X",

  "scaffold a context for X", "add a new provider", "update the provider for X",

  or any request to manage shared state or API calls through React context.

  Always use this skill when the data comes from an ABP backend, because the

  interfaces, DTOs, and API URL shape must be derived from the backend service —

  not invented. Use this skill even if the user just says "I need to manage X in

  the frontend" and X maps to a known backend entity.

---
 
# Generic Provider Skill
 
Scaffolds a React context provider using `useReducer` + `redux-actions`, with

interfaces derived from the ABP backend DTOs.
 
## Provider file structure
 
Every provider lives in its own folder under `src/providers/`:
 
```

src/providers/

└── {entity-name}-provider/

    ├── context.tsx    ← interfaces derived from backend DTO + createContext

    ├── actions.tsx    ← redux-actions createAction calls

    ├── reducer.tsx    ← handleActions reducer

    └── index.tsx      ← Provider component + useXxxState + useXxxAction hooks

```
 
---
 
## Step 0 — Derive interfaces from the backend DTO (always do this first)
 
Before writing any TypeScript, locate the backend DTO for the entity.
 
**Where to look:**

```

src/{App}.Application/Services/{EntityName}Service/DTO/{EntityName}Dto.cs

```
 
**Mapping rules — C# → TypeScript:**
 
| C# type | TypeScript type | Notes |

|---|---|---|

| `string` | `string` | |

| `int`, `float`, `double`, `decimal` | `number` | |

| `long` | `number` | ABP user IDs are int64 — keep as `number` |

| `bool` | `boolean` | |

| `Guid` | `string` | GUIDs arrive as UUID strings over the wire |

| `DateTime` | `string` | ISO 8601 string from JSON |

| `T?` / nullable | `T \| null` or optional `T?` | Prefer optional for DTO fields |

| `List<T>` / `ICollection<T>` | `T[]` | |

| `enum` stored as string | `string` or a string union type | |

| Nested DTO | Nested interface | |
 
**Example — C# DTO → TypeScript interface:**
 
```csharp

// Backend: LeaveRequestDto.cs

[AutoMap(typeof(LeaveRequest))]

public class LeaveRequestDto : EntityDto<Guid>

{

    public Guid EmployeeId { get; set; }

    public string EmployeeName { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public int TotalDays { get; set; }

    public string Status { get; set; }        // enum stored as string

    public string? Notes { get; set; }        // nullable

}

```
 
```typescript

// Frontend: context.tsx — derived interface

export interface I{EntityName} {

  id: string;             // Guid → string

  employeeId: string;     // Guid → string

  employeeName: string;

  startDate: string;      // DateTime → string (ISO 8601)

  endDate: string;

  totalDays: number;      // int → number

  status: string;         // enum as string

  notes?: string;         // nullable → optional

}

```
 
If a `Create{EntityName}Dto` exists in the backend, derive a separate `ICreate{EntityName}Input` interface from it for the action payload. Do the same for `Update{EntityName}Dto`.
 
> **Read** `references/dto-mapping.md` for mapping edge cases: enums as union types, nested DTOs, pagination wrappers, and ABP result envelopes.
 
---
 
## Step 1 — context.tsx
 
```typescript

"use client";

import { createContext } from "react";

import { I{EntityName} } from "./types"; // or define inline
 
export interface I{EntityName}StateContext {

  isPending: boolean;

  isSuccess: boolean;

  isError: boolean;

  items: I{EntityName}[];            // list result

  selected?: I{EntityName};          // single selected item (detail/edit)

  totalCount: number;                // for pagination

}
 
export interface I{EntityName}ActionContext {

  fetchAll: (params?: Record<string, unknown>) => void;

  fetchById: (id: string) => void;

  create: (input: ICreate{EntityName}Input) => void;

  update: (id: string, input: IUpdate{EntityName}Input) => void;

  remove: (id: string) => void;

}
 
// Input interfaces — derived from Create/Update DTOs

export interface ICreate{EntityName}Input {

  // mirror Create{EntityName}Dto fields

}
 
export interface IUpdate{EntityName}Input {

  // mirror Update{EntityName}Dto fields

}
 
export const INITIAL_STATE: I{EntityName}StateContext = {

  isPending: false,

  isSuccess: false,

  isError: false,

  items: [],

  totalCount: 0,

};
 
export const {EntityName}StateContext  = createContext<I{EntityName}StateContext>(INITIAL_STATE);

export const {EntityName}ActionContext = createContext<I{EntityName}ActionContext>({

  fetchAll:  () => {},

  fetchById: () => {},

  create:    () => {},

  update:    () => {},

  remove:    () => {},

});

```
 
**Adapt the state shape to what the feature actually needs:**

- Read-only list view → keep `items` + `totalCount`, drop `selected`

- Detail/edit view → add `selected`

- No pagination needed → drop `totalCount`

- Auth / session → see `references/auth-provider.md` for the special ABP auth shape
 
---
 
## Step 2 — actions.tsx
 
```typescript

import { createAction } from "redux-actions";

import { I{EntityName}StateContext, I{EntityName} } from "./context";
 
export enum {EntityName}ActionEnums {

  FETCH_ALL_PENDING   = "{ENTITY}_FETCH_ALL_PENDING",

  FETCH_ALL_SUCCESS   = "{ENTITY}_FETCH_ALL_SUCCESS",

  FETCH_ALL_ERROR     = "{ENTITY}_FETCH_ALL_ERROR",
 
  FETCH_BY_ID_PENDING = "{ENTITY}_FETCH_BY_ID_PENDING",

  FETCH_BY_ID_SUCCESS = "{ENTITY}_FETCH_BY_ID_SUCCESS",

  FETCH_BY_ID_ERROR   = "{ENTITY}_FETCH_BY_ID_ERROR",
 
  CREATE_PENDING      = "{ENTITY}_CREATE_PENDING",

  CREATE_SUCCESS      = "{ENTITY}_CREATE_SUCCESS",

  CREATE_ERROR        = "{ENTITY}_CREATE_ERROR",
 
  UPDATE_PENDING      = "{ENTITY}_UPDATE_PENDING",

  UPDATE_SUCCESS      = "{ENTITY}_UPDATE_SUCCESS",

  UPDATE_ERROR        = "{ENTITY}_UPDATE_ERROR",
 
  DELETE_PENDING      = "{ENTITY}_DELETE_PENDING",

  DELETE_SUCCESS      = "{ENTITY}_DELETE_SUCCESS",

  DELETE_ERROR        = "{ENTITY}_DELETE_ERROR",

}
 
// ── Fetch all ────────────────────────────────────────────────

export const fetchAllPending = createAction<I{EntityName}StateContext>(

  {EntityName}ActionEnums.FETCH_ALL_PENDING,

  () => ({ isPending: true, isSuccess: false, isError: false })

);

export const fetchAllSuccess = createAction<

  I{EntityName}StateContext,

  { items: I{EntityName}[]; totalCount: number }
>(

  {EntityName}ActionEnums.FETCH_ALL_SUCCESS,

  ({ items, totalCount }) => ({

    isPending: false, isSuccess: true, isError: false, items, totalCount,

  })

);

export const fetchAllError = createAction<I{EntityName}StateContext>(

  {EntityName}ActionEnums.FETCH_ALL_ERROR,

  () => ({ isPending: false, isSuccess: false, isError: true })

);
 
// ── Fetch by ID ──────────────────────────────────────────────

export const fetchByIdPending = createAction<I{EntityName}StateContext>(

  {EntityName}ActionEnums.FETCH_BY_ID_PENDING,

  () => ({ isPending: true, isSuccess: false, isError: false })

);

export const fetchByIdSuccess = createAction<I{EntityName}StateContext, I{EntityName}>(

  {EntityName}ActionEnums.FETCH_BY_ID_SUCCESS,

  (selected) => ({ isPending: false, isSuccess: true, isError: false, selected })

);

export const fetchByIdError = createAction<I{EntityName}StateContext>(

  {EntityName}ActionEnums.FETCH_BY_ID_ERROR,

  () => ({ isPending: false, isSuccess: false, isError: true })

);
 
// ── Create ───────────────────────────────────────────────────

export const createPending = createAction<I{EntityName}StateContext>(

  {EntityName}ActionEnums.CREATE_PENDING,

  () => ({ isPending: true, isSuccess: false, isError: false })

);

export const createSuccess = createAction<I{EntityName}StateContext, I{EntityName}>(

  {EntityName}ActionEnums.CREATE_SUCCESS,

  (created) => ({ isPending: false, isSuccess: true, isError: false, selected: created })

);

export const createError = createAction<I{EntityName}StateContext>(

  {EntityName}ActionEnums.CREATE_ERROR,

  () => ({ isPending: false, isSuccess: false, isError: true })

);
 
// ── Update ───────────────────────────────────────────────────

export const updatePending = createAction<I{EntityName}StateContext>(

  {EntityName}ActionEnums.UPDATE_PENDING,

  () => ({ isPending: true, isSuccess: false, isError: false })

);

export const updateSuccess = createAction<I{EntityName}StateContext, I{EntityName}>(

  {EntityName}ActionEnums.UPDATE_SUCCESS,

  (updated) => ({ isPending: false, isSuccess: true, isError: false, selected: updated })

);

export const updateError = createAction<I{EntityName}StateContext>(

  {EntityName}ActionEnums.UPDATE_ERROR,

  () => ({ isPending: false, isSuccess: false, isError: true })

);
 
// ── Delete ───────────────────────────────────────────────────

export const deletePending = createAction<I{EntityName}StateContext>(

  {EntityName}ActionEnums.DELETE_PENDING,

  () => ({ isPending: true, isSuccess: false, isError: false })

);

export const deleteSuccess = createAction<I{EntityName}StateContext>(

  {EntityName}ActionEnums.DELETE_SUCCESS,

  () => ({ isPending: false, isSuccess: true, isError: false })

);

export const deleteError = createAction<I{EntityName}StateContext>(

  {EntityName}ActionEnums.DELETE_ERROR,

  () => ({ isPending: false, isSuccess: false, isError: true })

);

```
 
**Only include the action groups the feature actually needs.** A read-only list doesn't need create/update/delete actions.
 
---
 
## Step 3 — reducer.tsx
 
```typescript

import { handleActions } from "redux-actions";

import { INITIAL_STATE, I{EntityName}StateContext } from "./context";

import { {EntityName}ActionEnums } from "./actions";
 
export const {EntityName}Reducer = handleActions<

  I{EntityName}StateContext,

  I{EntityName}StateContext
>(

  {

    [{EntityName}ActionEnums.FETCH_ALL_PENDING]:   (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.FETCH_ALL_SUCCESS]:   (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.FETCH_ALL_ERROR]:     (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.FETCH_BY_ID_PENDING]: (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.FETCH_BY_ID_SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.FETCH_BY_ID_ERROR]:   (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.CREATE_PENDING]:      (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.CREATE_SUCCESS]:      (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.CREATE_ERROR]:        (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.UPDATE_PENDING]:      (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.UPDATE_SUCCESS]:      (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.UPDATE_ERROR]:        (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.DELETE_PENDING]:      (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.DELETE_SUCCESS]:      (state, { payload }) => ({ ...state, ...payload }),

    [{EntityName}ActionEnums.DELETE_ERROR]:        (state, { payload }) => ({ ...state, ...payload }),

  },

  INITIAL_STATE

);

```
 
Only include cases for the actions you defined. All cases follow the same spread pattern — no custom case logic needed unless the feature requires it (e.g., optimistic updates, list mutation after delete).
 
---
 
## Step 4 — index.tsx
 
```typescript

"use client";

import { useContext, useReducer } from "react";

import { getAxiosInstance } from "@/utils/axiosInstance";

import { {EntityName}Reducer } from "./reducer";

import {

  INITIAL_STATE,

  {EntityName}StateContext,

  {EntityName}ActionContext,

  ICreate{EntityName}Input,

  IUpdate{EntityName}Input,

} from "./context";

import {

  fetchAllPending, fetchAllSuccess, fetchAllError,

  fetchByIdPending, fetchByIdSuccess, fetchByIdError,

  createPending, createSuccess, createError,

  updatePending, updateSuccess, updateError,

  deletePending, deleteSuccess, deleteError,

} from "./actions";
 
export const {EntityName}Provider = ({ children }: { children: React.ReactNode }) => {

  const instance = getAxiosInstance();

  const [state, dispatch] = useReducer({EntityName}Reducer, INITIAL_STATE);
 
  // ABP standard CRUD URL pattern:

  //   GET    /api/services/app/{EntityName}/GetAll

  //   GET    /api/services/app/{EntityName}/Get?id=

  //   POST   /api/services/app/{EntityName}/Create

  //   PUT    /api/services/app/{EntityName}/Update

  //   DELETE /api/services/app/{EntityName}/Delete?id=

  const BASE = "/api/services/app/{EntityName}";
 
  const fetchAll = async (params?: Record<string, unknown>) => {

    dispatch(fetchAllPending());

    try {

      const res = await instance.get(`${BASE}/GetAll`, { params });

      // ABP wraps paginated results: res.data.result.items + res.data.result.totalCount

      const { items, totalCount } = res.data.result;

      dispatch(fetchAllSuccess({ items, totalCount }));

    } catch {

      dispatch(fetchAllError());

    }

  };
 
  const fetchById = async (id: string) => {

    dispatch(fetchByIdPending());

    try {

      const res = await instance.get(`${BASE}/Get`, { params: { id } });

      dispatch(fetchByIdSuccess(res.data.result));

    } catch {

      dispatch(fetchByIdError());

    }

  };
 
  const create = async (input: ICreate{EntityName}Input) => {

    dispatch(createPending());

    try {

      const res = await instance.post(`${BASE}/Create`, input);

      dispatch(createSuccess(res.data.result));

    } catch {

      dispatch(createError());

    }

  };
 
  const update = async (id: string, input: IUpdate{EntityName}Input) => {

    dispatch(updatePending());

    try {

      const res = await instance.put(`${BASE}/Update`, { id, ...input });

      dispatch(updateSuccess(res.data.result));

    } catch {

      dispatch(updateError());

    }

  };
 
  const remove = async (id: string) => {

    dispatch(deletePending());

    try {

      await instance.delete(`${BASE}/Delete`, { params: { id } });

      dispatch(deleteSuccess());

    } catch {

      dispatch(deleteError());

    }

  };
 
  return (
<{EntityName}StateContext.Provider value={state}>
<{EntityName}ActionContext.Provider value={{ fetchAll, fetchById, create, update, remove }}>

        {children}
</{EntityName}ActionContext.Provider>
</{EntityName}StateContext.Provider>

  );

};
 
export const use{EntityName}State = () => {

  const context = useContext({EntityName}StateContext);

  if (!context) throw new Error("use{EntityName}State must be used within {EntityName}Provider");

  return context;

};
 
export const use{EntityName}Action = () => {

  const context = useContext({EntityName}ActionContext);

  if (!context) throw new Error("use{EntityName}Action must be used within {EntityName}Provider");

  return context;

};

```
 
> **For auth/session providers** (login, register, logout, token storage) read `references/auth-provider.md` — the ABP auth endpoint has a different URL and response shape.
 
---
 
## Step 5 — Register in provider composition
 
After creating or updating any provider, register it in the shared composition file.
 
### 5.1 — Find the composition file
 
Look for one of these (read it if it exists):

- `src/providers/index.tsx`

- `src/providers/AppProviders.tsx`

- `src/providers/Providers.tsx`
 
If none exists, create `src/providers/index.tsx`.
 
### 5.2 — Nesting order rule
 
```

AuthProvider              ← outermost — always first

  ThemeProvider           ← style / tokens

    QueryProvider         ← server state / cache (React Query etc.)

      Domain providers    ← feature providers (the one you just built)

        {children}        ← innermost

```
 
### 5.3 — Composition file shape
 
```tsx

'use client';
 
import { AuthProvider }          from './auth-provider';

import { ThemeProvider }         from './theme-provider';

import { {EntityName}Provider }  from './{entity-name}-provider';

// … other providers …
 
interface AppProvidersProps {

  children: React.ReactNode;

}
 
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {

  return (
<AuthProvider>
<ThemeProvider>
<{EntityName}Provider>

          {children}
</{EntityName}Provider>
</ThemeProvider>
</AuthProvider>

  );

};

```
 
Rules:

- Preserve the existing composition name (don't rename `AppProviders` to something else).

- Do not double-wrap a provider already nested inside another.

- Pure composition only — no logic, state, or effects here.
 
### 5.4 — Verify root layout
 
Check `src/app/layout.tsx`. If `AppProviders` is already wrapping `{children}`, no change needed. If the composition file is new, add it:
 
```tsx

import { AppProviders } from '@/providers';
 
export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
<html>
<body>
<AppProviders>{children}</AppProviders>
</body>
</html>

  );

}

```
 
### 5.5 — Report
 
After completing provider composition, summarise:

- Provider name and folder path created

- Interfaces derived from which backend DTO(s)

- Actions included (list the operation names)

- Providers in composition (outermost → innermost)

- Whether the root layout needed updating
 
---
 
## Checklist before finishing
 
- [ ] Interfaces derived from actual backend DTOs — no invented field names

- [ ] `Guid` → `string`, `long` → `number`, `DateTime` → `string`, nullable → optional

- [ ] Only the actions the feature needs are included (no unused CRUD if it's read-only)

- [ ] ABP URL pattern used: `/api/services/app/{EntityName}/{Method}`

- [ ] ABP result unwrapped: `res.data.result` (not `res.data`)

- [ ] Paginated response unwrapped: `res.data.result.items` + `res.data.result.totalCount`

- [ ] `"use client"` present on `context.tsx` and `index.tsx`

- [ ] Provider registered in composition file with correct nesting order

- [ ] Root layout verified
 