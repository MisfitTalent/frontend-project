import type { ISalesData, PriorityBand } from "@/providers/salesTypes";

export type ReassignmentRecommendation = "Hold" | "Proceed" | "Proceed with support";
export type ReassignmentRiskLevel = "High" | "Low" | "Medium";

export interface IReassignmentSimulationRequest {
  opportunityIds: string[];
  salesData: ISalesData;
  targetOwnerId: string;
}

export interface IReassignmentDealImpact {
  clientName: string;
  currentOwnerName: string;
  daysToClose: number;
  openFollowUps: number;
  opportunityId: string;
  priorityBand: PriorityBand;
  targetOwnerName: string;
  title: string;
  value: number;
}

export interface IReassignmentOwnerImpact {
  afterAssignments: number;
  afterAvailableCapacity: number;
  afterUrgentDeals: number;
  beforeAssignments: number;
  beforeAvailableCapacity: number;
  beforeUrgentDeals: number;
  deltaAssignments: number;
  deltaUrgentDeals: number;
  memberId: string;
  memberName: string;
  role: string;
}

export interface IReassignmentSimulationResponse {
  deals: IReassignmentDealImpact[];
  followUpsToReassign: number;
  movedDealCount: number;
  ownerImpacts: IReassignmentOwnerImpact[];
  recommendation: ReassignmentRecommendation;
  scenarioRisk: ReassignmentRiskLevel;
  summary: string;
  targetOwnerName: string;
  totalValue: number;
  urgentDealCount: number;
  warnings: string[];
}
