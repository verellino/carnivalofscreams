import Hero from "@/components/Hero";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-ink">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
      </main>
      <SiteFooter />
    </div>
  );
}
