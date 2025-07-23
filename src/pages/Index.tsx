import { Navbar } from "../components/Navbar";
import { Hero } from "../components/landing/Hero";
import { WhyNexaSection } from "../components/landing/WhyNexa";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Community } from "../components/landing/Community";
import { Benefits } from "../components/landing/Benefits";
import { Pricing } from "../components/landing/Pricing";
import { CTA } from "../components/landing/CTA";
import { Footer } from "../components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen transition-colors duration-300 bg-background text-foreground">
      <Navbar />
      <Hero />
      <WhyNexaSection />
      <HowItWorks />
      <Community />
      <Benefits />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
