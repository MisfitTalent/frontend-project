"use client";
import { PageIntro } from "@/components/dashboard/page-intro";
import { RenewalsPanel } from "@/components/dashboard/renewals-panel";
import { ContractProvider } from "@/providers/pageProviders";
import { useStyles } from "./style";
const ContractsPageContent = () => {
    const { styles } = useStyles();
    return (<div className={styles.container}>
      <PageIntro />
      <RenewalsPanel />
    </div>);
};
const ContractsPage = () => {
    return (<ContractProvider>
      <ContractsPageContent />
    </ContractProvider>);
};
export default ContractsPage;
