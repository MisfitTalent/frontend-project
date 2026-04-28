export type UserRole =
  | "Admin"
  | "SalesManager"
  | "BusinessDevelopmentManager"
  | "SalesRep";

export enum OpportunityStage {
  New = "New",
  Qualified = "Qualified",
  ProposalSent = "Proposal Sent",
  Negotiating = "Negotiating",
  Won = "Won",
  Lost = "Lost",
}

export enum ProposalStatus {
  Draft = "Draft",
  Submitted = "Submitted",
  Rejected = "Rejected",
  Approved = "Approved",
}

export enum ActivityType {
  Meeting = "Meeting",
  Call = "Call",
  Email = "Email",
  Task = "Task",
  Presentation = "Presentation",
  Other = "Other",
}

export enum ActivityStatus {
  Scheduled = "Scheduled",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export enum ContractStatus {
  Draft = "Draft",
  Active = "Active",
  Expired = "Expired",
  Renewed = "Renewed",
  Cancelled = "Cancelled",
}

export type PriorityBand = "Critical" | "High" | "Medium" | "Low";

export interface IOpportunity {
  id: string;
  title: string;
  name?: string;
  clientId: string;
  contactId?: string;
  ownerId?: string;
  estimatedValue: number;
  value?: number;
  currency: string;
  stage: OpportunityStage | string;
  source: number;
  probability: number;
  expectedCloseDate: string;
  description?: string;
  createdDate: string;
  nextStep?: string;
}

export interface IProposal {
  id: string;
  proposalNumber?: string;
  opportunityId: string;
  clientId: string;
  title: string;
  description?: string;
  currency: string;
  validUntil: string;
  status: ProposalStatus | string;
  lineItems?: ILineItem[];
  lineItemsCount?: number;
  submittedDate?: string;
  approvedDate?: string;
  createdAt?: string;
  value?: number;
}

export interface ILineItem {
  id?: string;
  productServiceName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface IContract {
  id: string;
  clientId: string;
  opportunityId?: string;
  proposalId?: string;
  title: string;
  contractValue: number;
  currency: string;
  startDate: string;
  endDate: string;
  ownerId?: string;
  renewalNoticePeriod: number;
  autoRenew: boolean;
  terms?: string;
  status: ContractStatus | string;
  createdAt?: string;
}

export interface IRenewal {
  id: string;
  contractId: string;
  renewalOpportunityId?: string;
  notes?: string;
  status?: number | string;
  createdAt?: string;
  clientName?: string;
  renewalDate?: string;
  value?: number;
  daysUntilRenewal?: number;
}

export interface IActivity {
  id: string;
  type: ActivityType | string;
  subject: string;
  title?: string;
  description: string;
  priority: number;
  dueDate: string;
  assignedToId?: string;
  assignedToName?: string;
  relatedToType: number;
  relatedToId: string;
  duration?: number;
  location?: string;
  status: ActivityStatus | string;
  createdAt?: string;
  completed?: boolean;
}

export interface IClient {
  id: string;
  name: string;
  industry: string;
  clientType: number;
  website?: string;
  billingAddress?: string;
  taxNumber?: string;
  companySize?: string;
  isActive: boolean;
  createdAt?: string;
  segment?: string;
}

export interface IContact {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  position: string;
  isPrimaryContact: boolean;
  createdAt?: string;
}

export interface ITeamMember {
  id: string;
  name: string;
  role: string;
  availabilityPercent: number;
  region: string;
  skills: string[];
}

export interface IPricingRequest {
  id: string;
  opportunityId: string;
  opportunityTitle?: string;
  requestNumber?: string;
  title: string;
  description?: string;
  requestedById?: string;
  requestedByName?: string;
  assignedToId?: string;
  assignedToName?: string;
  status: string;
  priority: number;
  priorityLabel?: string;
  requiredByDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IAutomationEvent {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface IClientBundleInput {
  client: Pick<IClient, "industry" | "name"> & Partial<IClient>;
  contact?: Partial<IContact>;
  opportunity: {
    description?: string;
    expectedCloseDate: string;
    stage?: OpportunityStage | string;
    title: string;
    value: number;
  };
}

export interface ISalesData {
  opportunities: IOpportunity[];
  proposals: IProposal[];
  pricingRequests?: IPricingRequest[];
  renewals: IRenewal[];
  activities: IActivity[];
  contracts: IContract[];
  clients: IClient[];
  contacts: IContact[];
  teamMembers: ITeamMember[];
  automationFeed: IAutomationEvent[];
}

export const OPPORTUNITY_STAGE_ORDER: OpportunityStage[] = [
  OpportunityStage.New,
  OpportunityStage.Qualified,
  OpportunityStage.ProposalSent,
  OpportunityStage.Negotiating,
  OpportunityStage.Won,
  OpportunityStage.Lost,
];

export const OPPORTUNITY_STAGE_COLORS: Record<string, string> = {
  [OpportunityStage.New]: "#94a3b8",
  [OpportunityStage.Qualified]: "#355c7d",
  [OpportunityStage.ProposalSent]: "#4f7cac",
  [OpportunityStage.Negotiating]: "#f59e0b",
  [OpportunityStage.Won]: "#f97316",
  [OpportunityStage.Lost]: "#cbd5e1",
};

export const PROPOSAL_STATUS_COLORS: Record<string, string> = {
  [ProposalStatus.Draft]: "#eab308",
  [ProposalStatus.Submitted]: "#2563eb",
  [ProposalStatus.Approved]: "#22c55e",
  [ProposalStatus.Rejected]: "#ef4444",
};

export const PRICING_REQUEST_STATUS_COLORS: Record<string, string> = {
  Pending: "#355c7d",
  Assigned: "#4f7cac",
  "In Progress": "#4f7cac",
  Completed: "#22c55e",
  Cancelled: "#94a3b8",
};

export const PRIORITY_BAND_COLORS: Record<PriorityBand, string> = {
  Critical: "#f97316",
  High: "#355c7d",
  Medium: "#64748b",
  Low: "#cbd5e1",
};
