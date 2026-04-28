import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/app/api/Auth/session-cookie";
import { type IMockUser } from "@/app/api/Auth/mock-users";
import { getUserFromSessionToken } from "@/lib/auth/session-user";
import { getBackendBaseUrl } from "@/lib/server/backend-url";
import {
  addMockProposalLineItem,
  assignMockOpportunity,
  createMockClient,
  createMockContact,
  createMockOpportunity,
  createMockProposal,
  deleteMockClient,
  deleteMockContact,
  deleteMockOpportunity,
  deleteMockProposal,
  deleteMockProposalLineItem,
  getMockProposal,
  listMockActivities,
  listMockClients,
  listMockContacts,
  listMockOpportunities,
  listMockProposals,
  transitionMockProposal,
  updateMockActivity,
  updateMockClient,
  updateMockContact,
  updateMockOpportunity,
  updateMockOpportunityStage,
  updateMockProposal,
  updateMockProposalLineItem,
} from "@/lib/server/mock-workspace-store";
import { OpportunityStage, ProposalStatus } from "@/providers/salesTypes";

export const runtime = "nodejs";

const shouldPersistSession = (segments: string[]) =>
  segments.length === 3 &&
  segments[0] === "api" &&
  segments[1] === "Auth" &&
  (segments[2] === "login" || segments[2] === "register");

const copyContentType = (upstream: Response, response: NextResponse) => {
  const contentType = upstream.headers.get("content-type");

  if (contentType) {
    response.headers.set("content-type", contentType);
  }
};

const createProxyResponse = async (upstream: Response, pathSegments: string[]) => {
  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const text = await upstream.text();

  if (!contentType.includes("application/json")) {
    const response = new NextResponse(text, { status: upstream.status });

    copyContentType(upstream, response);

    return response;
  }

  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  const response = NextResponse.json(payload, { status: upstream.status });

  if (upstream.ok && shouldPersistSession(pathSegments)) {
    const token = typeof payload?.token === "string" ? payload.token : "";

    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  }

  copyContentType(upstream, response);

  return response;
};

const proxyRequest = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) => {
  const { path } = await context.params;
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const sessionToken = cookieToken || bearerToken || "";
  const mockUser = sessionToken ? getUserFromSessionToken(sessionToken) : null;

  if (mockUser && sessionToken.startsWith("mock-token::")) {
    return handleMockRequest(request, path, mockUser);
  }

  const targetUrl = new URL(`${getBackendBaseUrl()}/${path.join("/")}`);

  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);

  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("cookie");
  headers.delete("host");

  if (!headers.has("authorization") && cookieToken) {
    headers.set("authorization", `Bearer ${cookieToken}`);
  }

  const upstream = await fetch(targetUrl, {
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.text(),
    headers,
    method: request.method,
    redirect: "manual",
  });

  return createProxyResponse(upstream, path);
};

const opportunityStageFromBackend = (value?: number) => {
  switch (value) {
    case 2:
      return OpportunityStage.Qualified;
    case 3:
      return OpportunityStage.ProposalSent;
    case 4:
      return OpportunityStage.Negotiating;
    case 5:
      return OpportunityStage.Won;
    case 6:
      return OpportunityStage.Lost;
    case 1:
    default:
      return OpportunityStage.New;
  }
};

const proposalStatusFromPath = (segment: string) => {
  switch (segment) {
    case "submit":
      return ProposalStatus.Submitted;
    case "approve":
      return ProposalStatus.Approved;
    case "reject":
      return ProposalStatus.Rejected;
    default:
      return ProposalStatus.Draft;
  }
};

const toOpportunityDto = (opportunity: ReturnType<typeof listMockOpportunities>[number]) => ({
  clientId: opportunity.clientId,
  contactId: opportunity.contactId ?? null,
  createdAt: opportunity.createdDate,
  currency: opportunity.currency ?? "ZAR",
  description: opportunity.description ?? null,
  estimatedValue: opportunity.value ?? opportunity.estimatedValue,
  expectedCloseDate: `${opportunity.expectedCloseDate}T09:00:00`,
  id: opportunity.id,
  ownerId: opportunity.ownerId ?? null,
  probability: opportunity.probability ?? 0,
  source: opportunity.source ?? 1,
  stage: (() => {
    switch (String(opportunity.stage)) {
      case OpportunityStage.Qualified:
        return 2;
      case OpportunityStage.ProposalSent:
        return 3;
      case OpportunityStage.Negotiating:
        return 4;
      case OpportunityStage.Won:
        return 5;
      case OpportunityStage.Lost:
        return 6;
      default:
        return 1;
    }
  })(),
  stageName: String(opportunity.stage),
  title: opportunity.title,
});

