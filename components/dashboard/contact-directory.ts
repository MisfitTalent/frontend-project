import type { ServiceRequestDetail } from "@/lib/client/service-request-api";
import { isTeamAssignmentThread } from "@/lib/dashboard/message-threads";
import type { INoteItem } from "@/providers/domainSeeds";
import type { IContact, ITeamMember } from "@/providers/salesTypes";

type BuildContactDirectoryInput = {
  activities: Array<{
    assignedToId?: string;
    completed?: boolean;
    relatedToId: string;
    status?: string;
  }>;
  canManageContacts: boolean;
  clients: Array<{
    id: string;
    name: string;
  }>;
  contacts: IContact[];
  isClientUser: boolean;
  isPrivileged: boolean;
  notes: INoteItem[];
  opportunities: Array<{
    clientId: string;
    id: string;
    ownerId?: string;
  }>;
  serviceRequestDetails?: ServiceRequestDetail[];
  teamMembers: ITeamMember[];
  userClientIds?: string[] | null;
  userId?: string;
};

export type ContactRow = {
  assignmentId?: string;
  assignmentRequestId?: string;
  assignmentNoteId?: string;
  assignmentStatus?: "Accepted" | "Pending client response" | "Rejected";
  category: "client" | "internal" | "admin";
  clientLabel: string;
  clientNames: string[];
  email: string;
  id: string;
  isEditable: boolean;
  name: string;
  phoneNumber?: string;
  position: string;
  sourceContact?: IContact;
};

export const WORKSPACE_ADMIN_ROW: ContactRow = {
  category: "admin",
  clientLabel: "Workspace-wide",
  clientNames: [],
  email: "admin@autosales.com",
  id: "workspace-admin",
  isEditable: false,
  name: "Workspace administrator",
  phoneNumber: "+27 11 000 0100",
  position: "Administrator",
};

const buildInternalRow = (member: ITeamMember, clientNames: string[]): ContactRow => ({
  category: "internal",
  clientLabel: clientNames.length > 0 ? clientNames.join(", ") : "Internal team",
  clientNames,
  email: `${member.name.toLowerCase().replace(/\s+/g, ".")}@autosales.com`,
  id: `internal-${member.id}`,
  isEditable: false,
  name: member.name,
  phoneNumber: undefined,
  position: member.role,
});

