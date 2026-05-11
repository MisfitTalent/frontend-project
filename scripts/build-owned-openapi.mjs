import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "swagger-live.json");
const targetPath = path.join(root, "openapi", "owned-sales-automation.json");

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const selectedPaths = [
  "/api/Auth/login",
  "/api/Auth/register",
  "/api/Auth/me",
  "/api/Clients",
  "/api/Clients/{id}",
  "/api/Contacts",
  "/api/Contacts/{id}",
  "/api/Contacts/by-client/{clientId}",
  "/api/Opportunities",
  "/api/Opportunities/{id}",
  "/api/Opportunities/{id}/stage",
  "/api/Opportunities/{id}/assign",
  "/api/Proposals",
  "/api/Proposals/{id}",
  "/api/Proposals/{id}/submit",
  "/api/Proposals/{id}/approve",
  "/api/Proposals/{id}/reject",
  "/api/PricingRequests",
  "/api/PricingRequests/{id}",
  "/api/PricingRequests/{id}/assign",
  "/api/PricingRequests/{id}/complete",
  "/api/Activities",
  "/api/Activities/{id}",
  "/api/Activities/{id}/complete",
  "/api/Activities/{id}/cancel",
  "/api/Notes",
  "/api/Notes/{id}",
  "/api/Users",
  "/api/Users/{id}",
];

const ownedWorkflowPaths = {
  "/api/service-requests": {
    get: {
      tags: ["ServiceRequests"],
      summary: "List service requests visible to the current user.",
      parameters: [
        {
          name: "status",
          in: "query",
          schema: {
            type: "string",
          },
          description: "Comma-separated statuses to filter by.",
        },
      ],
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ServiceRequestPagedResult",
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["ServiceRequests"],
      summary: "Create a new client or admin service request.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/CreateServiceRequestDto",
            },
          },
        },
      },
      responses: {
        201: {
          description: "Created",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ServiceRequestDto",
              },
            },
          },
        },
        400: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ProblemDetails",
              },
            },
          },
        },
        403: {
          description: "Forbidden",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ProblemDetails",
              },
            },
          },
        },
      },
    },
  },
  "/api/service-requests/{requestId}": {
    get: {
      tags: ["ServiceRequests"],
      summary: "Get the detail view for a single service request.",
      parameters: [
        {
          name: "requestId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ServiceRequestDetailDto",
              },
            },
          },
        },
        404: {
          description: "Not Found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ProblemDetails",
              },
            },
          },
        },
      },
    },
  },
  "/api/service-requests/{requestId}/review": {
    post: {
      tags: ["ServiceRequests"],
      summary: "Mark a service request as under review.",
      parameters: [
        {
          name: "requestId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ServiceRequestDto",
              },
            },
          },
        },
      },
    },
  },
  "/api/service-requests/{requestId}/opportunity": {
    post: {
      tags: ["ServiceRequests"],
      summary: "Create or link an opportunity for a service request.",
      parameters: [
        {
          name: "requestId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ServiceRequestOpportunityDto",
            },
          },
        },
      },
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/OpportunityDto",
              },
            },
          },
        },
      },
    },
  },
  "/api/service-requests/{requestId}/proposal": {
    post: {
      tags: ["ServiceRequests"],
      summary: "Create or link a proposal for a service request.",
      parameters: [
        {
          name: "requestId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ServiceRequestProposalDto",
            },
          },
        },
      },
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ProposalWithLineItemsDto",
              },
            },
          },
        },
      },
    },
  },
  "/api/service-requests/{requestId}/assignments": {
    post: {
      tags: ["ServiceRequests"],
      summary: "Assign one or more representatives to a service request.",
      parameters: [
        {
          name: "requestId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/CreateServiceRequestAssignmentsDto",
            },
          },
        },
      },
      responses: {
        201: {
          description: "Created",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ServiceRequestAssignmentsResponseDto",
              },
            },
          },
        },
      },
    },
  },
  "/api/service-requests/{requestId}/client-decision": {
    post: {
      tags: ["ServiceRequests"],
      summary: "Apply the client's approval or rejection of proposed assignments.",
      parameters: [
        {
          name: "requestId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ServiceRequestDecisionDto",
            },
          },
        },
      },
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ServiceRequestDto",
              },
            },
          },
        },
      },
    },
  },
  "/api/service-requests/{requestId}/rep-decision": {
    post: {
      tags: ["ServiceRequests"],
      summary: "Apply the representative's acceptance or rejection of an assignment.",
      parameters: [
        {
          name: "requestId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ServiceRequestRepDecisionDto",
            },
          },
        },
      },
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ServiceRequestDto",
              },
            },
          },
        },
      },
    },
  },
};

