import { DashboardHeader } from "./_components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-16">
        <DashboardHeader />
        {children}
      </div>
    </main>
  );
}
