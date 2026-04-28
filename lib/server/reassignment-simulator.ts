import "server-only";

import { getAssistantServerConfig } from "./assistant-config";
import {
  formatCurrency,
  getAssignmentCount,
  getDaysUntil,
  getOpportunityInsights,
} from "@/providers/salesSelectors";
import type { ISalesData, ITeamMember, PriorityBand } from "@/providers/salesTypes";
import type {
  IReassignmentDealImpact,
  IReassignmentOwnerImpact,
  IReassignmentSimulationResponse,
  ReassignmentRecommendation,
  ReassignmentRiskLevel,
} from "@/types/reassignment";

type ProviderResponse = {
  output?: Array<{
    content?: Array<{ text?: string; type?: string }>;
    role?: string;
    type?: string;
  }>;
  output_text?: string;
};

const MAX_SIMULATED_DEALS = 3;
const URGENT_DEAL_WINDOW_DAYS = 7;

const extractAssistantMessage = (response: ProviderResponse) => {
  if (response.output_text?.trim()) {
    return response.output_text.trim();
  }

  return (
    response.output
      ?.filter((item) => item.type === "message" && item.role === "assistant")
      .flatMap((item) =>
        (item.content ?? []).filter((contentItem) =>
          ["output_text", "text"].includes(contentItem.type ?? ""),
        ),
      )
      .map((contentItem) => contentItem.text ?? "")
      .join("")
      .trim() ?? ""
  );
};

const createResponsesUrl = (baseUrl: string) => `${baseUrl.replace(/\/$/, "")}/responses`;

const getUrgentDealCount = (state: ISalesData, memberId: string) =>
  state.opportunities.filter(
    (opportunity) =>
      opportunity.ownerId === memberId &&
      !["Won", "Lost"].includes(String(opportunity.stage)) &&
      getDaysUntil(opportunity.expectedCloseDate) <= URGENT_DEAL_WINDOW_DAYS,
  ).length;

const getAvailableCapacity = (state: ISalesData, member: ITeamMember) =>
  member.availabilityPercent - getAssignmentCount(state, member.id) * 9;

const toDealImpact = (
  state: ISalesData,
  opportunityId: string,
  targetOwnerName: string,
): IReassignmentDealImpact | null => {
  const insight = getOpportunityInsights(state).find(
    (item) => item.opportunity.id === opportunityId,
  );

  if (!insight) {
    return null;
  }

  return {
    clientName: insight.client?.name ?? "Unknown client",
    currentOwnerName: insight.owner?.name ?? "Unassigned",
    daysToClose: insight.daysToClose,
    openFollowUps: insight.openFollowUps.length,
    opportunityId,
    priorityBand: insight.priorityBand as PriorityBand,
    targetOwnerName,
    title: insight.opportunity.title,
    value: insight.opportunity.value ?? insight.opportunity.estimatedValue,
  };
};

const buildOwnerImpacts = (
  beforeState: ISalesData,
  afterState: ISalesData,
  impactedMemberIds: string[],
): IReassignmentOwnerImpact[] =>
  impactedMemberIds
    .map((memberId) => {
      const member = afterState.teamMembers.find((item) => item.id === memberId);

      if (!member) {
        return null;
      }

      const beforeAssignments = getAssignmentCount(beforeState, memberId);
      const afterAssignments = getAssignmentCount(afterState, memberId);
      const beforeUrgentDeals = getUrgentDealCount(beforeState, memberId);
      const afterUrgentDeals = getUrgentDealCount(afterState, memberId);

      return {
        afterAssignments,
        afterAvailableCapacity: getAvailableCapacity(afterState, member),
        afterUrgentDeals,
        beforeAssignments,
        beforeAvailableCapacity: getAvailableCapacity(beforeState, member),
        beforeUrgentDeals,
        deltaAssignments: afterAssignments - beforeAssignments,
        deltaUrgentDeals: afterUrgentDeals - beforeUrgentDeals,
        memberId,
        memberName: member.name,
        role: member.role,
      };
    })
    .filter((item): item is IReassignmentOwnerImpact => Boolean(item))
    .sort((left, right) => {
      if (right.deltaAssignments !== left.deltaAssignments) {
        return right.deltaAssignments - left.deltaAssignments;
      }

      return left.memberName.localeCompare(right.memberName);
    });

