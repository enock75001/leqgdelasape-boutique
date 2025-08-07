
import { ManagerSidebar } from "@/components/layout/manager-sidebar";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <ManagerSidebar />
      <div className="flex-grow p-8">
        {children}
      </div>
    </div>
  );
}
