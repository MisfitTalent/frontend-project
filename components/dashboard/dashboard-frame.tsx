"use client";

import {
  BellOutlined,
  CloseOutlined,
  HomeOutlined,
  LogoutOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Badge, Button, Layout, Menu, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { backendRequest, coerceItems, getSessionToken } from "@/lib/client/backend-api";
import { listServiceRequests } from "@/lib/client/service-request-api";
import { getPrimaryUserRole, getUserRoleLabel, isManagerRole } from "@/lib/auth/roles";
import { dashboardNavItems } from "@/constants/dashboard-nav";
import {
  canAccessDashboardPath,
  getDashboardHomePath,
  getDashboardNavItemForPath,
} from "@/lib/auth/dashboard-access";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import type { INoteItem } from "@/providers/domainSeeds";
import { type UserRole } from "@/providers/salesTypes";
import { BoxfusionLogo } from "./boxfusion-logo";

const { Content, Header } = Layout;

type DashboardFrameProps = Readonly<{
  children: React.ReactNode;
}>;

export function DashboardFrame({ children }: DashboardFrameProps) {
  const alertDismissKey = "dashboard-admin-alert-dismissed";
  const messageDismissKey = "dashboard-message-alert-dismissed";
  const [collapsed, setCollapsed] = useState(false);
  const [dismissedAlertSignature, setDismissedAlertSignature] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.sessionStorage.getItem(alertDismissKey),
  );
  const [dismissedMessageSignature, setDismissedMessageSignature] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.sessionStorage.getItem(messageDismissKey),
  );
  const [pendingAdminRequestCount, setPendingAdminRequestCount] = useState(0);
  const [latestPendingRequestId, setLatestPendingRequestId] = useState<string | null>(null);
  const [latestPendingRequestTitle, setLatestPendingRequestTitle] = useState<string | null>(null);
  const [incomingMessageCount, setIncomingMessageCount] = useState(0);
  const [latestIncomingMessage, setLatestIncomingMessage] = useState<INoteItem | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthActions();
  const { isAuthenticated, isPending, user } = useAuthState();
  const activeRole: UserRole = getPrimaryUserRole(user?.roles);
  const activeNavItem = getDashboardNavItemForPath(pathname);
  const homePath = getDashboardHomePath(activeRole, user?.clientIds);
  const isHomeRoute = pathname === homePath;
  const headerTitle = activeNavItem?.headerTitle ?? "Sales command center";
  const headerDescription =
    activeNavItem?.description ??
    "Track pipeline movement, workload, and the next actions that need attention.";

  const menuItems = useMemo(
    () =>
      dashboardNavItems
        .filter(
          (item) =>
            item.access.includes(activeRole) &&
            canAccessDashboardPath(item.href, activeRole, user?.clientIds),
        )
        .map((item) => ({
          icon: <item.icon />,
          key: item.key,
          label: <Link href={item.href}>{item.label}</Link>,
        })),
    [activeRole, user?.clientIds],
  );

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!isAuthenticated && !getSessionToken()) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && !canAccessDashboardPath(pathname, activeRole, user?.clientIds)) {
      router.replace(getDashboardHomePath(activeRole, user?.clientIds));
    }
  }, [activeRole, isAuthenticated, isPending, pathname, router, user?.clientIds]);

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

  useEffect(() => {
    if (!isAuthenticated || activeRole !== "Admin") {
      return;
    }

    let isActive = true;
    let pollTimer: number | null = null;

    const loadPendingAdminRequests = async () => {
      try {
        const pendingRequests = (await listServiceRequests(["submitted"])).sort((left, right) =>
          right.createdAt.localeCompare(left.createdAt),
        );
        const count = pendingRequests.length;

        if (isActive) {
          setPendingAdminRequestCount(count);
          setLatestPendingRequestId(pendingRequests[0]?.id ?? null);
          setLatestPendingRequestTitle(pendingRequests[0]?.title ?? null);
        }
      } catch (error) {
        console.error(error);

        if (isActive) {
          setPendingAdminRequestCount(0);
          setLatestPendingRequestId(null);
          setLatestPendingRequestTitle(null);
        }
      }
    };

    void loadPendingAdminRequests();
    pollTimer = window.setInterval(() => {
      void loadPendingAdminRequests();
    }, 5000);

    const handleWorkspaceUpdate = () => {
      void loadPendingAdminRequests();
    };

    window.addEventListener("mock-workspace-updated", handleWorkspaceUpdate);

    return () => {
      isActive = false;
      if (pollTimer !== null) {
        window.clearInterval(pollTimer);
      }
      window.removeEventListener("mock-workspace-updated", handleWorkspaceUpdate);
    };
  }, [activeRole, isAuthenticated]);

  const isPlainMessage = (note: INoteItem) =>
    note.kind === "client_message" && !note.requestType;

  const getIncomingMessages = useCallback(
    (notes: INoteItem[]) => {
      const clientIdSet = new Set(user?.clientIds ?? []);

      if (clientIdSet.size > 0) {
        return notes.filter(
          (note) =>
            isPlainMessage(note) &&
            Boolean(note.clientId) &&
            clientIdSet.has(note.clientId as string) &&
            note.source !== "client_portal",
        );
      }

      if (activeRole === "SalesRep" && user?.userId) {
        return notes.filter(
          (note) =>
            isPlainMessage(note) &&
            note.representativeId === user.userId &&
            note.source !== "client_portal",
        );
      }

      return notes.filter(
        (note) => isPlainMessage(note) && note.source === "client_portal",
      );
    },
    [activeRole, user?.clientIds, user?.userId],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isActive = true;
    let pollTimer: number | null = null;

    const loadIncomingMessages = async () => {
      try {
        const payload = await backendRequest<{ items?: INoteItem[] } | INoteItem[]>("/api/Notes");
        const incomingMessages = getIncomingMessages(coerceItems(payload)).sort((left, right) =>
          right.createdDate.localeCompare(left.createdDate),
        );

        if (isActive) {
          setIncomingMessageCount(incomingMessages.length);
          setLatestIncomingMessage(incomingMessages[0] ?? null);
        }
      } catch (error) {
        console.error(error);

        if (isActive) {
          setIncomingMessageCount(0);
          setLatestIncomingMessage(null);
        }
      }
    };

    void loadIncomingMessages();
    pollTimer = window.setInterval(() => {
      void loadIncomingMessages();
    }, 5000);

    const handleWorkspaceUpdate = () => {
      void loadIncomingMessages();
    };

    window.addEventListener("mock-workspace-updated", handleWorkspaceUpdate);

    return () => {
      isActive = false;
      if (pollTimer !== null) {
        window.clearInterval(pollTimer);
      }
      window.removeEventListener("mock-workspace-updated", handleWorkspaceUpdate);
    };
  }, [getIncomingMessages, isAuthenticated]);

  const currentAlertSignature = `${latestPendingRequestId ?? "none"}:${pendingAdminRequestCount}`;
  const isAdminAlertDismissed =
    pendingAdminRequestCount > 0 && dismissedAlertSignature === currentAlertSignature;
  const currentMessageAlertSignature = `${latestIncomingMessage?.id ?? "none"}:${incomingMessageCount}`;
  const isMessageAlertDismissed =
    incomingMessageCount > 0 && dismissedMessageSignature === currentMessageAlertSignature;

  const dismissAdminAlert = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(alertDismissKey, currentAlertSignature);
    }

    setDismissedAlertSignature(currentAlertSignature);
  };

  const dismissMessageAlert = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(messageDismissKey, currentMessageAlertSignature);
    }

    setDismissedMessageSignature(currentMessageAlertSignature);
  };

  const openAdminRequestQueue = () => {
    dismissAdminAlert();

    const params = new URLSearchParams();
    params.set("source", "client_portal");

    if (latestPendingRequestId) {
      params.set("threadId", latestPendingRequestId);
    }

    router.push(`/dashboard/messages?${params.toString()}`);
  };

  const openIncomingMessages = () => {
    dismissMessageAlert();

    const params = new URLSearchParams();

    if (latestIncomingMessage?.clientId) {
      params.set("clientId", latestIncomingMessage.clientId);
    }

    if (latestIncomingMessage?.representativeId) {
      params.set("representativeId", latestIncomingMessage.representativeId);
    }

    if (latestIncomingMessage?.id) {
      params.set("threadId", latestIncomingMessage.id);
    }

    if (latestIncomingMessage?.source) {
      params.set("source", latestIncomingMessage.source);
    }

    router.push(params.toString() ? `/dashboard/messages?${params.toString()}` : "/dashboard/messages");
  };

  return (
    <div className="dashboard-shell">
      <div
        aria-hidden={collapsed}
        className={`dashboard-sidebar ${collapsed ? "dashboard-sidebar--collapsed" : ""}`}
      >
        <div className="dashboard-sidebar-shell">
          <button
            className="dashboard-sidebar-brand flex items-center gap-3 transition-colors"
            onClick={() => router.push(homePath)}
            type="button"
          >
            <BoxfusionLogo size={38} />
            <div className="min-w-0">
              <Typography.Title className="!mb-0 !text-lg !text-white" level={4}>
                AutoSales
              </Typography.Title>
              <Typography.Text className="!text-slate-300">
                Sales workflow hub
              </Typography.Text>
            </div>
          </button>

          <div className="dashboard-sidebar-menu-shell min-h-0 flex-1">
            <Menu
              className="dashboard-sidebar-menu dashboard-sidebar-scroll h-full border-0 bg-transparent px-3 py-4"
              items={menuItems}
              mode="inline"
              selectedKeys={[activeNavItem?.key ?? pathname]}
              theme="dark"
            />
          </div>

          <div className="dashboard-sidebar-footer shrink-0 space-y-3">
            <div className="space-y-1">
              <Typography.Text className="block font-medium !text-white">
                {user?.firstName ?? "Team member"} {user?.lastName ?? ""}
              </Typography.Text>
              <Typography.Text className="block !text-slate-300">
                {user?.email ?? "No active session"}
              </Typography.Text>
              <Tag color={isManagerRole(activeRole) ? "#f28c28" : "#4f7cac"}>
                {getUserRoleLabel(activeRole)}
              </Tag>
            </div>
            <Button block icon={<LogoutOutlined />} onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <button
        aria-hidden={collapsed}
        aria-label="Close sidebar"
        className={`dashboard-sidebar-backdrop ${collapsed ? "dashboard-sidebar-backdrop--hidden" : ""}`}
        onClick={() => setCollapsed(true)}
        type="button"
      />

      <Layout className={`dashboard-main ${collapsed ? "dashboard-main--expanded" : ""}`}>
        <Header className="dashboard-header sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 !h-auto !leading-normal">
          <Space align="center" className="min-w-0">
            <Button
              className="dashboard-header-toggle !text-white"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((value) => !value)}
              type="text"
            />
            <div className="min-w-0">
              <Typography.Title
                className="!mb-0 truncate !text-base !text-white"
                level={5}
              >
                {headerTitle}
              </Typography.Title>
              <Typography.Text className="block max-w-full truncate !text-slate-300">
                {headerDescription}
              </Typography.Text>
            </div>
          </Space>
          <Space size="middle">
            {activeRole === "Admin" ? (
              pendingAdminRequestCount > 0 && !isAdminAlertDismissed ? (
                <div
                  aria-label={`${pendingAdminRequestCount} client requests need admin attention`}
                  className="flex max-w-[24rem] items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-amber-950 shadow-sm"
                  role="region"
                >
                  <Badge count={pendingAdminRequestCount} size="small">
                    <button
                      className="flex items-center gap-2 rounded-full bg-transparent px-2 py-1 text-left text-xs font-medium text-amber-950 transition hover:bg-amber-100"
                      onClick={openAdminRequestQueue}
                      type="button"
                    >
                      <BellOutlined />
                      <span className="max-w-[14rem] truncate">
                        {latestPendingRequestTitle ?? `${pendingAdminRequestCount} request${pendingAdminRequestCount === 1 ? "" : "s"} waiting`}
                      </span>
                    </button>
                  </Badge>
                  <button
                    aria-label="Dismiss admin request alert"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-amber-700 transition hover:bg-amber-100"
                    onClick={dismissAdminAlert}
                    type="button"
                  >
                    <CloseOutlined />
                  </button>
                </div>
              ) : (
                <Button
                  className="dashboard-header-home-button"
                  icon={<BellOutlined />}
                  onClick={openAdminRequestQueue}
                  type="default"
                >
                  Requests
                </Button>
              )
            ) : null}
            {incomingMessageCount > 0 && !isMessageAlertDismissed ? (
              <div
                aria-label={`${incomingMessageCount} message notifications`}
                className="flex max-w-[24rem] items-center gap-2"
                role="region"
              >
                <Badge count={incomingMessageCount} size="small">
                  <Button
                    className="dashboard-header-home-button border-sky-300 !bg-sky-50 !text-sky-950 hover:!border-sky-400 hover:!bg-sky-100 hover:!text-sky-950"
                    icon={<MailOutlined />}
                    onClick={openIncomingMessages}
                    type="default"
                  >
                    <span className="max-w-[14rem] truncate">
                      {latestIncomingMessage?.title ??
                        `${incomingMessageCount} message${incomingMessageCount === 1 ? "" : "s"} waiting`}
                    </span>
                  </Button>
                </Badge>
                <button
                  aria-label="Dismiss message alert"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-sky-700 transition hover:bg-sky-100"
                  onClick={dismissMessageAlert}
                  type="button"
                >
                  <CloseOutlined />
                </button>
              </div>
            ) : (
              <Button
                className="dashboard-header-home-button"
                icon={<MailOutlined />}
                onClick={openIncomingMessages}
                type="default"
              >
                Messages
              </Button>
            )}
            {!isHomeRoute ? (
              <Button
                className="dashboard-header-home-button"
                icon={<HomeOutlined />}
                onClick={() => router.push(homePath)}
                type="default"
              >
                Home
              </Button>
            ) : null}
            <Tag className="dashboard-header-page-tag" color="#f28c28">
              {activeNavItem?.label ?? "Overview"}
            </Tag>
          </Space>
        </Header>

        <Content className="dashboard-content p-4 md:p-6">{children}</Content>
      </Layout>
    </div>
  );
}
