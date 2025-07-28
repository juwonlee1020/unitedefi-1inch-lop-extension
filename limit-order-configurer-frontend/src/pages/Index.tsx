import { Header } from "@/components/Header";
import { StrategyConfigurator } from "@/components/StrategyConfigurator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-8 pb-16">
        <StrategyConfigurator />
      </main>
    </div>
  );
};

export default Index;
