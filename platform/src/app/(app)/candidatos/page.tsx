import { Users } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function CandidatosPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Banco de candidatos"
      description="Base unificada de todos os candidatos analisados pela IA com busca semântica, histórico de scores e match cruzado entre vagas."
    />
  );
}
