import { Sidebar, MobileHeaderAndNav } from "@/components/layout/sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-muted/20">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <MobileHeaderAndNav />
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
