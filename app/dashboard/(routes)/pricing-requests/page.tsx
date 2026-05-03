"use client";
import { PageIntro } from "@/components/dashboard/page-intro";
import { PricingRequestsPanel } from "@/components/dashboard/pricing-requests-panel";
import { PricingRequestProvider } from "@/providers/pageProviders";
import { useStyles } from "./style";
const PricingRequestsPageContent = () => {
    const { styles } = useStyles();
    return (<div className={styles.container}>
      <PageIntro />
      <PricingRequestsPanel />
    </div>);
};
const PricingRequestsPage = () => {
    return (<PricingRequestProvider>
      <PricingRequestsPageContent />
    </PricingRequestProvider>);
};
export default PricingRequestsPage;
