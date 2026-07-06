import { Metadata } from "next";
import DashboardContent from "./_components/dashboard-content";
export const metadata: Metadata = {
  title: "Fina - Dashboard",
  description: "Your personal financial dashboard",
};
const DashboardPage = () => {
  return (
    <section className="p-2 space-y-4">
      <section id="header">
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        <p className="my-2 text-sm font-medium">
          Get insights into your spending, track your expenses and manage your
          finances
        </p>
      </section>
      <DashboardContent />
    </section>
  );
};

export default DashboardPage;
