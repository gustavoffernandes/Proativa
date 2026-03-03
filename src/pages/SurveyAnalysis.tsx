import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QuestionChart } from "@/components/dashboard/QuestionChart";
import { questions, sections } from "@/data/mockData";
import { useSurveyData } from "@/hooks/useSurveyData";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function SurveyAnalysis() {
  const [activeSection, setActiveSection] = useState("contexto");
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>(undefined);
  const { isLoading, hasData, companies, getAvailableSections, getAvailableQuestions, getAnswerDistribution } = useSurveyData();

  const availableSections = getAvailableSections();
  const availableQuestions = getAvailableQuestions();
  const sectionQuestions = availableQuestions.filter((q) => q.section === activeSection);

  if (isLoading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  if (!hasData) {
    return <DashboardLayout><div className="flex flex-col items-center justify-center h-64 text-center"><p className="text-sm text-muted-foreground">Nenhum dado disponível. <a href="/integracoes" className="text-primary underline">Sincronize dados</a> primeiro.</p></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Análise por Pergunta</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualize a distribuição de respostas para cada item do PROATIVA</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex flex-wrap rounded-lg bg-secondary p-1 gap-1">
            {availableSections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "rounded-md px-2 sm:px-3 py-2 text-xs font-medium transition-colors",
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.shortName}
              </button>
            ))}
          </div>

          <select
            value={selectedCompany || ""}
            onChange={(e) => setSelectedCompany(e.target.value || undefined)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground w-full sm:w-auto"
          >
            <option value="">Todas as empresas</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {sectionQuestions.map((q) => (
            <QuestionChart
              key={q.id}
              questionId={q.id}
              questionText={`${q.number}. ${q.text}`}
              companyId={selectedCompany}
              getAnswerDistribution={getAnswerDistribution}
            />
          ))}
          {sectionQuestions.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2">Nenhuma pergunta com dados nesta seção.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
