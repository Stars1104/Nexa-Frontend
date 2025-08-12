import { Navbar } from "../components/Navbar";
import { Hero } from "../components/landing/Hero";
import { WhyNexaSection } from "../components/landing/WhyNexa";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Community } from "../components/landing/Community";
import { Benefits } from "../components/landing/Benefits";
import { Pricing } from "../components/landing/Pricing";
import { CTA } from "../components/landing/CTA";
import { FAQ } from "../components/landing/FAQ";
import { Footer } from "../components/landing/Footer";
import { Helmet } from "react-helmet-async";

const Index = () => {

  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-background text-foreground">
      <Helmet>
        <title>Nexa - Lar</title>
        <meta name="description" content="Browse Nexa guides filtered by brand and creator. Watch embedded videos and manage guides." />
        {canonical && <link rel="canonical" href={canonical} />}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <Navbar />
      <Hero />
      <WhyNexaSection />
      <HowItWorks />
      <Community />
      <Benefits />
      <Pricing />
      <CTA />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;
