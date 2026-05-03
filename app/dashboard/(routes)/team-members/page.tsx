"use client";
import { PageIntro } from "@/components/dashboard/page-intro";
import { TeamMembersPanel } from "@/components/dashboard/team-members-panel";
import { TeamProvider } from "@/providers/pageProviders";
import { useStyles } from "./style";
const TeamMembersPageContent = () => {
    const { styles } = useStyles();
    return (<div className={styles.container}>
      <PageIntro />
      <TeamMembersPanel />
    </div>);
};
const TeamMembersPage = () => {
    return (<TeamProvider>
      <TeamMembersPageContent />
    </TeamProvider>);
};
export default TeamMembersPage;
