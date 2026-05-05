"use client";

import { DASHBOARD_HOME_PATH } from "@/lib/auth/dashboard-access";
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

type DashboardRouteProvidersProps = Readonly<{
  children: React.ReactNode;
}>;

const matchesPath = (pathname: string, path: string) =>
  path === DASHBOARD_HOME_PATH
    ? pathname === path
    : pathname === path || pathname.startsWith(`${path}/`);

const composeProvider = (
  children: React.ReactNode,
  shouldWrap: boolean,
  Provider: React.ComponentType<Readonly<{ children: React.ReactNode }>>,
) => (shouldWrap ? <Provider>{children}</Provider> : children);

export function DashboardRouteProviders({
  children,
}: DashboardRouteProvidersProps) {
  const pathname = usePathname();

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
    isActivitiesRoute ||
    isClientsRoute ||
    isMessagesRoute ||
    isOpportunitiesRoute ||
    isPricingRequestsRoute ||
    isReportsRoute ||
    isTeamMembersRoute;
  const needsClientProvider =
    needsDashboard ||
    isContactsRoute ||
    isOpportunitiesRoute ||
    isProposalsRoute;
  const needsContactProvider = needsDashboard || isContactsRoute;
  const needsOpportunityProvider =
    needsDashboard ||
    isOpportunitiesRoute ||
    isPricingRequestsRoute ||
    isProposalsRoute;
  const needsProposalProvider = needsDashboard || isProposalsRoute;
  const needsContractProvider = needsDashboard || isContractsRoute;
  const needsActivityProvider = needsDashboard || isActivitiesRoute;
  const needsDocumentProvider = isDashboardHome || isClientsRoute || isDocumentsRoute;
  const needsNoteProvider =
    isDashboardHome || isClientsRoute || isMessagesRoute || isNotesRoute || isTeamMembersRoute;
  const needsPricingRequestProvider = isPricingRequestsRoute || isTeamMembersRoute;
  const needsProfileProvider = isProfileRoute;
  const needsReportProvider = isReportsRoute;

  let content = children;

  content = composeProvider(content, needsProfileProvider, ProfileProvider);
  content = composeProvider(content, needsReportProvider, ReportProvider);
  content = composeProvider(content, needsDashboard, DashboardProvider);
  content = composeProvider(
    content,
    needsPricingRequestProvider,
    PricingRequestProvider,
  );
  content = composeProvider(content, needsNoteProvider, NoteProvider);
  content = composeProvider(content, needsDocumentProvider, DocumentProvider);
  content = composeProvider(content, needsActivityProvider, ActivityProvider);
  content = composeProvider(content, needsContractProvider, ContractProvider);
  content = composeProvider(content, needsProposalProvider, ProposalProvider);
  content = composeProvider(content, needsOpportunityProvider, OpportunityProvider);
  content = composeProvider(content, needsContactProvider, ContactProvider);
  content = composeProvider(content, needsClientProvider, ClientProvider);

  return content;
}

export default DashboardRouteProviders;
