import { AssistantPanel } from "@/components/dashboard/assistant-panel";
import { Suspense } from "react";

export default function AssistantPage() {
  return (
    <Suspense fallback={null}>
      <AssistantPanel />
    </Suspense>
  );
}
