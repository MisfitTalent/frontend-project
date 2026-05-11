"use client";

import { MessagesPanel } from "@/components/dashboard/messages-panel";
import { Suspense } from "react";
import { useStyles } from "./style";

function MessagesPageContent() {
  const { styles } = useStyles();

  return (
    <div className={styles.container}>
      <Suspense fallback={null}>
        <MessagesPanel />
      </Suspense>
    </div>
  );
}

export default function MessagesPage() {
  return <MessagesPageContent />;
}
