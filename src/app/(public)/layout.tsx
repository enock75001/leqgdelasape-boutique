import { SiteHeader } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-grow">{children}</main>
      <SiteFooter />
    </>
  );
}
