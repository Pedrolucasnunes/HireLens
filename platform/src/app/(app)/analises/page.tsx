import { LineChart } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function AnalisesPage() {
  return (
    <ComingSoon
      icon={LineChart}
      title="Análises profundas"
      description="Métricas de performance da IA, ROI por vaga, benchmarks de tempo de triagem e relatórios prontos para apresentar ao time de RH."
    />
  );
}
