"use client";

import ActivityProvider from "./activityProvider";
import AuthProvider from "./authProvider";
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
import UiProvider from "./uiProvider";

type ProvidersProps = Readonly<{
  children: React.ReactNode;
}>;

export function AppProviders({ children }: ProvidersProps) {
  return (
    <UiProvider>
      <AuthProvider>
        <ClientProvider>
          <ContactProvider>
            <OpportunityProvider>
              <ProposalProvider>
                <ContractProvider>
                  <ActivityProvider>
                    <DocumentProvider>
                      <NoteProvider>
                        <PricingRequestProvider>
                          <DashboardProvider>
                            <ReportProvider>
                              <ProfileProvider>{children}</ProfileProvider>
                            </ReportProvider>
                          </DashboardProvider>
                        </PricingRequestProvider>
                      </NoteProvider>
                    </DocumentProvider>
                  </ActivityProvider>
                </ContractProvider>
              </ProposalProvider>
            </OpportunityProvider>
          </ContactProvider>
        </ClientProvider>
      </AuthProvider>
    </UiProvider>
  );
}

export default AppProviders;