const ownedWorkflowSchemas = {
  ServiceRequestStatus: {
    type: "string",
    enum: [
      "submitted",
      "under_review",
      "proposal_prepared",
      "awaiting_client_assignment_approval",
      "client_rejected_assignment",
      "client_approved_assignment",
      "awaiting_rep_acceptance",
      "rep_rejected_assignment",
      "active",
      "closed",
      "cancelled",
    ],
  },
  ServiceRequestPriority: {
    type: "string",
    enum: ["low", "medium", "high", "critical"],
  },
  AssignmentDecision: {
    type: "string",
    enum: ["approve", "reject", "accept"],
  },
  ServiceRequestDto: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string" },
      tenantId: { type: "string", format: "uuid" },
      clientId: { type: "string", format: "uuid" },
      submittedByUserId: { type: "string", format: "uuid" },
      title: { type: "string" },
      description: { type: "string" },
      requestType: { type: "string" },
      status: { $ref: "#/components/schemas/ServiceRequestStatus" },
      priority: { $ref: "#/components/schemas/ServiceRequestPriority" },
      source: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "tenantId",
      "clientId",
      "submittedByUserId",
      "title",
      "description",
      "requestType",
      "status",
      "priority",
      "source",
      "createdAt",
      "updatedAt",
    ],
  },
  ServiceRequestPagedResult: {
    type: "object",
    additionalProperties: false,
    properties: {
      items: {
        type: "array",
        items: {
          $ref: "#/components/schemas/ServiceRequestDto",
        },
      },
    },
    required: ["items"],
  },
  CreateServiceRequestDto: {
    type: "object",
    additionalProperties: false,
    properties: {
      clientId: { type: "string", format: "uuid" },
      title: { type: "string" },
      description: { type: "string" },
      requestType: { type: "string" },
      priority: { $ref: "#/components/schemas/ServiceRequestPriority" },
      source: { type: "string" },
    },
    required: ["clientId", "title", "description"],
  },
  ServiceRequestDetailDto: {
    type: "object",
    additionalProperties: false,
    properties: {
      request: {
        $ref: "#/components/schemas/ServiceRequestDto",
      },
      assignments: {
        type: "array",
        items: {
          $ref: "#/components/schemas/ServiceRequestAssignmentDto",
        },
      },
      events: {
        type: "array",
        items: {
          $ref: "#/components/schemas/WorkflowEventDto",
        },
      },
    },
    required: ["request", "assignments", "events"],
  },
  ServiceRequestAssignmentDto: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string" },
      serviceRequestId: { type: "string" },
      representativeUserId: { type: "string", format: "uuid" },
      assignedByUserId: { type: "string", format: "uuid" },
      status: { type: "string" },
      decisionNote: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "serviceRequestId",
      "representativeUserId",
      "assignedByUserId",
      "status",
      "createdAt",
      "updatedAt",
    ],
  },
  WorkflowEventDto: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string" },
      serviceRequestId: { type: "string" },
      actorUserId: { type: "string", format: "uuid", nullable: true },
      actorType: { type: "string" },
      eventType: { type: "string" },
      payloadJson: { type: "object", additionalProperties: true },
      createdAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "serviceRequestId",
      "actorType",
      "eventType",
      "payloadJson",
      "createdAt",
    ],
  },
  ServiceRequestOpportunityDto: {
    type: "object",
    additionalProperties: false,
    properties: {
      mode: { type: "string", enum: ["create", "link"] },
      opportunityId: { type: "string", format: "uuid", nullable: true },
      title: { type: "string", nullable: true },
      estimatedValue: { type: "number", format: "double", nullable: true },
      expectedCloseDate: { type: "string", format: "date-time", nullable: true },
      stage: { type: "string", nullable: true },
      ownerId: { type: "string", format: "uuid", nullable: true },
    },
    required: ["mode"],
  },
  ServiceRequestProposalDto: {
    type: "object",
    additionalProperties: false,
    properties: {
      mode: { type: "string", enum: ["create", "link"] },
      proposalId: { type: "string", format: "uuid", nullable: true },
      title: { type: "string", nullable: true },
      description: { type: "string", nullable: true },
      validUntil: { type: "string", format: "date-time", nullable: true },
      currency: { type: "string", nullable: true },
    },
    required: ["mode"],
  },
  CreateServiceRequestAssignmentsDto: {
    type: "object",
    additionalProperties: false,
    properties: {
      representativeUserIds: {
        type: "array",
        items: {
          type: "string",
          format: "uuid",
        },
      },
      note: { type: "string", nullable: true },
    },
    required: ["representativeUserIds"],
  },
  ServiceRequestAssignmentsResponseDto: {
    type: "object",
    additionalProperties: false,
    properties: {
      request: { $ref: "#/components/schemas/ServiceRequestDto" },
      assignments: {
        type: "array",
        items: {
          $ref: "#/components/schemas/ServiceRequestAssignmentDto",
        },
      },
    },
    required: ["request", "assignments"],
  },
  ServiceRequestDecisionDto: {
    type: "object",
    additionalProperties: false,
    properties: {
      decision: { type: "string", enum: ["approve", "reject"] },
      assignmentIds: {
        type: "array",
        items: { type: "string" },
      },
      note: { type: "string", nullable: true },
    },
    required: ["decision", "assignmentIds"],
  },
  ServiceRequestRepDecisionDto: {
    type: "object",
    additionalProperties: false,
    properties: {
      assignmentId: { type: "string" },
      decision: { type: "string", enum: ["accept", "reject"] },
      note: { type: "string", nullable: true },
    },
    required: ["assignmentId", "decision"],
  },
};