const toProposalDto = (proposal: ReturnType<typeof listMockProposals>[number]) => ({
  approvedDate: proposal.approvedDate ? `${proposal.approvedDate}T09:00:00` : null,
  clientId: proposal.clientId,
  createdAt: proposal.createdAt ?? new Date().toISOString(),
  currency: proposal.currency ?? "ZAR",
  description: proposal.description ?? null,
  id: proposal.id,
  lineItems:
    proposal.lineItems?.map((item, index) => ({
      description: item.description ?? null,
      discount: item.discount ?? 0,
      id: item.id,
      productServiceName: item.productServiceName,
      proposalId: proposal.id,
      quantity: item.quantity,
      sortOrder: index,
      taxRate: item.taxRate ?? 0,
      totalPrice:
        item.quantity * item.unitPrice * (1 - (item.discount ?? 0) / 100) * (1 + (item.taxRate ?? 0) / 100),
      unitPrice: item.unitPrice,
    })) ?? [],
  lineItemsCount: proposal.lineItemsCount ?? proposal.lineItems?.length ?? 0,
  opportunityId: proposal.opportunityId,
  proposalNumber: proposal.proposalNumber ?? null,
  status: (() => {
    switch (String(proposal.status)) {
      case ProposalStatus.Submitted:
        return 2;
      case ProposalStatus.Rejected:
        return 3;
      case ProposalStatus.Approved:
        return 4;
      default:
        return 1;
    }
  })(),
  statusName: String(proposal.status),
  submittedDate: proposal.submittedDate ? `${proposal.submittedDate}T09:00:00` : null,
  title: proposal.title,
  totalAmount: proposal.value ?? 0,
  validUntil: `${proposal.validUntil}T09:00:00`,
});

const json = (payload: unknown, status = 200) => NextResponse.json(payload, { status });

const toClientDto = (client: ReturnType<typeof listMockClients>[number]) => ({
  billingAddress: client.billingAddress ?? null,
  clientType: client.clientType ?? 2,
  companySize: client.segment ?? client.companySize ?? null,
  createdAt: client.createdAt ?? new Date().toISOString(),
  id: client.id,
  industry: client.industry,
  isActive: client.isActive,
  name: client.name,
  taxNumber: client.taxNumber ?? null,
  website: client.website ?? null,
});

const toContactDto = (contact: ReturnType<typeof listMockContacts>[number]) => ({
  clientId: contact.clientId,
  email: contact.email,
  firstName: contact.firstName,
  id: contact.id,
  isPrimaryContact: contact.isPrimaryContact,
  lastName: contact.lastName,
  phoneNumber: contact.phoneNumber ?? null,
  position: contact.position,
});

const toActivityDto = (activity: ReturnType<typeof listMockActivities>[number]) => ({
  assignedToId: activity.assignedToId ?? null,
  assignedToName: activity.assignedToName ?? null,
  createdAt: activity.createdAt ?? new Date().toISOString(),
  description: activity.description ?? null,
  dueDate: activity.dueDate ? `${activity.dueDate}T09:00:00` : null,
  duration: activity.duration ?? null,
  id: activity.id,
  location: activity.location ?? null,
  priority: activity.priority ?? 2,
  relatedToId: activity.relatedToId ?? null,
  relatedToType: activity.relatedToType ?? 2,
  status:
    String(activity.status) === "Completed"
      ? 2
      : String(activity.status) === "Cancelled"
        ? 3
        : 1,
  statusName: String(activity.status ?? "Scheduled"),
  subject: activity.subject ?? activity.title ?? "Untitled activity",
  type:
    String(activity.type) === "Meeting"
      ? 1
      : String(activity.type) === "Call"
        ? 2
        : String(activity.type) === "Email"
          ? 3
          : String(activity.type) === "Task"
            ? 4
            : String(activity.type) === "Presentation"
              ? 5
              : 6,
  typeName: String(activity.type ?? "Task"),
});

