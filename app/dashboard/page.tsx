"use client";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { useAuthState } from "@/providers/authProvider";
import { ClientWorkspaceOverview } from "@/components/dashboard/client-workspace-overview";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { PageIntro } from "@/components/dashboard/page-intro";
import { DashboardProvider } from "@/providers/pageProviders";
import { useStyles } from "./page.style";
function DashboardPageContent() {
    const { styles } = useStyles();
    const { user } = useAuthState();
    if (isClientScopedUser(user?.clientIds)) {
        return (<div className={styles.section}>
        <PageIntro />
        <ClientWorkspaceOverview />
      </div>);
    }
    return (<div className={styles.section}>
      <PageIntro />
      <DashboardMetrics />
    </div>);
}
const DashboardPage = () => {
    return (<DashboardProvider>
      <DashboardPageContent />
    </DashboardProvider>);
};
export default DashboardPage;
