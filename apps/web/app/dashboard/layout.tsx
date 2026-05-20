import { DashboardHeader } from "./_components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <div className="cofri-shell">
        <DashboardHeader />
        {children}
      </div>
    </main>
  );
}
