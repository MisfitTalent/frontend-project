"use client";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { useAuthState } from "@/providers/authProvider";
import { ClientDetailView } from "./client-detail-view";
import { ClientsPanel } from "./clients-panel";
import { PageIntro } from "./page-intro";
import { useStyles } from "./client-route-content.styles";
export const ClientRouteContent = () => {
    const { user } = useAuthState();
    const { styles } = useStyles();
    if (isClientScopedUser(user?.clientIds)) {
        const clientId = user?.clientIds?.[0];
        return clientId ? <ClientDetailView clientId={clientId}/> : null;
    }
    return (<div className={styles.container}>
      <PageIntro />
      <ClientsPanel />
    </div>);
};