const handleMockRequest = async (
  request: NextRequest,
  path: string[],
  user: IMockUser,
) => {
  const [apiSegment, resource, id, nested, nestedId] = path;

  if (apiSegment !== "api") {
    return json({ message: "Unsupported mock path." }, 404);
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? null
      : ((await request.json().catch(() => null)) as Record<string, unknown> | null);

  if (resource === "Opportunities" || resource === "opportunities") {
    if (!id && request.method === "GET") {
      const items = listMockOpportunities(user.tenantId);
      return json({ items: items.map(toOpportunityDto) });
    }

    if (resource === "opportunities" && id === "my-opportunities" && request.method === "GET") {
      const items = listMockOpportunities(user.tenantId).filter(
        (item) => item.ownerId === user.id,
      );
      return json({ items: items.map(toOpportunityDto) });
    }

    if (!id && request.method === "POST" && body) {
      const opportunity = createMockOpportunity(user, {
        clientId: String(body.clientId ?? ""),
        contactId: body.contactId ? String(body.contactId) : undefined,
        description: body.description ? String(body.description) : undefined,
        estimatedValue: Number(body.estimatedValue ?? 0),
        expectedCloseDate: String(body.expectedCloseDate ?? ""),
        ownerId: body.ownerId ? String(body.ownerId) : undefined,
        probability: Number(body.probability ?? 50),
        source: Number(body.source ?? 1),
        stage: opportunityStageFromBackend(Number(body.stage)),
        title: String(body.title ?? "Untitled opportunity"),
      });

      return json(toOpportunityDto(opportunity), 201);
    }

    if (id && !nested && request.method === "PUT" && body) {
      const opportunity = updateMockOpportunity(user.tenantId, id, {
        contactId: body.contactId ? String(body.contactId) : undefined,
        currency: body.currency ? String(body.currency) : "ZAR",
        description: body.description ? String(body.description) : undefined,
        expectedCloseDate: body.expectedCloseDate ? String(body.expectedCloseDate) : undefined,
        probability: Number(body.probability ?? 0),
        source: Number(body.source ?? 1),
        title: String(body.title ?? "Untitled opportunity"),
        value: Number(body.estimatedValue ?? 0),
      });

      return opportunity
        ? json(toOpportunityDto(opportunity))
        : json({ message: "Opportunity not found." }, 404);
    }

    if (id && nested === "assign" && request.method === "POST" && body) {
      const opportunity = assignMockOpportunity(user.tenantId, id, String(body.userId ?? ""));

      return opportunity
        ? json(toOpportunityDto(opportunity))
        : json({ message: "Opportunity not found." }, 404);
    }

    if (id && nested === "stage" && request.method === "PUT" && body) {
      const opportunity = updateMockOpportunityStage(
        user.tenantId,
        id,
        opportunityStageFromBackend(Number(body.stage)),
      );

      return opportunity
        ? json(toOpportunityDto(opportunity))
        : json({ message: "Opportunity not found." }, 404);
    }

    if (id && request.method === "DELETE") {
      deleteMockOpportunity(user.tenantId, id);
      return new NextResponse(null, { status: 204 });
    }
  }

  if (resource === "Clients") {
    if (!id && request.method === "GET") {
      return json({ items: listMockClients(user.tenantId).map(toClientDto) });
    }

    if (!id && request.method === "POST" && body) {
      const client = createMockClient(user, {
        billingAddress: body.billingAddress ? String(body.billingAddress) : undefined,
        clientType: Number(body.clientType ?? 2),
        companySize: body.companySize ? String(body.companySize) : undefined,
        industry: String(body.industry ?? "General"),
        name: String(body.name ?? "Unnamed client"),
        taxNumber: body.taxNumber ? String(body.taxNumber) : undefined,
        website: body.website ? String(body.website) : undefined,
      });

      return json(toClientDto(client), 201);
    }

    if (id && request.method === "PUT" && body) {
      const client = updateMockClient(user.tenantId, id, {
        billingAddress: body.billingAddress ? String(body.billingAddress) : undefined,
        clientType: Number(body.clientType ?? 2),
        companySize: body.companySize ? String(body.companySize) : undefined,
        industry: String(body.industry ?? "General"),
        isActive: body.isActive === undefined ? true : Boolean(body.isActive),
        name: String(body.name ?? "Unnamed client"),
        taxNumber: body.taxNumber ? String(body.taxNumber) : undefined,
        website: body.website ? String(body.website) : undefined,
      });

      return client ? json(toClientDto(client)) : json({ message: "Client not found." }, 404);
    }

    if (id && request.method === "DELETE") {
      deleteMockClient(user.tenantId, id);
      return new NextResponse(null, { status: 204 });
    }
  }

  if (resource === "Contacts") {
    if (!id && request.method === "GET") {
      return json({ items: listMockContacts(user.tenantId).map(toContactDto) });
    }

    if (!id && request.method === "POST" && body) {
      const contact = createMockContact(user, {
        clientId: String(body.clientId ?? ""),
        createdAt: new Date().toISOString(),
        email: String(body.email ?? ""),
        firstName: String(body.firstName ?? ""),
        isPrimaryContact: Boolean(body.isPrimaryContact),
        lastName: String(body.lastName ?? ""),
        phoneNumber: body.phoneNumber ? String(body.phoneNumber) : undefined,
        position: String(body.position ?? ""),
      });

      return json(toContactDto(contact), 201);
    }

    if (id && request.method === "PUT" && body) {
      const contact = updateMockContact(user.tenantId, id, {
        email: String(body.email ?? ""),
        firstName: String(body.firstName ?? ""),
        isPrimaryContact: Boolean(body.isPrimaryContact),
        lastName: String(body.lastName ?? ""),
        phoneNumber: body.phoneNumber ? String(body.phoneNumber) : undefined,
        position: String(body.position ?? ""),
      });

      return contact ? json(toContactDto(contact)) : json({ message: "Contact not found." }, 404);
    }

    if (id && request.method === "DELETE") {
      deleteMockContact(user.tenantId, id);
      return new NextResponse(null, { status: 204 });
    }
  }

  if (resource === "Activities" || resource === "activities") {
    if (!id && request.method === "GET") {
      const items =
        resource === "activities" && path[2] === "my-activities"
          ? listMockActivities(user.tenantId).filter((item) => item.assignedToId === user.id)
          : listMockActivities(user.tenantId);

      return json({ items: items.map(toActivityDto) });
    }

    if (resource === "activities" && id === "my-activities" && request.method === "GET") {
      const items = listMockActivities(user.tenantId).filter((item) => item.assignedToId === user.id);
      return json({ items: items.map(toActivityDto) });
    }

    if (id && request.method === "PUT" && body) {
      const activity = updateMockActivity(user.tenantId, id, {
        assignedToId: body.assignedToId ? String(body.assignedToId) : undefined,
        assignedToName: body.assignedToName ? String(body.assignedToName) : undefined,
        description: body.description ? String(body.description) : undefined,
        dueDate: body.dueDate ? String(body.dueDate).split("T")[0] : undefined,
        duration: body.duration ? Number(body.duration) : undefined,
        location: body.location ? String(body.location) : undefined,
        priority: body.priority ? Number(body.priority) : undefined,
        relatedToId: body.relatedToId ? String(body.relatedToId) : undefined,
        relatedToType: body.relatedToType ? Number(body.relatedToType) : undefined,
        status: body.statusName ? String(body.statusName) : undefined,
        subject: body.subject ? String(body.subject) : undefined,
        title: body.subject ? String(body.subject) : undefined,
      });

      return activity ? json(toActivityDto(activity)) : json({ message: "Activity not found." }, 404);
    }
  }

  if (resource === "Proposals") {
    if (!id && request.method === "GET") {
      const items = listMockProposals(user.tenantId);
      return json({ items: items.map(toProposalDto) });
    }

    if (!id && request.method === "POST" && body) {
      const proposal = createMockProposal(user, {
        currency: body.currency ? String(body.currency) : "ZAR",
        description: body.description ? String(body.description) : undefined,
        lineItems: Array.isArray(body.lineItems)
          ? body.lineItems.map((item) => ({
              description:
                item && typeof item === "object" && "description" in item
                  ? String((item as { description?: unknown }).description ?? "")
                  : "",
              discount:
                item && typeof item === "object" && "discount" in item
                  ? Number((item as { discount?: unknown }).discount ?? 0)
                  : 0,
              productServiceName:
                item && typeof item === "object" && "productServiceName" in item
                  ? String((item as { productServiceName?: unknown }).productServiceName ?? "")
                  : "",
              quantity:
                item && typeof item === "object" && "quantity" in item
                  ? Number((item as { quantity?: unknown }).quantity ?? 1)
                  : 1,
              taxRate:
                item && typeof item === "object" && "taxRate" in item
                  ? Number((item as { taxRate?: unknown }).taxRate ?? 0)
                  : 0,
              unitPrice:
                item && typeof item === "object" && "unitPrice" in item
                  ? Number((item as { unitPrice?: unknown }).unitPrice ?? 0)
                  : 0,
            }))
          : [],
        opportunityId: String(body.opportunityId ?? ""),
        title: String(body.title ?? "Untitled proposal"),
        validUntil: String(body.validUntil ?? ""),
      });

      return json(toProposalDto(proposal), 201);
    }

    if (id && !nested && request.method === "GET") {
      const proposal = getMockProposal(user.tenantId, id);

      return proposal
        ? json(toProposalDto(proposal))
        : json({ message: "Proposal not found." }, 404);
    }

    if (id && !nested && request.method === "PUT" && body) {
      const proposal = updateMockProposal(user.tenantId, id, {
        currency: body.currency ? String(body.currency) : "ZAR",
        description: body.description ? String(body.description) : undefined,
        title: String(body.title ?? "Untitled proposal"),
        validUntil: body.validUntil ? String(body.validUntil) : undefined,
      });

      return proposal
        ? json(toProposalDto(proposal))
        : json({ message: "Proposal not found." }, 404);
    }

    if (id && nested === "line-items" && request.method === "POST" && body) {
      const proposal = addMockProposalLineItem(user.tenantId, id, {
        description: body.description ? String(body.description) : undefined,
        discount: Number(body.discount ?? 0),
        productServiceName: String(body.productServiceName ?? ""),
        quantity: Number(body.quantity ?? 1),
        taxRate: Number(body.taxRate ?? 0),
        unitPrice: Number(body.unitPrice ?? 0),
      });

      return proposal
        ? json(toProposalDto(proposal))
        : json({ message: "Proposal not found." }, 404);
    }

    if (id && nested === "line-items" && nestedId && request.method === "PUT" && body) {
      const proposal = updateMockProposalLineItem(user.tenantId, id, nestedId, {
        description: body.description ? String(body.description) : undefined,
        discount: Number(body.discount ?? 0),
        productServiceName: String(body.productServiceName ?? ""),
        quantity: Number(body.quantity ?? 1),
        taxRate: Number(body.taxRate ?? 0),
        unitPrice: Number(body.unitPrice ?? 0),
      });

      return proposal
        ? json(toProposalDto(proposal))
        : json({ message: "Proposal not found." }, 404);
    }

    if (id && nested === "line-items" && nestedId && request.method === "DELETE") {
      const proposal = deleteMockProposalLineItem(user.tenantId, id, nestedId);

      return proposal
        ? json(toProposalDto(proposal))
        : json({ message: "Proposal not found." }, 404);
    }

    if (id && nested && ["submit", "approve", "reject"].includes(nested) && request.method === "PUT") {
      const proposal = transitionMockProposal(
        user.tenantId,
        id,
        proposalStatusFromPath(nested),
        body?.reason ? String(body.reason) : undefined,
      );

      return proposal
        ? json(toProposalDto(proposal))
        : json({ message: "Proposal not found." }, 404);
    }

    if (id && request.method === "DELETE") {
      deleteMockProposal(user.tenantId, id);
      return new NextResponse(null, { status: 204 });
    }
  }

  return json({ message: "Mock route not implemented for this resource." }, 404);
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
export const HEAD = proxyRequest;
