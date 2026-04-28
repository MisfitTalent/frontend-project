"use client";

import { NotesPanel } from "@/components/dashboard/notes-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { NoteProvider } from "@/providers/pageProviders";

function NotesPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <NotesPanel />
    </div>
  );
}

export default function NotesPage() {
  return (
    <NoteProvider>
      <NotesPageContent />
    </NoteProvider>
  );
}
