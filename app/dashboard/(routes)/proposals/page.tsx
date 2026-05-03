"use client";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ProposalsPanel } from "@/components/dashboard/proposals-panel";
import { ProposalProvider } from "@/providers/pageProviders";
import { useStyles } from "./style";
const ProposalsPageContent = () => {
    const { styles } = useStyles();
    return (<div className={styles.container}>
      <PageIntro />
      <ProposalsPanel />
    </div>);
};
const ProposalsPage = () => {
    return (<ProposalProvider>
      <ProposalsPageContent />
    </ProposalProvider>);
};
export default ProposalsPage;
