"use client";
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Layout, Menu, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getPrimaryUserRole, getUserRoleLabel, isManagerRole } from "@/lib/auth/roles";
import { dashboardNavItems } from "@/constants/dashboard-nav";
import { canAccessDashboardPath, getDashboardNavItemForPath, getDashboardHomePath, isClientScopedUser, } from "@/lib/auth/dashboard-access";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import type { INoteItem } from "@/providers/domainSeeds";
import { useNoteState } from "@/providers/noteProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { AutoSalesLogo } from "./AutoSales-logo";
import { useStyles } from "./dashboard-frame.styles";
const { Content, Header } = Layout;
type DashboardFrameProps = Readonly<{
    children: React.ReactNode;
}>;
const CLIENT_MESSAGE_CATEGORY = "Client Message";
const LEGACY_CLIENT_MESSAGE_PREFIX = `${CLIENT_MESSAGE_CATEGORY} `;
const isMessageNote = (note: INoteItem) => note.kind === "client_message" ||
    note.category === CLIENT_MESSAGE_CATEGORY ||
    note.category?.startsWith(LEGACY_CLIENT_MESSAGE_PREFIX);
export const DashboardFrame = ({ children }: DashboardFrameProps) => {
    const [collapsed, setCollapsed] = useState(false);
    const { styles, cx } = useStyles();
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuthActions();
    const { isAuthenticated, isPending, user } = useAuthState();
    const { notes } = useNoteState();
    const { opportunities } = useOpportunityState();
    const activeRole = user ? getPrimaryUserRole(user.roles) : null;
    const isClientScoped = isClientScopedUser(user?.clientIds);
    const activeNavItem = getDashboardNavItemForPath(pathname);
    const headerTitle = isClientScoped
        ? activeNavItem?.clientScopedHeaderTitle ?? activeNavItem?.headerTitle ?? "Client workspace"
        : activeNavItem?.headerTitle ?? "Sales command center";
    const headerDescription = isClientScoped
        ? activeNavItem?.clientScopedDescription ??
            activeNavItem?.description ??
            "Review the information and commercial activity connected to your account."
        : activeNavItem?.description ??
            "Track pipeline movement, workload, and the next actions that need attention.";
    const homePath = activeRole !== null ? getDashboardHomePath(activeRole, user?.clientIds) : "/dashboard";
    const shouldHoldShell = !isAuthenticated && isPending;
    const messageNotificationCount = useMemo(() => {
        const messageNotes = notes.filter(isMessageNote);
        if (isClientScoped) {
            const clientIds = new Set(user?.clientIds ?? []);
            return messageNotes.filter((note) => note.source === "workspace" &&
                note.status !== "Acknowledged" &&
                !!note.clientId &&
                clientIds.has(note.clientId)).length;
        }
        if (!activeRole) {
            return 0;
        }
        const pendingClientMessages = messageNotes.filter((note) => note.source === "client_portal" && note.status !== "Acknowledged");
        if (activeRole === "SalesRep") {
            const repOwnedClientIds = new Set(opportunities
                .filter((opportunity) => opportunity.ownerId === user?.userId)
                .map((opportunity) => opportunity.clientId));
            return pendingClientMessages.filter((note) => note.representativeId === user?.userId ||
                (!!note.clientId && repOwnedClientIds.has(note.clientId))).length;
        }
        return pendingClientMessages.length;
    }, [activeRole, isClientScoped, notes, opportunities, user?.clientIds, user?.userId]);
    const menuItems = useMemo(() => !activeRole
        ? []
        :
            dashboardNavItems
                .filter((item) => isClientScoped
                ? canAccessDashboardPath(item.href, activeRole, user?.clientIds)
                : item.access.includes(activeRole))
                .map((item) => ({
                icon: <item.icon />,
                key: item.key,
                label: (<Link href={item.href}>
              <span className={styles.menuLabel}>
                <span>{isClientScoped ? item.clientScopedLabel ?? item.label : item.label}</span>
                {item.href === "/dashboard/messages" && messageNotificationCount > 0 ? (<span aria-label={`${messageNotificationCount} unread message notification${messageNotificationCount === 1 ? "" : "s"}`} className={styles.navBadge} title={`${messageNotificationCount} pending message${messageNotificationCount === 1 ? "" : "s"}`}>
                    !
                  </span>) : null}
              </span>
            </Link>),
            })), [activeRole, isClientScoped, messageNotificationCount, styles.menuLabel, styles.navBadge, user?.clientIds]);
    useEffect(() => {
        if (isPending) {
            return;
        }
        if (!isAuthenticated) {
            router.replace("/login");
            return;
        }
        if (isAuthenticated &&
            activeRole &&
            !canAccessDashboardPath(pathname, activeRole, user?.clientIds)) {
            router.replace(homePath);
        }
    }, [activeRole, homePath, isAuthenticated, isPending, pathname, router, user?.clientIds]);
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        if (window.innerWidth < 1024) {
            const timer = window.setTimeout(() => {
                setCollapsed(true);
            }, 0);
            return () => window.clearTimeout(timer);
        }
    }, [pathname]);
    return (<div className={styles.root}>
      <div aria-hidden={collapsed} className={cx(styles.sidebar, collapsed && styles.sidebarCollapsed)}>
        <div className={styles.body}>
          <div className={styles.brandRow}>
            <AutoSalesLogo size={38}/>
            <div className={styles.brandText}>
              <Typography.Title className={styles.title} level={4}>
                AutoSales
              </Typography.Title>
              <Typography.Text className={styles.mutedText}>
                Sales workflow hub
              </Typography.Text>
            </div>
          </div>

          <Menu className={styles.menu} items={menuItems} mode="inline" selectedKeys={[activeNavItem?.key ?? pathname]} theme="dark"/>

          <div className={styles.sidebarSection}>
            <div className={styles.userBlock}>
              <Typography.Text className={styles.userName}>
                {user?.firstName ?? "Team member"} {user?.lastName ?? ""}
              </Typography.Text>
              <Typography.Text className={styles.mutedText}>
                {user?.email ?? "No active session"}
              </Typography.Text>
              <Tag color={isClientScoped ? "orange" : activeRole && isManagerRole(activeRole) ? "orange" : "blue"}>
                {isClientScoped
            ? "Client workspace"
            : activeRole
                ? getUserRoleLabel(activeRole)
                : "Resolving access"}
              </Tag>
            </div>
            <Button block icon={<LogoutOutlined />} onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <button aria-hidden={collapsed} aria-label="Close sidebar" className={cx("dashboard-sidebar-backdrop", collapsed && styles.backdropHidden)} onClick={() => setCollapsed(true)} type="button"/>

      <Layout className={cx("dashboard-main", collapsed && "dashboard-main--expanded")}>
        <Header className={styles.header}>
          <Space align="center" className={styles.headerLead}>
            <Button className={styles.iconButton} icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed((value) => !value)} type="text"/>
            <div className={styles.headerCopy}>
              <Typography.Title className={styles.headerTitle} level={5}>
                {headerTitle}
              </Typography.Title>
              <Typography.Text className={styles.headerDescription}>
                {headerDescription}
              </Typography.Text>
            </div>
          </Space>
          <Tag className={styles.headerTag} color="blue">
            {isClientScoped
            ? activeNavItem?.clientScopedLabel ?? activeNavItem?.label ?? "Overview"
            : activeNavItem?.label ?? "Overview"}
          </Tag>
        </Header>

        <Content className={styles.contentPadding}>
          {shouldHoldShell ? (<div className={styles.loadingContainer}>
              <div className={styles.loadingCopy}>
                <Typography.Title className={styles.loadingTitle} level={4}>
                  Loading your workspace
                </Typography.Title>
                <Typography.Text className={styles.loadingDescription}>
                  Applying the correct access for this account.
                </Typography.Text>
              </div>
            </div>) : (children)}
        </Content>
      </Layout>
    </div>);
};
