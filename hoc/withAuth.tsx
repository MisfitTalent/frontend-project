"use client";
import React from "react";
import { Spin } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthState } from "@/providers/authProvider";
export const withAuth = <TProps extends object>(Component: React.ComponentType<TProps>) => {
    return function AuthenticatedComponent(props: TProps) {
        const { isAuthenticated, isPending } = useAuthState();
        const router = useRouter();
        useEffect(() => {
            if (!isPending && !isAuthenticated) {
                router.push("/login");
            }
        }, [isAuthenticated, isPending, router]);
        if (isPending || !isAuthenticated) {
            return (<div className="flex min-h-[40vh] items-center justify-center">
          <Spin size="large"/>
        </div>);
        }
        return React.createElement(Component, props);
    };
};
