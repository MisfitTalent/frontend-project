import { ClientDetailView } from "@/components/dashboard/client-detail-view";

export default async function ClientDetailPage(
  props: PageProps<"/dashboard/clients/[clientId]">,
) {
  const { clientId } = await props.params;

  return <ClientDetailView clientId={clientId} />;
}
