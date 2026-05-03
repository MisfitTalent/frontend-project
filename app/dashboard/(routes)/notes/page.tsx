"use client";
import { NotesPanel } from "@/components/dashboard/notes-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { NoteProvider } from "@/providers/pageProviders";
import { useStyles } from "./style";
const NotesPageContent = () => {
    const { styles } = useStyles();
    return (<div className={styles.container}>
      <PageIntro />
      <NotesPanel />
    </div>);
};
const NotesPage = () => {
    return (<NoteProvider>
      <NotesPageContent />
    </NoteProvider>);
};
export default NotesPage;
