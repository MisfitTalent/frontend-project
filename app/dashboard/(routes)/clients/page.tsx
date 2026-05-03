"use client";
import { ClientRouteContent } from "@/components/dashboard/client-route-content";
import { ClientProvider as ClientPageProvider } from "@/providers/pageProviders";
const ClientsPage = () => {
    return (<ClientPageProvider>
      <ClientRouteContent />
    </ClientPageProvider>);
};
export default ClientsPage;
