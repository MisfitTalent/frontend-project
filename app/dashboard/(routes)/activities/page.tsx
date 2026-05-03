"use client";
import { ActivitiesPanel } from "@/components/dashboard/activities-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ActivityProviderPage } from "@/providers/pageProviders";
import { useStyles } from "./style";
function ActivitiesPageContent() {
    const { styles } = useStyles();
    return (<div className={styles.section}>
      <PageIntro />
      <ActivitiesPanel />
    </div>);
}
const ActivitiesPage = () => {
    return (<ActivityProviderPage>
      <ActivitiesPageContent />
    </ActivityProviderPage>);
};
export default ActivitiesPage;
