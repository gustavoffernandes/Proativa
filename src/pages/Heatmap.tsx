import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HeatmapTable } from "@/components/dashboard/HeatmapTable";
import { MultiSelectCompanies } from "@/components/dashboard/MultiSelectCompanies";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { useSurveyData } from "@/hooks/useSurveyData";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function Heatmap() {
  const [activeSection, setActiveSection] = useState("contexto");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const { isLoading, hasData, companies, respondents, getAvailableSections, getAvailableQuestions, getQuestionAverage } = useSurveyData();

  const availableSections = getAvailableSections();

  if (isLoading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  if (!hasData) {
    return <DashboardLayout><div className="flex flex-col items-center justify-center h-64 text-center"><p className="text-sm text-muted-foreground">Nenhum dado disponível. <a href="/integracoes" className="text-primary underline">Sincronize dados</a> primeiro.</p></div></DashboardLayout>;
  }

  // Filter respondents by date range for the custom average function
  const filteredRespondents = respondents.filter(r => {
    if (!r.responseTimestamp) return !startDate && !endDate ? true : false;
    const ts = new Date(r.responseTimestamp);
    if (startDate && ts < startDate) return false;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (ts > endOfDay) return false;
    }
    return true;
  });

  // Custom average that respects date filter
  const getFilteredQuestionAverage = (questionId: string, companyId?: string): number => {
    const pool = companyId ? filteredRespondents.filter(r => r.companyId === companyId) : filteredRespondents;
    const withAnswer = pool.filter(r => r.answers[questionId] !== undefined);
    if (withAnswer.length === 0) return 0;
    const sum = withAnswer.reduce((acc, r) => acc + (r.answers[questionId] || 0), 0);
    return Math.round((sum / withAnswer.length) * 100) / 100;
  };

  const filteredCompanies = selectedCompanies.length > 0
    ? companies.filter(c => selectedCompanies.includes(c.id))
    : companies;

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Heatmap de Satisfação</h1>
          <p className="text-sm text-muted-foreground mt-1">Mapa de calor por pergunta × empresa</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-start gap-3 sm:gap-4">
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

          <MultiSelectCompanies
            companies={companies}
            selected={selectedCompanies}
            onChange={setSelectedCompanies}
          />

          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Legenda:</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-success/80" /> Bom (≥4)</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-warning/70" /> Moderado (3-4)</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-destructive/70" /> Crítico (&lt;3)</span>
        </div>

        <HeatmapTable
          sectionId={activeSection}
          companies={filteredCompanies}
          getQuestionAverage={getFilteredQuestionAverage}
          getAvailableQuestions={getAvailableQuestions}
        />
      </div>
    </DashboardLayout>
  );
}
