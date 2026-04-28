import AuthProvider from "../../providers/authProvider";
import { AntdRegistry } from "@ant-design/nextjs-registry";


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}