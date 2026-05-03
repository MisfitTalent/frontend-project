import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
const DashboardLayout = ({ children, }: {
    children: React.ReactNode;
}) => {
    return <DashboardFrame>{children}</DashboardFrame>;
};
export default DashboardLayout;
