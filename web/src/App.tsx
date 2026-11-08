import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { LiveCalculator } from "./components/LiveCalculator";
import { Showcase } from "./components/Showcase";
import { RingtonePlayerDemo } from "./components/RingtonePlayerDemo";
import { Architecture } from "./components/Architecture";
import { UseCases } from "./components/UseCases";
import { Download } from "./components/Download";
import { Faq } from "./components/Faq";
import { Footer } from "./components/Footer";
import "./App.css";

export function App() {
  return (
    <div className="min-h-screen bg-[#121316] text-[#e3e2e6] selection:bg-[#c8bfff] selection:text-[#121316]">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Content Sections */}
      <main>
        <Hero />
        <Features />
        <LiveCalculator />
        <Showcase />
        <RingtonePlayerDemo />
        <Architecture />
        <UseCases />
        <Download />
        <Faq />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
