"use client";
import { AssistantPanel } from "@/components/dashboard/assistant-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { AssistantProvider } from "@/providers/pageProviders";
import { useStyles } from "./style";
const AssistantPageContent = () => {
    const { styles } = useStyles();
    return (<div className={styles.container}>
      <PageIntro />
      <AssistantPanel />
    </div>);
};
const AssistantPage = () => {
    return (<AssistantProvider>
      <AssistantPageContent />
    </AssistantProvider>);
};
export default AssistantPage;
