"use client";
import { DocumentsPanel } from "@/components/dashboard/documents-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { DocumentProvider } from "@/providers/pageProviders";
import { useStyles } from "./style";
const DocumentsPageContent = () => {
    const { styles } = useStyles();
    return (<div className={styles.container}>
      <PageIntro />
      <DocumentsPanel />
    </div>);
};
const DocumentsPage = () => {
    return (<DocumentProvider>
      <DocumentsPageContent />
    </DocumentProvider>);
};
export default DocumentsPage;
