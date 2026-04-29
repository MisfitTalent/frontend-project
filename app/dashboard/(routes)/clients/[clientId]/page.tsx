import { ClientDetailView } from "@/components/dashboard/client-detail-view";
import { ClientProvider } from "@/providers/pageProviders";

export default async function ClientDetailPage(
  props: PageProps<"/dashboard/clients/[clientId]">,
) {
  const { clientId } = await props.params;

  return (
    <ClientProvider>
      <ClientDetailView clientId={clientId} />
    </ClientProvider>
  );
}
