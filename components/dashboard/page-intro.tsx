"use client";
import { Typography } from "antd";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "@/constants/dashboard-nav";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { useAuthState } from "@/providers/authProvider";
import { usePageModule } from "@/providers/pageProviders";
import { useStyles } from "./page-intro.styles";
export const PageIntro = () => {
    const { styles } = useStyles();
    const pathname = usePathname();
    const { user } = useAuthState();
    const page = usePageModule();
    const isClientScoped = isClientScopedUser(user?.clientIds);
    const activeNavItem = [...dashboardNavItems]
        .sort((left, right) => right.href.length - left.href.length)
        .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    const title = isClientScoped
        ? activeNavItem?.clientScopedHeaderTitle ?? page.title
        : page.title;
    const description = isClientScoped
        ? activeNavItem?.clientScopedDescription ?? page.description
        : page.description;
    return (<div className={styles.container}>
      <Typography.Title className={styles.title} level={2}>
        {title}
      </Typography.Title>
      <Typography.Paragraph className={styles.description}>
        {description}
      </Typography.Paragraph>
    </div>);
};
