"use client";
import { useContext, useEffect, useMemo, useReducer } from "react";
import { getPrimaryUserRole } from "@/lib/auth/roles";
import { type BackendPagedResult, type BackendUserDto, backendRequest, coerceItems, mapBackendUser, } from "@/lib/client/backend-api";
import { useActivityActions, useActivityState } from "@/providers/activityProvider";
import { useAuthState } from "@/providers/authProvider";
import { useClientActions, useClientState } from "@/providers/clientProvider";
import { useContactActions, useContactState } from "@/providers/contactProvider";
import { useContractState } from "@/providers/contractProvider";
import { initialAutomationFeed, initialTeamMembers } from "@/providers/domainSeeds";
import { useOpportunityActions, useOpportunityState } from "@/providers/opportunityProvider";
import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import { useProposalActions, useProposalState } from "@/providers/proposalProvider";
import { formatCurrency, getBestOwner } from "@/providers/salesSelectors";
import type { IAutomationEvent, IClientBundleInput, ISalesData } from "@/providers/salesTypes";
import { ActivityStatus, ActivityType, OpportunityStage, ProposalStatus, } from "@/providers/salesTypes";
import { addAutomationEventAction, dashboardErrorAction, dashboardPendingAction, dashboardSuccessAction, setTeamMembersAction, } from "./actions";
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
const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const DashboardProvider = ({ children, }: Readonly<{
    children: React.ReactNode;
}>) => {
    const fallbackTeamMembers = useMemo(() => initialTeamMembers(), []);
    const [state, dispatch] = useReducer(DashboardReducer, undefined, () => ({
        automationFeed: initialAutomationFeed(),
        isError: false,
        isPending: false,
        isSuccess: false,
        teamMembers: fallbackTeamMembers,
    }));
    const { isAuthenticated, user } = useAuthState();
    const isDemoMode = Boolean(user?.isMockSession);
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
                if (!isActive) {
                    return;
                }
                dispatch(setTeamMembersAction(fallbackTeamMembers));
                dispatch(dashboardSuccessAction());
            });
            return () => {
                isActive = false;
            };
        }
        const loadTeamMembers = async () => {
            dispatch(dashboardPendingAction());
            try {
                const payload = await backendRequest<BackendPagedResult<BackendUserDto> | BackendUserDto[]>(`/api/Users?pageNumber=1&pageSize=100&isActive=true${role === "SalesRep" ? "&role=SalesRep" : ""}`);
                if (!isActive) {
                    return;
                }
                const users = coerceItems(payload).map(mapBackendUser);
                dispatch(setTeamMembersAction(users.length > 0 ? users : fallbackTeamMembers));
                dispatch(dashboardSuccessAction());
            }
            catch (error) {
                console.error(error);
                if (isActive) {
                    dispatch(dashboardErrorAction());
                }
            }
        };
        void loadTeamMembers();
        return () => {
            isActive = false;
        };
    }, [fallbackTeamMembers, isAuthenticated, isDemoMode, role]);
    const visibleTeamMembers = isAuthenticated ? state.teamMembers : fallbackTeamMembers;
    const salesData = useMemo<ISalesData>(() => ({
        activities,
        automationFeed: state.automationFeed,
        clients,
        contacts,
        contracts,
        opportunities,
        proposals,
        renewals,
        teamMembers: visibleTeamMembers,
    }), [
        activities,
        clients,
        contacts,
        contracts,
        opportunities,
        proposals,
        renewals,
        state.automationFeed,
        visibleTeamMembers,
    ]);
    const addAutomationEvent = (payload: IAutomationEvent) => {
        dispatch(addAutomationEventAction(payload));
        dispatch(dashboardSuccessAction());
    };
    const addClientBundle = async (payload: IClientBundleInput) => {
        dispatch(dashboardPendingAction());
        try {
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
                segment: payload.client.segment ??
                    (payload.opportunity.value >= 1000000 ? "Enterprise" : "Growth"),
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
                description: "System-generated follow-up from client onboarding. Validate scope, owner, and next deadline.",
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
                description: `${owner.name} was assigned automatically. ${payload.opportunity.title} was placed in ${payload.opportunity.stage ?? OpportunityStage.New}, ranked, and given a follow-up task.`,
                id: createId("auto"),
                title: `${client.name} onboarded at ${formatCurrency(payload.opportunity.value)}`,
            });
            dispatch(dashboardSuccessAction());
        }
        catch (error) {
            dispatch(dashboardErrorAction());
            throw error;
        }
    };
    return (<DashboardStateContext.Provider value={{
            ...(isAuthenticated ? state : { ...state, ...PROVIDER_REQUEST_IDLE }),
            salesData,
            teamMembers: visibleTeamMembers,
        }}>
      <DashboardActionContext.Provider value={{
            addAutomationEvent,
            addClientBundle,
        }}>
        {children}
      </DashboardActionContext.Provider>
    </DashboardStateContext.Provider>);
};
