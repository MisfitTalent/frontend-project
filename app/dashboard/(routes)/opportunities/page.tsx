"use client";
import { OpportunitiesPanel } from "@/components/dashboard/opportunities-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { OpportunityProvider } from "@/providers/pageProviders";
import { useStyles } from "./style";
const OpportunitiesPageContent = () => {
    const { styles } = useStyles();
    return (<div className={styles.container}>
      <PageIntro />
      <OpportunitiesPanel />
    </div>);
};
const OpportunitiesPage = () => {
    return (<OpportunityProvider>
      <OpportunitiesPageContent />
    </OpportunityProvider>);
};
export default OpportunitiesPage;
