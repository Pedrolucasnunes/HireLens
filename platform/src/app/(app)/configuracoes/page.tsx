import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function ConfiguracoesPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Configurações"
      description="Time, integrações com ATS, faturamento, personalização do tom da IA e regras de scoring por vaga."
    />
  );
}
