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
  opportunities: Array<{
    clientId: string;
    id: string;
    ownerId?: string;
  }>;
  teamMembers: ITeamMember[];
  userClientIds?: string[] | null;
  userId?: string;
};

export type ContactRow = {
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
  opportunities,
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

      return teamMembers
        .filter((member) => involvedMemberIds.has(member.id))
        .map((member) =>
          buildInternalRow(
            member,
            clients
              .filter((client) => involvedClientIds.has(client.id))
              .map((client) => client.name),
          ),
        );
    }

    return teamMembers.map((member) => buildInternalRow(member, []));
  })();

  const rows = [...visibleClientContacts, ...internalRows];

  if (!isClientUser) {
    rows.push(WORKSPACE_ADMIN_ROW);
  }

  return rows.sort((left, right) => left.name.localeCompare(right.name));
};
