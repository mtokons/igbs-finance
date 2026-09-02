import { Sidebar } from "@/components/layout/sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-muted/30 p-8">{children}</main>
    </div>
  );
}
