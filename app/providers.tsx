"use client";

import Providers from "@/providers";

type AppProvidersProps = Readonly<{
  children: React.ReactNode;
}>;

export function AppProviders({ children }: AppProvidersProps) {
  return <Providers>{children}</Providers>;
}

export default AppProviders;