export const buildContactDirectory = ({
  activities,
  canManageContacts,
  clients,
  contacts,
  isClientUser,
  isPrivileged,
  notes,
  opportunities,
  serviceRequestDetails = [],
  teamMembers,
  userClientIds,
  userId,
}: BuildContactDirectoryInput): ContactRow[] => {
  const visibleClientIds = (() => {
    if (isClientUser) {
      return new Set(userClientIds ?? []);
    }

    if (isPrivileged) {
      return new Set(clients.map((client) => client.id));
    }

    return new Set(
      opportunities
        .filter((opportunity) => opportunity.ownerId === userId)
        .map((opportunity) => opportunity.clientId),
    );
  })();

  const visibleClientContacts: ContactRow[] = contacts
    .filter((contact) => visibleClientIds.has(contact.clientId))
    .map((contact) => ({
      category: "client",
      clientLabel:
        clients.find((client) => client.id === contact.clientId)?.name ?? "Unknown client",
      clientNames: [],
      email: contact.email,
      id: contact.id,
      isEditable: canManageContacts,
      name: `${contact.firstName} ${contact.lastName}`.trim(),
      phoneNumber: contact.phoneNumber,
      position: contact.position,
      sourceContact: contact,
    }));

  const internalRows = (() => {
    if (isPrivileged) {
      return teamMembers.map((member) => buildInternalRow(member, []));
    }

    if (isClientUser) {
      const involvedClientIds = new Set(userClientIds ?? []);
      const involvedOpportunityIds = new Set(
        opportunities
          .filter((opportunity) => involvedClientIds.has(opportunity.clientId))
          .map((opportunity) => opportunity.id),
      );
      const involvedMemberIds = new Set(
        opportunities
          .filter(
            (opportunity) =>
              involvedClientIds.has(opportunity.clientId) && opportunity.ownerId,
          )
          .map((opportunity) => opportunity.ownerId as string),
      );

      activities.forEach((activity) => {
        if (involvedOpportunityIds.has(activity.relatedToId) && activity.assignedToId) {
          involvedMemberIds.add(activity.assignedToId);
        }
      });

      const workflowRowsFromRequests = serviceRequestDetails
        .filter(({ request }) => involvedClientIds.has(request.clientId))
        .flatMap(({ assignments, request }) =>
          assignments
            .filter((assignment) => assignment.status !== "client_rejected")
            .map((assignment) => {
              const representativeName = assignment.representativeName || "Assigned sales rep";
              const assignmentStatus: ContactRow["assignmentStatus"] =
                assignment.status === "pending_client_approval"
                  ? "Pending client response"
                  : assignment.status === "client_rejected" ||
                      assignment.status === "rep_rejected"
                    ? "Rejected"
                    : "Accepted";
              const clientNames = clients
                .filter((client) => client.id === request.clientId)
                .map((client) => client.name);

              return {
                assignmentId: assignment.id,
                assignmentRequestId: request.id,
                assignmentStatus,
                category: "internal" as const,
                clientLabel: clientNames.join(", ") || "Assigned account team",
                clientNames,
                email: `${representativeName.toLowerCase().replace(/\s+/g, ".")}@autosales.com`,
                id: `assignment-${assignment.id}`,
                isEditable: false,
                name: representativeName,
                phoneNumber: undefined,
                position:
                  teamMembers.find((member) => member.id === assignment.representativeUserId)
                    ?.role ?? "Assigned sales rep",
              };
            }),
        );
      const workflowRows =
        workflowRowsFromRequests.length > 0
          ? workflowRowsFromRequests
          : notes
              .filter(
                (note) =>
                  isTeamAssignmentThread(note) &&
                  note.representativeId &&
                  note.representativeName &&
                  note.clientId &&
                  involvedClientIds.has(note.clientId) &&
                  note.status !== "Rejected",
              )
              .map((note) => {
                const representativeName = note.representativeName ?? "Assigned sales rep";
                const assignmentStatus: ContactRow["assignmentStatus"] =
                  note.status === "Accepted"
                    ? "Accepted"
                    : note.status === "Pending client response"
                      ? "Pending client response"
                      : note.status === "Rejected"
                        ? "Rejected"
                        : undefined;
                const clientNames = clients
                  .filter((client) => note.clientId === client.id)
                  .map((client) => client.name);

                return {
                  assignmentNoteId: note.id,
                  assignmentStatus,
                  category: "internal" as const,
                  clientLabel: clientNames.join(", ") || "Assigned account team",
                  clientNames,
                  email: `${representativeName.toLowerCase().replace(/\s+/g, ".")}@autosales.com`,
                  id: `assignment-${note.id}`,
                  isEditable: false,
                  name: representativeName,
                  phoneNumber: undefined,
                  position:
                    teamMembers.find((member) => member.id === note.representativeId)?.role ??
                    "Assigned sales rep",
                };
              });
      const workflowRowIds = new Set(workflowRows.map((row) => row.name));
      const involvedRows = teamMembers
        .filter((member) => involvedMemberIds.has(member.id))
        .map((member) =>
          buildInternalRow(
            member,
            clients
              .filter((client) => involvedClientIds.has(client.id))
              .map((client) => client.name),
          ),
        )
        .filter((row) => !workflowRowIds.has(row.name));

      return [...workflowRows, ...involvedRows];
    }

    return teamMembers.map((member) => buildInternalRow(member, []));
  })();

  const rows = [...visibleClientContacts, ...internalRows];

  if (!isClientUser) {
    rows.push(WORKSPACE_ADMIN_ROW);
  }

  return rows.sort((left, right) => left.name.localeCompare(right.name));
};
