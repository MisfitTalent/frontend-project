"use client";

import { DASHBOARD_HOME_PATH } from "@/lib/auth/dashboard-access";
import { useAuthState } from "@/providers/authProvider";
import { usePathname } from "next/navigation";

import ActivityProvider from "./activityProvider";
import ClientProvider from "./clientProvider";
import ContactProvider from "./contactProvider";
import ContractProvider from "./contractProvider";
import DashboardProvider from "./dashboardProvider";
import DocumentProvider from "./documentProvider";
import NoteProvider from "./noteProvider";
import OpportunityProvider from "./opportunityProvider";
import PricingRequestProvider from "./pricingRequestProvider";
import ProfileProvider from "./profileProvider";
import ProposalProvider from "./proposalProvider";
import ReportProvider from "./reportProvider";
import TeamMembersProvider from "./teamMembersProvider";

type DashboardRouteProvidersProps = Readonly<{
  children: React.ReactNode;
}>;

const matchesPath = (pathname: string, path: string) =>
  path === DASHBOARD_HOME_PATH
    ? pathname === path
    : pathname === path || pathname.startsWith(`${path}/`);

const composeProvider = (
  children: React.ReactNode,
  keyPrefix: string,
  scopeKey: string,
  shouldWrap: boolean,
  Provider: React.ComponentType<Readonly<{ children: React.ReactNode }>>,
) => (shouldWrap ? <Provider key={`${keyPrefix}:${scopeKey}`}>{children}</Provider> : children);

export function DashboardRouteProviders({
  children,
}: DashboardRouteProvidersProps) {
  const pathname = usePathname();
  const { user } = useAuthState();
  const scopeKey =
    [user?.tenantId, user?.userId, ...(user?.roles ?? [])].filter(Boolean).join("::") ||
    "anonymous";

  const isDashboardHome = matchesPath(pathname, DASHBOARD_HOME_PATH);
  const isActivitiesRoute = matchesPath(pathname, "/dashboard/activities");
  const isClientsRoute = matchesPath(pathname, "/dashboard/clients");
  const isContactsRoute = matchesPath(pathname, "/dashboard/contacts");
  const isContractsRoute = matchesPath(pathname, "/dashboard/contracts");
  const isDocumentsRoute = matchesPath(pathname, "/dashboard/documents");
  const isMessagesRoute = matchesPath(pathname, "/dashboard/messages");
  const isNotesRoute = matchesPath(pathname, "/dashboard/notes");
  const isOpportunitiesRoute = matchesPath(pathname, "/dashboard/opportunities");
  const isPricingRequestsRoute = matchesPath(pathname, "/dashboard/pricing-requests");
  const isProfileRoute = matchesPath(pathname, "/dashboard/profile");
  const isProposalsRoute = matchesPath(pathname, "/dashboard/proposals");
  const isReportsRoute = matchesPath(pathname, "/dashboard/reports");
  const isTeamMembersRoute = matchesPath(pathname, "/dashboard/team-members");

  const needsDashboard =
    isDashboardHome ||
    isClientsRoute ||
    isOpportunitiesRoute ||
    isReportsRoute ||
    isTeamMembersRoute;
  const needsTeamMembersProvider =
    needsDashboard || isActivitiesRoute || isMessagesRoute || isPricingRequestsRoute;
  const needsClientProvider =
    needsDashboard ||
    isMessagesRoute ||
    isContactsRoute ||
    isOpportunitiesRoute ||
    isProposalsRoute;
  const needsContactProvider = needsDashboard || isContactsRoute;
  const needsOpportunityProvider =
    needsDashboard ||
    isActivitiesRoute ||
    isMessagesRoute ||
    isOpportunitiesRoute ||
    isPricingRequestsRoute ||
    isProposalsRoute;
  const needsProposalProvider = needsDashboard || isActivitiesRoute || isProposalsRoute;
  const needsContractProvider = needsDashboard || isContractsRoute;
  const needsActivityProvider = needsDashboard || isActivitiesRoute;
  const needsDocumentProvider = isDashboardHome || isClientsRoute || isDocumentsRoute;
  const needsNoteProvider =
    isDashboardHome || isClientsRoute || isMessagesRoute || isNotesRoute || isTeamMembersRoute;
  const needsPricingRequestProvider = isPricingRequestsRoute || isTeamMembersRoute;
  const needsProfileProvider = isProfileRoute;
  const needsReportProvider = isReportsRoute;

  let content = children;

  content = composeProvider(content, "profile", scopeKey, needsProfileProvider, ProfileProvider);
  content = composeProvider(content, "report", scopeKey, needsReportProvider, ReportProvider);
  content = composeProvider(
    content,
    "document",
    scopeKey,
    needsDocumentProvider,
    DocumentProvider,
  );
  content = composeProvider(content, "note", scopeKey, needsNoteProvider, NoteProvider);
  content = composeProvider(
    content,
    "pricing-request",
    scopeKey,
    needsPricingRequestProvider,
    PricingRequestProvider,
  );
  content = composeProvider(content, "dashboard", scopeKey, needsDashboard, DashboardProvider);
  content = composeProvider(
    content,
    "team-members",
    scopeKey,
    needsTeamMembersProvider,
    TeamMembersProvider,
  );
  content = composeProvider(content, "activity", scopeKey, needsActivityProvider, ActivityProvider);
  content = composeProvider(content, "contract", scopeKey, needsContractProvider, ContractProvider);
  content = composeProvider(content, "proposal", scopeKey, needsProposalProvider, ProposalProvider);
  content = composeProvider(
    content,
    "opportunity",
    scopeKey,
    needsOpportunityProvider,
    OpportunityProvider,
  );
  content = composeProvider(content, "contact", scopeKey, needsContactProvider, ContactProvider);
  content = composeProvider(content, "client", scopeKey, needsClientProvider, ClientProvider);

  return content;
}

export default DashboardRouteProviders;
