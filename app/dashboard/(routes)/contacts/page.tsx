"use client";
import { ContactsPanel } from "@/components/dashboard/contacts-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ContactProvider } from "@/providers/pageProviders";
import { useStyles } from "./style";
const ContactsPageContent = () => {
    const { styles } = useStyles();
    return (<div className={styles.container}>
      <PageIntro />
      <ContactsPanel />
    </div>);
};
const ContactsPage = () => {
    return (<ContactProvider>
      <ContactsPageContent />
    </ContactProvider>);
};
export default ContactsPage;