const createFallbackSummary = ({
  recommendation,
  scenarioRisk,
  targetOwnerImpact,
  totalValue,
  urgentDealCount,
  movedDealCount,
  warnings,
}: {
  movedDealCount: number;
  recommendation: ReassignmentRecommendation;
  scenarioRisk: ReassignmentRiskLevel;
  targetOwnerImpact: IReassignmentOwnerImpact;
  totalValue: number;
  urgentDealCount: number;
  warnings: string[];
}) => {
  const firstSentence = `${recommendation}: move ${movedDealCount} deal${
    movedDealCount === 1 ? "" : "s"
  } worth ${formatCurrency(totalValue)} to ${targetOwnerImpact.memberName}. The scenario risk is ${scenarioRisk.toLowerCase()}, and their load would move from ${targetOwnerImpact.beforeAssignments} to ${targetOwnerImpact.afterAssignments} live deals.`;

  const secondSentence =
    urgentDealCount > 0
      ? `${urgentDealCount} of the selected deal${
          urgentDealCount === 1 ? "" : "s"
        } close within ${URGENT_DEAL_WINDOW_DAYS} days, so deadline coverage is the main constraint.`
      : "No selected deals are inside the urgent deadline window, so capacity is the main trade-off.";

  const warningSentence = warnings[0]
    ? `Main watch-out: ${warnings[0]}`
    : "The move is operationally clean if follow-up ownership is updated at the same time.";

  return `${firstSentence} ${secondSentence} ${warningSentence}`;
};

