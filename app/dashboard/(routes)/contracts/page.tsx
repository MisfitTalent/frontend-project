"use client";

import { PageIntro } from "@/components/dashboard/page-intro";
import { RenewalsPanel } from "@/components/dashboard/renewals-panel";
import { ContractProvider } from "@/providers/pageProviders";

function ContractsPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <RenewalsPanel />
    </div>
  );
}

export default function ContractsPage() {
  return (
    <ContractProvider>
      <ContractsPageContent />
    </ContractProvider>
  );
}
