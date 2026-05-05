import type {
  IActivity,
  IClient,
  IOpportunity,
  IPricingRequest,
  ISalesData,
  ITeamMember,
  PriorityBand,
} from "./salesTypes";

type WorkloadOptions = {
  pricingRequests?: IPricingRequest[];
};

export type TeamWorkloadProfile = {
  activePricingRequests: number;
  activeProposals: number;
  assignments: number;
  availableCapacity: number;
  member: ITeamMember;
  openFollowUps: number;
  overdueFollowUps: number;
  workloadUnits: number;
};

export interface IOpportunityInsight {
  client?: IClient;
  daysToClose: number;
  deadlineWeight: number;
  moneyWeight: number;
  openFollowUps: IActivity[];
  opportunity: IOpportunity;
  owner?: ITeamMember;
  priorityBand: PriorityBand;
  score: number;
  summary: string;
}

const MAX_PRIORITY_WEIGHT = 100;
const DEADLINE_PRIORITY_SHARE = 0.6;
const MONEY_PRIORITY_SHARE = 0.4;

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-ZA", {
    currency: "ZAR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

export const getDaysUntil = (date: string) => {
  const today = new Date();
  const target = new Date(date);
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());

  return Math.ceil((utcTarget - utcToday) / (1000 * 60 * 60 * 24));
};

const getPriorityBand = (score: number): PriorityBand => {
  if (score >= 78) return "Critical";
  if (score >= 56) return "High";
  if (score >= 34) return "Medium";
  return "Low";
};

const getDeadlineWeight = (daysToClose: number) => {
  if (daysToClose <= 0) return MAX_PRIORITY_WEIGHT;
  if (daysToClose <= 3) return 92;
  if (daysToClose <= 7) return 84;
  if (daysToClose <= 14) return 68;
  if (daysToClose <= 30) return 44;
  return 20;
};

const getMoneyWeight = (value: number, maxValue: number) => {
  if (maxValue <= 0) return 0;
  return Math.round((value / maxValue) * MAX_PRIORITY_WEIGHT);
};

const isOpportunityOpen = (stage: string) => !["Won", "Lost"].includes(stage);
const isProposalActive = (status: string) =>
  !["accepted", "approved", "rejected", "declined", "expired", "won", "closed"].includes(
    status.toLowerCase(),
  );
const isPricingRequestActive = (status?: string) =>
  !["completed", "closed", "cancelled", "canceled", "resolved", "rejected"].includes(
    String(status ?? "").toLowerCase(),
  );

export const getOpenPipelineValue = (state: ISalesData) =>
  state.opportunities
    .filter((opportunity) => isOpportunityOpen(String(opportunity.stage)))
    .reduce(
      (sum, opportunity) => sum + (opportunity.value ?? opportunity.estimatedValue),
      0,
    );

export const getAssignmentCount = (state: ISalesData, memberId: string) =>
  state.opportunities.filter(
    (opportunity) =>
      opportunity.ownerId === memberId && isOpportunityOpen(String(opportunity.stage)),
  ).length;

export const getMemberWorkloadProfile = (
  state: ISalesData,
  memberId: string,
  options: WorkloadOptions = {},
): TeamWorkloadProfile | null => {
  const member = state.teamMembers.find((item) => item.id === memberId);

  if (!member) {
    return null;
  }

  const assignments = getAssignmentCount(state, memberId);
  const openFollowUps = state.activities.filter(
    (activity) =>
      activity.assignedToId === memberId &&
      String(activity.status) !== "Completed" &&
      !activity.completed,
  );
  const overdueFollowUps = openFollowUps.filter((activity) => getDaysUntil(activity.dueDate) < 0).length;
  const activeProposalCount = state.proposals.filter((proposal) => {
    const opportunity = state.opportunities.find((item) => item.id === proposal.opportunityId);

    return opportunity?.ownerId === memberId && isProposalActive(String(proposal.status));
  }).length;
  const activePricingRequestCount = (options.pricingRequests ?? []).filter(
    (request) =>
      request.assignedToId === memberId &&
      isPricingRequestActive(request.status),
  ).length;
  const workloadUnits =
    assignments * 9 +
    openFollowUps.length * 2 +
    overdueFollowUps * 3 +
    activeProposalCount * 3 +
    activePricingRequestCount * 4;
  const availableCapacity = Math.max(0, 100 - workloadUnits);

  return {
    activePricingRequests: activePricingRequestCount,
    activeProposals: activeProposalCount,
    assignments,
    availableCapacity,
    member,
    openFollowUps: openFollowUps.length,
    overdueFollowUps,
    workloadUnits,
  };
};

export const getAvailableCapacity = (
  state: ISalesData,
  member: ITeamMember,
  options: WorkloadOptions = {},
) => getMemberWorkloadProfile(state, member.id, options)?.availableCapacity ?? 100;