const createAiSummary = async (payload: {
  deals: IReassignmentDealImpact[];
  ownerImpacts: IReassignmentOwnerImpact[];
  recommendation: ReassignmentRecommendation;
  scenarioRisk: ReassignmentRiskLevel;
  targetOwnerName: string;
  totalValue: number;
  urgentDealCount: number;
  warnings: string[];
}) => {
  const config = getAssistantServerConfig();

  if (!config.isConfigured) {
    return null;
  }

  const response = await fetch(createResponsesUrl(config.baseUrl), {
    body: JSON.stringify({
      input: [
        {
          content: `Write a concise executive summary for a sales reassignment simulation. Keep it to 2 or 3 sentences. Recommendation: ${payload.recommendation}. Risk: ${payload.scenarioRisk}. Target owner: ${payload.targetOwnerName}. Total value moved: ${formatCurrency(payload.totalValue)}. Urgent deals inside ${URGENT_DEAL_WINDOW_DAYS} days: ${payload.urgentDealCount}. Warnings: ${payload.warnings.join(" | ") || "None"}. Scenario data: ${JSON.stringify({
            deals: payload.deals,
            ownerImpacts: payload.ownerImpacts,
          })}`,
          role: "user",
        },
      ],
      instructions:
        "You are a sales operations strategist. Return only the final user-facing answer. No chain-of-thought, no bullets unless necessary, no preamble.",
      model: config.model,
      reasoning: { effort: "low" },
    }),
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as ProviderResponse;
  const summary = extractAssistantMessage(data);

  return summary || null;
};

export const analyzeReassignmentScenario = async ({
  opportunityIds,
  salesData,
  targetOwnerId,
}: {
  opportunityIds: string[];
  salesData: ISalesData;
  targetOwnerId: string;
}): Promise<IReassignmentSimulationResponse> => {
  const uniqueOpportunityIds = [...new Set(opportunityIds)].slice(0, MAX_SIMULATED_DEALS);
  const targetOwner = salesData.teamMembers.find((member) => member.id === targetOwnerId);

  if (!targetOwner) {
    throw new Error("The selected target owner could not be found.");
  }

  if (uniqueOpportunityIds.length === 0) {
    throw new Error("Select at least one opportunity to simulate.");
  }

  const selectedDeals = salesData.opportunities.filter((opportunity) =>
    uniqueOpportunityIds.includes(opportunity.id),
  );

  if (selectedDeals.length !== uniqueOpportunityIds.length) {
    throw new Error("One or more selected opportunities are no longer available.");
  }

  const afterState: ISalesData = {
    ...salesData,
    opportunities: salesData.opportunities.map((opportunity) =>
      uniqueOpportunityIds.includes(opportunity.id)
        ? { ...opportunity, ownerId: targetOwnerId }
        : opportunity,
    ),
  };

  const impactedOwnerIds = [
    ...new Set([
      targetOwnerId,
      ...selectedDeals.map((opportunity) => opportunity.ownerId).filter(Boolean),
    ]),
  ] as string[];
  const targetOwnerName = targetOwner.name;
  const deals = uniqueOpportunityIds
    .map((opportunityId) => toDealImpact(salesData, opportunityId, targetOwnerName))
    .filter((item): item is IReassignmentDealImpact => Boolean(item));
  const ownerImpacts = buildOwnerImpacts(salesData, afterState, impactedOwnerIds);
  const targetOwnerImpact = ownerImpacts.find((impact) => impact.memberId === targetOwnerId);

  if (!targetOwnerImpact) {
    throw new Error("The target owner impact could not be calculated.");
  }

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const urgentDealCount = deals.filter(
    (deal) => deal.daysToClose <= URGENT_DEAL_WINDOW_DAYS,
  ).length;
  const followUpsToReassign = salesData.activities.filter(
    (activity) =>
      uniqueOpportunityIds.includes(activity.relatedToId) &&
      !activity.completed &&
      String(activity.status) !== "Completed",
  ).length;

  const warnings: string[] = [];

  if (targetOwnerImpact.afterAvailableCapacity < 20) {
    warnings.push(
      `${targetOwnerImpact.memberName} would drop to ${targetOwnerImpact.afterAvailableCapacity}% available capacity after the move.`,
    );
  }

  if (targetOwnerImpact.afterUrgentDeals >= 3) {
    warnings.push(
      `${targetOwnerImpact.memberName} would be carrying ${targetOwnerImpact.afterUrgentDeals} urgent deals inside ${URGENT_DEAL_WINDOW_DAYS} days.`,
    );
  }

  if (followUpsToReassign > 0) {
    warnings.push(
      `${followUpsToReassign} open follow-up${
        followUpsToReassign === 1 ? "" : "s"
      } should move with the deals to avoid split ownership.`,
    );
  }

  const skillMismatchCount = selectedDeals.filter((opportunity) => {
    const client = salesData.clients.find((item) => item.id === opportunity.clientId);

    if (!client) {
      return false;
    }

    return !targetOwner.skills.some((skill) =>
      [
        client.industry,
        client.segment ?? "",
        (opportunity.value ?? opportunity.estimatedValue) >= 1_000_000 ? "Enterprise" : "SMB",
      ].includes(
        skill,
      ),
    );
  }).length;

  if (skillMismatchCount > 0) {
    warnings.push(
      `${skillMismatchCount} selected deal${
        skillMismatchCount === 1 ? "" : "s"
      } do not align cleanly with ${targetOwnerImpact.memberName}'s declared skills.`,
    );
  }

  let riskPoints = 0;
  riskPoints += urgentDealCount >= 2 ? 2 : urgentDealCount;
  riskPoints += targetOwnerImpact.afterAvailableCapacity < 20 ? 3 : 0;
  riskPoints += targetOwnerImpact.afterAvailableCapacity < 35 ? 1 : 0;
  riskPoints += targetOwnerImpact.deltaAssignments >= 3 ? 2 : targetOwnerImpact.deltaAssignments >= 2 ? 1 : 0;
  riskPoints += skillMismatchCount;

  const scenarioRisk: ReassignmentRiskLevel =
    riskPoints >= 5 ? "High" : riskPoints >= 3 ? "Medium" : "Low";
  const recommendation: ReassignmentRecommendation =
    scenarioRisk === "High"
      ? "Hold"
      : warnings.length > 0
        ? "Proceed with support"
        : "Proceed";

  let summary = createFallbackSummary({
    movedDealCount: deals.length,
    recommendation,
    scenarioRisk,
    targetOwnerImpact,
    totalValue,
    urgentDealCount,
    warnings,
  });

  try {
    const aiSummary = await createAiSummary({
      deals,
      ownerImpacts,
      recommendation,
      scenarioRisk,
      targetOwnerName,
      totalValue,
      urgentDealCount,
      warnings,
    });

    if (aiSummary) {
      summary = aiSummary;
    }
  } catch (error) {
    console.error(error);
  }

  return {
    deals,
    followUpsToReassign,
    movedDealCount: deals.length,
    ownerImpacts,
    recommendation,
    scenarioRisk,
    summary,
    targetOwnerName,
    totalValue,
    urgentDealCount,
    warnings,
  };
};
