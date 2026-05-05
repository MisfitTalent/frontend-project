"use client";

import { MessagesPanel } from "@/components/dashboard/messages-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { MessageProviderPage } from "@/providers/pageProviders";
import { useStyles } from "./style";

function MessagesPageContent() {
  const { styles } = useStyles();

  return (
    <div className={styles.container}>
      <PageIntro />
      <MessagesPanel />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <MessageProviderPage>
      <MessagesPageContent />
    </MessageProviderPage>
  );
}