export const getBestOwner = (
  state: ISalesData,
  value: number,
  industry: string,
  options: WorkloadOptions = {},
): ITeamMember => {
  const ranked = [...state.teamMembers].sort((left, right) => {
    const leftMatch = left.skills.some((skill) =>
      [industry, value >= 1_000_000 ? "Enterprise" : "SMB"].includes(skill),
    )
      ? 18
      : 0;
    const rightMatch = right.skills.some((skill) =>
      [industry, value >= 1_000_000 ? "Enterprise" : "SMB"].includes(skill),
    )
      ? 18
      : 0;
    const leftCapacity = getAvailableCapacity(state, left, options);
    const rightCapacity = getAvailableCapacity(state, right, options);

    return rightCapacity + rightMatch - (leftCapacity + leftMatch);
  });

  return ranked[0] ?? state.teamMembers[0];
};

export const getOpportunityInsights = (state: ISalesData): IOpportunityInsight[] => {
  const maxValue = state.opportunities.reduce(
    (currentMax, opportunity) =>
      Math.max(currentMax, opportunity.value ?? opportunity.estimatedValue),
    0,
  );

  return state.opportunities
    .filter((opportunity) => isOpportunityOpen(String(opportunity.stage)))
    .map((opportunity) => {
      const amount = opportunity.value ?? opportunity.estimatedValue;
      const daysToClose = getDaysUntil(opportunity.expectedCloseDate);
      const moneyWeight = getMoneyWeight(amount, maxValue);
      const deadlineWeight = getDeadlineWeight(daysToClose);
      const score = Math.round(
        deadlineWeight * DEADLINE_PRIORITY_SHARE + moneyWeight * MONEY_PRIORITY_SHARE,
      );
      const client = state.clients.find((item) => item.id === opportunity.clientId);
      const owner = state.teamMembers.find((item) => item.id === opportunity.ownerId);
      const openFollowUps = state.activities.filter(
        (activity) =>
          activity.relatedToId === opportunity.id &&
          activity.status !== "Completed" &&
          !activity.completed,
      );

      return {
        client,
        daysToClose,
        deadlineWeight,
        moneyWeight,
        openFollowUps,
        opportunity,
        owner,
        priorityBand: getPriorityBand(score),
        score,
        summary: `${formatCurrency(amount)} deal with ${Math.max(daysToClose, 0)} day${
          Math.abs(daysToClose) === 1 ? "" : "s"
        } to close.`,
      };
    })
    .sort((left, right) => right.score - left.score);
};

export const getAdvisorResponse = (state: ISalesData, prompt?: string) => {
  const insights = getOpportunityInsights(state);
  const topOpportunity = insights[0];

  if (!topOpportunity) {
    return "No open opportunities are available to rank right now.";
  }

  const lowerPrompt = prompt?.toLowerCase() ?? "";

  if (lowerPrompt.includes("follow") || lowerPrompt.includes("task")) {
    const nextFollowUp = topOpportunity.openFollowUps[0];
    if (!nextFollowUp) {
      return `Prioritize ${topOpportunity.opportunity.title}. It has no scheduled follow-up even though ${topOpportunity.summary.toLowerCase()}`;
    }

    return `Start with ${topOpportunity.opportunity.title}. The next follow-up is "${nextFollowUp.subject}" due ${nextFollowUp.dueDate}, and the deal is still the highest priority because of value and timing pressure.`;
  }

  if (lowerPrompt.includes("owner") || lowerPrompt.includes("assign")) {
    return `${topOpportunity.owner?.name ?? "The assigned owner"} should stay on ${topOpportunity.opportunity.title}. Their current availability and the deal's ${topOpportunity.priorityBand.toLowerCase()} priority make that assignment defensible.`;
  }

  return `Prioritize ${topOpportunity.opportunity.title} first. It ranks ${topOpportunity.priorityBand.toLowerCase()} because it combines ${formatCurrency(topOpportunity.opportunity.value ?? topOpportunity.opportunity.estimatedValue)} in pipeline value with a close date ${topOpportunity.daysToClose <= 0 ? "that has already slipped." : `in ${topOpportunity.daysToClose} days.`}`;
};

export const getTeamCapacity = (
  state: ISalesData,
  options: WorkloadOptions = {},
) =>
  state.teamMembers
    .map((member) => getMemberWorkloadProfile(state, member.id, options))
    .filter((item): item is TeamWorkloadProfile => Boolean(item))
    .sort((left, right) => {
      if (right.workloadUnits !== left.workloadUnits) {
        return right.workloadUnits - left.workloadUnits;
      }

      if (left.availableCapacity !== right.availableCapacity) {
        return left.availableCapacity - right.availableCapacity;
      }

      return left.member.name.localeCompare(right.member.name);
    });
