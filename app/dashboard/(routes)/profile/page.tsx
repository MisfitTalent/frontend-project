"use client";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ProfilePanel } from "@/components/dashboard/profile-panel";
import { ProfileProvider } from "@/providers/pageProviders";
import { useStyles } from "./style";
const ProfilePageContent = () => {
    const { styles } = useStyles();
    return (<div className={styles.container}>
      <PageIntro />
      <ProfilePanel />
    </div>);
};
const ProfilePage = () => {
    return (<ProfileProvider>
      <ProfilePageContent />
    </ProfileProvider>);
};
export default ProfilePage;
