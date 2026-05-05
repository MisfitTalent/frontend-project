import "server-only";

import type { IMockUser } from "@/app/api/Auth/mock-users";
import { type IDocumentItem, type INoteItem } from "@/providers/domainSeeds";
import type { IPricingRequest, ISalesData, UserRole } from "@/providers/salesTypes";
import { getUserRoleLabel, normalizeUserRole } from "@/lib/auth/roles";
import { getMockWorkspaceSnapshot } from "@/lib/server/mock-workspace-store";

export interface IAssistantWorkspace {
  clientIds?: string[] | null;
  documents: IDocumentItem[];
  userEmail?: string;
  userId?: string;
  notes: INoteItem[];
  pricingRequests: IPricingRequest[];
  role: UserRole;
  salesData: ISalesData;
  scopeLabel: string;
  tenantId: string;
  userDisplayName: string;
}

export const getAssistantWorkspaceForUser = (
  user: IMockUser,
): IAssistantWorkspace => {
  const role: UserRole = normalizeUserRole(user.role);
  const workspace = getMockWorkspaceSnapshot(user.tenantId);
  const salesData: ISalesData = workspace.salesData;
  const documents = workspace.documents;
  const notes = workspace.notes;
  const pricingRequests = workspace.pricingRequests;

  return {
    clientIds: user.clientIds ?? null,
    documents,
    notes,
    pricingRequests,
    role,
    salesData,
    scopeLabel: `${getUserRoleLabel(role)} tenant scope`,
    tenantId: user.tenantId,
    userDisplayName: `${user.firstName} ${user.lastName}`.trim(),
    userEmail: user.email,
    userId: user.id,
  };
};
