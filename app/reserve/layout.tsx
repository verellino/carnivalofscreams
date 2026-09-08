import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function ReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-ink">
      <SiteHeader />
      <main className="relative flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </div>
  );
}
