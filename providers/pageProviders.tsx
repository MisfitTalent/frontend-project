"use client";

import { createContext, useContext } from "react";

type PageModuleKey =
  | "activity"
  | "assistant"
  | "pricing-request"
  | "dashboard"
  | "opportunity"
  | "proposal"
  | "client"
  | "contact"
  | "contract"
  | "document"
  | "note"
  | "team"
  | "report"
  | "profile";

interface IPageModuleValue {
  description: string;
  key: PageModuleKey;
  title: string;
}

const PageModuleContext = createContext<IPageModuleValue | null>(null);

const createModuleProvider = (value: IPageModuleValue) => {
  return function ModuleProvider({
    children,
  }: Readonly<{ children: React.ReactNode }>) {
    return (
      <PageModuleContext.Provider value={value}>
        {children}
      </PageModuleContext.Provider>
    );
  };
};

export const DashboardProvider = createModuleProvider({
  description: "Track pipeline movement, workload, and the next actions that need attention.",
  key: "dashboard",
  title: "Sales command center",
});

export const ActivityProviderPage = createModuleProvider({
  description: "Manage calls, tasks, meetings, and the follow-ups that keep deals moving.",
  key: "activity",
  title: "Follow-ups",
});

export const AssistantProvider = createModuleProvider({
  description:
    "Ask for account updates, pipeline guidance, renewal risk, and the next best action.",
  key: "assistant",
  title: "Secure sales assistant",
});

export const OpportunityProvider = createModuleProvider({
  description: "Track live opportunities, owners, deadlines, and priority across the pipeline.",
  key: "opportunity",
  title: "Opportunity pipeline",
});

export const ProposalProvider = createModuleProvider({
  description: "Keep commercial responses, approvals, and proposal progress visible in one place.",
  key: "proposal",
  title: "Proposals",
});

export const PricingRequestProvider = createModuleProvider({
  description: "Coordinate pricing requests before final commercials go out to the client.",
  key: "pricing-request",
  title: "Pricing requests",
});

export const ClientProvider = createModuleProvider({
  description: "Manage accounts, ownership, and the commercial work tied to each client.",
  key: "client",
  title: "Clients",
});

export const ContactProvider = createModuleProvider({
  description: "Keep decision-makers, champions, and key stakeholders attached to the right account.",
  key: "contact",
  title: "Contacts",
});

export const TeamProvider = createModuleProvider({
  description: "View team members, availability, workload, and who currently owns active commercial work.",
  key: "team",
  title: "Team members",
});

export const ContractProvider = createModuleProvider({
  description: "Monitor renewals, contract health, and upcoming deadlines before they become risks.",
  key: "contract",
  title: "Contracts and renewals",
});

export const DocumentProvider = createModuleProvider({
  description: "Keep commercial files organized against the right client and deal records.",
  key: "document",
  title: "Documents",
});

export const NoteProvider = createModuleProvider({
  description: "Capture context, handover notes, and deal history without losing the thread.",
  key: "note",
  title: "Notes",
});

export const ReportProvider = createModuleProvider({
  description: "Review pipeline health, priority shifts, and team workload at a glance.",
  key: "report",
  title: "Reports",
});

export const ProfileProvider = createModuleProvider({
  description: "View your account details, role, and workspace information.",
  key: "profile",
  title: "Profile",
});

export const usePageModule = () => {
  const context = useContext(PageModuleContext);

  if (!context) {
    throw new Error("usePageModule must be used within a page provider.");
  }

  return context;
};
