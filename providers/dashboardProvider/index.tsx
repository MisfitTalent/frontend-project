"use client";

import { useContext, useEffect, useMemo, useReducer, useState } from "react";

import {
  type BackendPagedResult,
  type BackendUserDto,
  backendRequest,
  coerceItems,
  getSessionToken,
  isMockSessionToken,
  mapBackendUser,
} from "@/lib/client/backend-api";
import { getPrimaryUserRole } from "@/lib/auth/roles";
import { useAuthState } from "@/providers/authProvider";
import {
  ActivityStatus,
  ActivityType,
  OpportunityStage,
  ProposalStatus,
} from "@/providers/salesTypes";
import { initialAutomationFeed, initialTeamMembers } from "@/providers/domainSeeds";
import { useActivityActions, useActivityState } from "@/providers/activityProvider";
import { useClientActions, useClientState } from "@/providers/clientProvider";
import { useContactActions, useContactState } from "@/providers/contactProvider";
import { useContractState } from "@/providers/contractProvider";
import { useOpportunityActions, useOpportunityState } from "@/providers/opportunityProvider";
import { useProposalActions, useProposalState } from "@/providers/proposalProvider";
import { formatCurrency, getBestOwner } from "@/providers/salesSelectors";
import type { IAutomationEvent, IClientBundleInput, ISalesData } from "@/providers/salesTypes";
import { addAutomationEventAction } from "./actions";
import { DashboardActionContext, DashboardStateContext } from "./context";
import { DashboardReducer } from "./reducers";

export const useDashboardState = () => {
  const context = useContext(DashboardStateContext);

  if (context === undefined) {
    throw new Error("useDashboardState must be used within DashboardProvider.");
  }

  return context;
};

