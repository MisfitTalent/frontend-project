import { ContactDetailView } from "@/components/dashboard/contact-detail-view";

type ContactDetailPageProps = Readonly<{
  params: Promise<{
    contactId: string;
  }>;
}>;

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { contactId } = await params;

  return <ContactDetailView contactId={contactId} />;
}
