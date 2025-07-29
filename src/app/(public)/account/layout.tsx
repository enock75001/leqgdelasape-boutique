import { AccountSidebar } from "@/components/layout/account-sidebar";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 min-h-[calc(100vh-12rem)]">
      <div className="container mx-auto py-12">
        <div className="grid md:grid-cols-[250px_1fr] gap-12">
          <aside className="hidden md:block">
            <AccountSidebar />
          </aside>
          <main>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