export const useDashboardActions = () => {
  const context = useContext(DashboardActionContext);

  if (context === undefined) {
    throw new Error("useDashboardActions must be used within DashboardProvider.");
  }

  return context;
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function DashboardProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const fallbackTeamMembers = useMemo(() => initialTeamMembers(), []);
  const [localState, dispatch] = useReducer(DashboardReducer, {
    automationFeed: initialAutomationFeed(),
    teamMembers: fallbackTeamMembers,
  });
  const [teamMembers, setTeamMembers] = useState(fallbackTeamMembers);
  const { isAuthenticated, user } = useAuthState();
  const isDemoMode = isMockSessionToken(getSessionToken());
  const role = getPrimaryUserRole(user?.roles);

  const { opportunities } = useOpportunityState();
  const { proposals } = useProposalState();
  const { clients } = useClientState();
  const { contacts } = useContactState();
  const { contracts, renewals } = useContractState();
  const { activities } = useActivityState();

  const { addOpportunity } = useOpportunityActions();
  const { addProposal } = useProposalActions();
  const { addClient } = useClientActions();
  const { addContact } = useContactActions();
  const { addActivity } = useActivityActions();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isActive = true;

    if (isDemoMode) {
      Promise.resolve().then(() => {
        if (isActive) {
          setTeamMembers(fallbackTeamMembers);
        }
      });

      return () => {
        isActive = false;
      };
    }

    void backendRequest<BackendPagedResult<BackendUserDto> | BackendUserDto[]>(
      `/api/Users?pageNumber=1&pageSize=100&isActive=true${
        role === "SalesRep" ? "&role=SalesRep" : ""
      }`,
    )
      .then((payload) => {
        if (!isActive) {
          return;
        }

        const users = coerceItems(payload).map(mapBackendUser);

        if (users.length > 0) {
          setTeamMembers(users);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      isActive = false;
    };
  }, [fallbackTeamMembers, isAuthenticated, isDemoMode, role]);

  const visibleTeamMembers = isAuthenticated ? teamMembers : fallbackTeamMembers;

  const salesData = useMemo<ISalesData>(
    () => ({
      activities,
      automationFeed: localState.automationFeed,
      clients,
      contacts,
      contracts,
      opportunities,
      proposals,
      renewals,
      teamMembers: visibleTeamMembers,
    }),
    [
      activities,
      clients,
      contacts,
      contracts,
      localState.automationFeed,
      opportunities,
      proposals,
      renewals,
      visibleTeamMembers,
    ],
  );

  const addAutomationEvent = (payload: IAutomationEvent) => {
    dispatch(addAutomationEventAction(payload));
  };

  const addClientBundle = async (payload: IClientBundleInput) => {
    const owner = getBestOwner(salesData, payload.opportunity.value, payload.client.industry);
    const proposalId = createId("prop");
    const activityId = createId("act");

    const client = await addClient({
      clientType: 2,
      createdAt: new Date().toISOString(),
      id: createId("client"),
      industry: payload.client.industry,
      isActive: true,
      name: payload.client.name,
      segment:
        payload.client.segment ??
        (payload.opportunity.value >= 1_000_000 ? "Enterprise" : "Growth"),
    });

    let contactId: string | undefined;

    if (payload.contact?.firstName && payload.contact?.lastName && payload.contact?.email) {
      const contact = await addContact({
        clientId: client.id,
        createdAt: new Date().toISOString(),
        email: payload.contact.email,
        firstName: payload.contact.firstName,
        id: createId("contact"),
        isPrimaryContact: true,
        lastName: payload.contact.lastName,
        phoneNumber: payload.contact.phoneNumber,
        position: payload.contact.position ?? "Primary contact",
      });

      contactId = contact.id;
    }

    const opportunity = await addOpportunity({
      clientId: client.id,
      contactId,
      createdDate: new Date().toISOString().split("T")[0],
      currency: "ZAR",
      description: payload.opportunity.description,
      estimatedValue: payload.opportunity.value,
      expectedCloseDate: payload.opportunity.expectedCloseDate,
      id: createId("opp"),
      name: payload.opportunity.title,
      nextStep: "Review discovery notes and confirm next client-facing action.",
      ownerId: owner.id,
      probability: 55,
      source: 1,
      stage: payload.opportunity.stage ?? OpportunityStage.New,
      title: payload.opportunity.title,
      value: payload.opportunity.value,
    });

    await addProposal({
      clientId: client.id,
      createdAt: new Date().toISOString(),
      currency: "ZAR",
      id: proposalId,
      opportunityId: opportunity.id,
      status: ProposalStatus.Draft,
      title: `${payload.opportunity.title} working draft`,
      validUntil: payload.opportunity.expectedCloseDate,
      value: payload.opportunity.value,
    });

    await addActivity({
      assignedToId: owner.id,
      assignedToName: owner.name,
      completed: false,
      description:
        "System-generated follow-up from client onboarding. Validate scope, owner, and next deadline.",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2)
        .toISOString()
        .split("T")[0],
      id: activityId,
      priority: 1,
      relatedToId: opportunity.id,
      relatedToType: 2,
      status: ActivityStatus.Scheduled,
      subject: `Follow up ${client.name}`,
      title: `Follow up ${client.name}`,
      type: ActivityType.Task,
    });

    addAutomationEvent({
      createdAt: new Date().toISOString(),
      description: `${owner.name} was assigned automatically. ${payload.opportunity.title} was placed in ${
        payload.opportunity.stage ?? OpportunityStage.New
      }, ranked, and given a follow-up task.`,
      id: createId("auto"),
      title: `${client.name} onboarded at ${formatCurrency(payload.opportunity.value)}`,
    });
  };

  return (
    <DashboardStateContext.Provider
      value={{
        automationFeed: localState.automationFeed,
        salesData,
        teamMembers: visibleTeamMembers,
      }}
    >
      <DashboardActionContext.Provider
        value={{
          addAutomationEvent,
          addClientBundle,
        }}
      >
        {children}
      </DashboardActionContext.Provider>
    </DashboardStateContext.Provider>
  );
}
