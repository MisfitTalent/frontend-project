"use client";

import AuthProvider from "./authProvider";
import UiProvider from "./uiProvider";

type ProvidersProps = Readonly<{
  children: React.ReactNode;
}>;

export function AppProviders({ children }: ProvidersProps) {
  return (
    <UiProvider>
      <AuthProvider>{children}</AuthProvider>
    </UiProvider>
  );
}

export default AppProviders;
