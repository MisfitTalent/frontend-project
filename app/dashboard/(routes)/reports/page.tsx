"use client";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ReportsPanel } from "@/components/dashboard/reports-panel";
import { ReportProvider } from "@/providers/pageProviders";
import { useStyles } from "./style";
function ReportsPageContent() {
    const { styles } = useStyles();
    return (<div className={styles.section}>
      <PageIntro />
      <ReportsPanel />
    </div>);
}
const ReportsPage = () => {
    return (<ReportProvider>
      <ReportsPageContent />
    </ReportProvider>);
};
export default ReportsPage;
