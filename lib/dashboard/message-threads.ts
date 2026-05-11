import type { INoteItem } from "@/providers/domainSeeds";
import type { IOpportunity, UserRole } from "@/providers/salesTypes";

export const CLIENT_MESSAGE_CATEGORY = "Client Message";
export const LEGACY_CLIENT_MESSAGE_PREFIX = `${CLIENT_MESSAGE_CATEGORY} `;

export const isClientMessage = (note: INoteItem) =>
  note.kind === "client_message" ||
  note.kind === "team_assignment" ||
  note.category === CLIENT_MESSAGE_CATEGORY ||
  note.category?.startsWith(LEGACY_CLIENT_MESSAGE_PREFIX);

export const isClientRequestThread = (note: INoteItem) =>
  isClientMessage(note) && note.requestType === "client_request";

export const isTeamAssignmentThread = (note: INoteItem) =>
  isClientMessage(note) && note.requestType === "team_assignment";

const compareMessageThreads = (left: INoteItem, right: INoteItem) =>
  right.createdDate.localeCompare(left.createdDate);

export const getScopedMessageThreads = ({
  clientIds,
  notes,
  opportunities,
  role,
  userId,
}: {
  clientIds?: string[] | null;
  notes: INoteItem[];
  opportunities: IOpportunity[];
  role: UserRole;
  userId?: string | null;
}) => {
  const messageThreads = notes.filter(isClientMessage).sort(compareMessageThreads);

  if (Array.isArray(clientIds) && clientIds.length > 0) {
    const allowedClientIds = new Set(clientIds);

    return messageThreads.filter(
      (note) => Boolean(note.clientId) && allowedClientIds.has(note.clientId as string),
    );
  }

  if (role !== "SalesRep") {
    return messageThreads;
  }

  const ownedClientIds = new Set(
    opportunities
      .filter((opportunity) => opportunity.ownerId === userId)
      .map((opportunity) => opportunity.clientId),
  );

  return messageThreads.filter(
    (note) =>
      note.representativeId === userId ||
      (note.clientId ? ownedClientIds.has(note.clientId) : false),
  );
};

export const prioritizeMessageThread = (
  threads: INoteItem[],
  selectedThreadId?: string | null,
) => {
  if (!selectedThreadId || !threads.some((thread) => thread.id === selectedThreadId)) {
    return threads;
  }

  return [...threads].sort((left, right) => {
    if (left.id === selectedThreadId) {
      return -1;
    }

    if (right.id === selectedThreadId) {
      return 1;
    }

    return compareMessageThreads(left, right);
  });
};
