import {
  type IActivity,
  type IAutomationEvent,
  type IClient,
  type IContact,
  type IContract,
  type IOpportunity,
  type IPricingRequest,
  type IProposal,
  type IRenewal,
  type ITeamMember,
} from "./salesTypes";
import { INITIAL_SALES_DATA } from "./salesFixtures";

export interface IDocumentItem {
  clientId?: string;
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedDate: string;
}

export interface INoteItem {
  category: string;
  clientId?: string;
  content: string;
  createdDate: string;
  id: string;
  kind?: "client_feedback" | "client_message" | "general";
  representativeId?: string;
  representativeName?: string;
  submittedBy?: string;
  source?: "assistant" | "client_portal" | "workspace";
  status?: "Acknowledged" | "Sent";
  title: string;
}

export const initialOpportunities = (): IOpportunity[] =>
  INITIAL_SALES_DATA.opportunities.map((item) => ({ ...item }));

export const initialProposals = (): IProposal[] =>
  INITIAL_SALES_DATA.proposals.map((item) => ({ ...item }));

export const initialRenewals = (): IRenewal[] =>
  INITIAL_SALES_DATA.renewals.map((item) => ({ ...item }));

export const initialActivities = (): IActivity[] =>
  INITIAL_SALES_DATA.activities.map((item) => ({ ...item }));

export const initialContracts = (): IContract[] =>
  INITIAL_SALES_DATA.contracts.map((item) => ({ ...item }));

export const initialClients = (): IClient[] =>
  INITIAL_SALES_DATA.clients.map((item) => ({ ...item }));

export const initialContacts = (): IContact[] =>
  INITIAL_SALES_DATA.contacts.map((item) => ({ ...item }));

export const initialTeamMembers = (): ITeamMember[] =>
  INITIAL_SALES_DATA.teamMembers.map((item) => ({
    ...item,
    skills: [...item.skills],
  }));

export const initialAutomationFeed = (): IAutomationEvent[] =>
  INITIAL_SALES_DATA.automationFeed.map((item) => ({ ...item }));

export const initialDocuments = (): IDocumentItem[] => [
  {
    clientId: "c1",
    id: "doc-1",
    name: "Boxfusion_Renewal_Contract.pdf",
    size: "2.4 MB",
    type: "PDF",
    uploadedDate: "2026-04-15",
  },
  {
    clientId: "c2",
    id: "doc-2",
    name: "Nexa_Health_Proposal.docx",
    size: "1.1 MB",
    type: "DOCX",
    uploadedDate: "2026-04-10",
  },
];

export const initialNotes = (): INoteItem[] => [
  {
    category: "Opportunity",
    clientId: "c1",
    content: "Discuss Q2 budget allocation before final commercial review.",
    createdDate: "2026-04-20",
    id: "note-1",
    title: "Follow-up with Boxfusion",
  },
  {
    category: "Internal",
    clientId: "c2",
    content: "Review annual discount structure for healthcare rollouts.",
    createdDate: "2026-04-19",
    id: "note-2",
    title: "Pricing review",
  },
];

export const initialPricingRequests = (): IPricingRequest[] => [
  {
    assignedToName: "Sibusiso Meyer",
    createdAt: "2026-04-20T08:00:00Z",
    id: "price-1",
    opportunityId: "opp-1",
    opportunityTitle: "Boxfusion renewal expansion",
    priority: 2,
    priorityLabel: "Medium",
    requestNumber: "PR-001",
    status: "Pending",
    title: "Enterprise analytics pricing review",
  },
  {
    assignedToName: "Zinhle Dube",
    createdAt: "2026-04-18T10:30:00Z",
    id: "price-2",
    opportunityId: "opp-2",
    opportunityTitle: "Nexa Health rollout",
    priority: 1,
    priorityLabel: "High",
    status: "Pending",
    title: "Cloud onboarding commercial approval",
  },
];
