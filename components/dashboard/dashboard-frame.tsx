"use client";

import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Layout, Menu, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getSessionToken } from "@/lib/client/backend-api";
import { getPrimaryUserRole, getUserRoleLabel, isManagerRole } from "@/lib/auth/roles";
import { dashboardNavItems } from "@/constants/dashboard-nav";
import { canAccessDashboardPath, DASHBOARD_HOME_PATH } from "@/lib/auth/dashboard-access";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { type UserRole } from "@/providers/salesTypes";
import { BoxfusionLogo } from "./boxfusion-logo";

const { Content, Header } = Layout;

type DashboardFrameProps = Readonly<{
  children: React.ReactNode;
}>;

export function DashboardFrame({ children }: DashboardFrameProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthActions();
  const { isAuthenticated, isPending, user } = useAuthState();
  const activeRole: UserRole = getPrimaryUserRole(user?.roles);
  const activeNavItem = dashboardNavItems.find(
    (item) => pathname === item.key || pathname.startsWith(`${item.key}/`),
  );
  const headerTitle = activeNavItem?.headerTitle ?? "Sales command center";
  const headerDescription =
    activeNavItem?.description ??
    "Track pipeline movement, workload, and the next actions that need attention.";

  const menuItems = useMemo(
    () =>
      dashboardNavItems
        .filter((item) => item.access.includes(activeRole))
        .map((item) => ({
          icon: <item.icon />,
          key: item.key,
          label: <Link href={item.href}>{item.label}</Link>,
        })),
    [activeRole],
  );

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!isAuthenticated && !getSessionToken()) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && !canAccessDashboardPath(pathname, activeRole)) {
      router.replace(DASHBOARD_HOME_PATH);
    }
  }, [activeRole, isAuthenticated, isPending, pathname, router]);

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

  return (
    <div className="dashboard-shell">
      <div
        aria-hidden={collapsed}
        className={`dashboard-sidebar ${collapsed ? "dashboard-sidebar--collapsed" : ""}`}
      >
        <div className="flex h-screen flex-col overflow-hidden bg-[#1f365c]">
          <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
            <BoxfusionLogo size={38} />
            <div className="min-w-0">
              <Typography.Title className="!mb-0 !text-lg !text-white" level={4}>
                AutoSales
              </Typography.Title>
              <Typography.Text className="!text-slate-300">
                Sales workflow hub
              </Typography.Text>
            </div>
          </div>

          <Menu
            className="min-h-0 flex-1 overflow-y-auto border-0 bg-transparent px-3 py-4"
            items={menuItems}
            mode="inline"
            selectedKeys={[activeNavItem?.key ?? pathname]}
            theme="dark"
          />

          <div className="shrink-0 space-y-3 border-t border-white/10 px-5 py-5">
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
        <Header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#1f365c] px-4 py-3 md:px-6">
          <Space align="center" className="min-w-0">
            <Button
              className="!text-white hover:!text-[#f7b267]"
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
          <Tag color="#f28c28">{activeNavItem?.label ?? "Overview"}</Tag>
        </Header>

        <Content className="p-4 md:p-6">{children}</Content>
      </Layout>
    </div>
  );
}