const extractRefs = (value, refs = new Set()) => {
  if (!value || typeof value !== "object") {
    return refs;
  }

  if (typeof value.$ref === "string") {
    refs.add(value.$ref);
  }

  for (const child of Object.values(value)) {
    extractRefs(child, refs);
  }

  return refs;
};

const refsToCollect = new Set();
const ownedPaths = {};

for (const pathName of selectedPaths) {
  const pathValue = source.paths?.[pathName];

  if (!pathValue) {
    continue;
  }

  ownedPaths[pathName] = pathValue;
  extractRefs(pathValue, refsToCollect);
}

for (const pathValue of Object.values(ownedWorkflowPaths)) {
  extractRefs(pathValue, refsToCollect);
}

const collectedSchemas = {};
const queue = [...refsToCollect];
const seen = new Set();

while (queue.length > 0) {
  const ref = queue.shift();

  if (!ref || seen.has(ref)) {
    continue;
  }

  seen.add(ref);

  if (!ref.startsWith("#/components/schemas/")) {
    continue;
  }

  const schemaName = ref.split("/").pop();
  const schema = source.components?.schemas?.[schemaName];

  if (!schema || collectedSchemas[schemaName]) {
    continue;
  }

  collectedSchemas[schemaName] = schema;
  const childRefs = extractRefs(schema);

  for (const childRef of childRefs) {
    if (!seen.has(childRef)) {
      queue.push(childRef);
    }
  }
}

for (const [schemaName, schema] of Object.entries(ownedWorkflowSchemas)) {
  collectedSchemas[schemaName] = schema;
}

const ownedSpec = {
  openapi: source.openapi ?? "3.0.1",
  info: {
    title: "Owned Sales Automation API",
    version: "0.1.0",
    description:
      "Repo-owned API contract derived from the captured SalesAutomation swagger and extended with workflow endpoints required for assistant-driven automation.",
  },
  servers: [
    {
      url: "/",
      description: "Local application server",
    },
  ],
  tags: [
    { name: "Auth" },
    { name: "Clients" },
    { name: "Contacts" },
    { name: "Opportunities" },
    { name: "Proposals" },
    { name: "PricingRequests" },
    { name: "Activities" },
    { name: "Notes" },
    { name: "Users" },
    { name: "ServiceRequests" },
  ],
  paths: {
    ...ownedPaths,
    ...ownedWorkflowPaths,
  },
  components: {
    schemas: collectedSchemas,
  },
};

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, `${JSON.stringify(ownedSpec, null, 2)}\n`);

console.log(`Wrote ${targetPath}`);
