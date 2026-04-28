import type {
  IActivity,
  IClient,
  IOpportunity,
  ISalesData,
  ITeamMember,
  PriorityBand,
} from "./salesTypes";

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

const MAX_DEADLINE_WEIGHT = 72;
const MAX_MONEY_WEIGHT = 28;

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
  if (daysToClose <= 0) return MAX_DEADLINE_WEIGHT;
  if (daysToClose <= 3) return 66;
  if (daysToClose <= 7) return 58;
  if (daysToClose <= 14) return 44;
  if (daysToClose <= 30) return 28;
  return 12;
};

const getMoneyWeight = (value: number, maxValue: number) => {
  if (maxValue <= 0) return 0;
  return Math.round((value / maxValue) * MAX_MONEY_WEIGHT);
};

const isOpportunityOpen = (stage: string) => !["Won", "Lost"].includes(stage);

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

export const getBestOwner = (
  state: ISalesData,
  value: number,
  industry: string,
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
    const leftCapacity = left.availabilityPercent - getAssignmentCount(state, left.id) * 9;
    const rightCapacity = right.availabilityPercent - getAssignmentCount(state, right.id) * 9;

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
      const score = moneyWeight + deadlineWeight;
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

export const getTeamCapacity = (state: ISalesData) =>
  state.teamMembers
    .map((member) => ({
      assignments: getAssignmentCount(state, member.id),
      availableCapacity: member.availabilityPercent - getAssignmentCount(state, member.id) * 9,
      member,
    }))
    .sort((left, right) => {
      if (right.assignments !== left.assignments) {
        return right.assignments - left.assignments;
      }

      if (left.availableCapacity !== right.availableCapacity) {
        return left.availableCapacity - right.availableCapacity;
      }

      return left.member.name.localeCompare(right.member.name);
    });
