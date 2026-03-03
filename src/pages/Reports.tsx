import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSurveyData } from "@/hooks/useSurveyData";
import { questions, sections } from "@/data/mockData";
import { exportCompanyReport, exportComparisonReport, exportRawData, exportHeatmapData } from "@/lib/exportUtils";
import { exportCompanyPDF, exportComparisonPDF } from "@/lib/pdfExport";
import { Download, FileText, Building2, GitCompareArrows, Database, Grid3X3, CheckCircle2, AlertTriangle, XCircle, FileDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

function ClassBadge({ value }: { value: number }) {
  if (value >= 4) return <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success"><CheckCircle2 className="h-3 w-3" /> Bom</span>;
  if (value >= 3) return <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning"><AlertTriangle className="h-3 w-3" /> Moderado</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive"><XCircle className="h-3 w-3" /> Crítico</span>;
}

export default function Reports() {
  const surveyData = useSurveyData();
  const { isLoading, hasData, companies, respondents, getSectionAverage, getCompanyRespondents, getQuestionAverage, getAvailableSections, getAvailableQuestions, getAnswerDistribution } = surveyData;
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const availableSections = getAvailableSections();

  if (isLoading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  if (!hasData) {
    return <DashboardLayout><div className="flex flex-col items-center justify-center h-64 text-center"><p className="text-sm text-muted-foreground">Nenhum dado disponível. <a href="/integracoes" className="text-primary underline">Sincronize dados</a> primeiro.</p></div></DashboardLayout>;
  }

  const effectiveCompany = selectedCompany || companies[0]?.id || "";
  const effectiveCompareIds = compareIds.length > 0 ? compareIds : companies.map(c => c.id);
  const company = companies.find(c => c.id === effectiveCompany);
  const pool = getCompanyRespondents(effectiveCompany);
  const overallAvg = availableSections.length > 0
    ? availableSections.reduce((acc, s) => acc + getSectionAverage(s.id, effectiveCompany), 0) / availableSections.length
    : 0;

  const toggleCompare = (id: string) => {
    const current = effectiveCompareIds;
    setCompareIds(current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  };

  // Build export data object for the export functions
  const exportData = {
    companies,
    sections: availableSections.length > 0 ? availableSections : sections,
    questions,
    respondents,
    getCompanyRespondents,
    getSectionAverage,
    getQuestionAverage,
    getAnswerDistribution,
    getAvailableSections,
    getAvailableQuestions,
  };

  const handleExport = (type: string, fn: () => void) => {
    try {
      fn();
      toast({ title: "Relatório exportado!", description: `O arquivo ${type} foi baixado com sucesso.` });
    } catch (e) {
      toast({ title: "Erro na exportação", description: (e as Error).message, variant: "destructive" });
    }
  };

  const availableQuestionsList = getAvailableQuestions();

  const allQAvg = availableQuestionsList.map(q => ({ ...q, avg: getQuestionAverage(q.id, effectiveCompany) }));
  const critical = [...allQAvg].sort((a, b) => {
    const isNegA = a.section === "vivencias" || a.section === "saude";
    const isNegB = b.section === "vivencias" || b.section === "saude";
    const scoreA = isNegA ? a.avg : 6 - a.avg;
    const scoreB = isNegB ? b.avg : 6 - b.avg;
    return scoreB - scoreA;
  }).slice(0, 5);

  const strengths = [...allQAvg].sort((a, b) => {
    const isNegA = a.section === "vivencias" || a.section === "saude";
    const isNegB = b.section === "vivencias" || b.section === "saude";
    const scoreA = isNegA ? 6 - a.avg : a.avg;
    const scoreB = isNegB ? 6 - b.avg : b.avg;
    return scoreB - scoreA;
  }).slice(0, 5);

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Relatórios & Exportação</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Gere relatórios detalhados para enviar às empresas clientes</p>
          </div>
        </div>

        {/* ========== INDIVIDUAL REPORT ========== */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Relatório Individual
          </h3>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
            <select
              value={effectiveCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground w-full sm:w-auto"
            >
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="flex gap-2 sm:ml-auto">
              <button
                onClick={() => handleExport("PDF", () => exportCompanyPDF(effectiveCompany, exportData))}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span> PDF
              </button>
              <button
                onClick={() => handleExport("CSV", () => exportCompanyReport(effectiveCompany, exportData))}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-4 w-4" />
                CSV
              </button>
            </div>
          </div>

          {/* Preview summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-5">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{pool.length}</p>
              <p className="text-xs text-muted-foreground">Respostas</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{overallAvg.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Média Geral</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{availableQuestionsList.length}</p>
              <p className="text-xs text-muted-foreground">Perguntas</p>
            </div>
          </div>

          {/* Section summary table */}
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Pilar</th>
                  <th className="px-4 py-2 text-center font-semibold text-muted-foreground">Média</th>
                  <th className="px-4 py-2 text-center font-semibold text-muted-foreground">Classificação</th>
                  <th className="px-4 py-2 text-center font-semibold text-muted-foreground">vs. Geral</th>
                </tr>
              </thead>
              <tbody>
                {availableSections.map(s => {
                  const avg = getSectionAverage(s.id, effectiveCompany);
                  const generalAvg = getSectionAverage(s.id);
                  const diff = avg - generalAvg;
                  return (
                    <tr key={s.id} className="border-b border-border/50">
                      <td className="px-4 py-2 font-medium text-foreground">{s.name}</td>
                      <td className="px-4 py-2 text-center font-bold text-foreground">{avg.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center"><ClassBadge value={avg} /></td>
                      <td className={cn("px-4 py-2 text-center text-xs font-semibold", diff >= 0 ? "text-success" : "text-destructive")}>
                        {diff >= 0 ? "+" : ""}{diff.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Strengths & Critical */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-success/30 bg-success/5 p-4">
              <h4 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Pontos Fortes
              </h4>
              <ul className="space-y-2">
                {strengths.map((q, i) => (
                  <li key={q.id} className="flex items-start gap-2 text-xs text-foreground">
                    <span className="mt-0.5 font-bold text-success">{i + 1}.</span>
                    <span>{q.text} <span className="font-semibold text-success">({q.avg.toFixed(1)})</span></span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <h4 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Pontos Críticos
              </h4>
              <ul className="space-y-2">
                {critical.map((q, i) => (
                  <li key={q.id} className="flex items-start gap-2 text-xs text-foreground">
                    <span className="mt-0.5 font-bold text-destructive">{i + 1}.</span>
                    <span>{q.text} <span className="font-semibold text-destructive">({q.avg.toFixed(1)})</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ========== COMPARISON REPORT ========== */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-primary" />
            Relatório Comparativo
          </h3>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {companies.map(c => (
              <button
                key={c.id}
                onClick={() => toggleCompare(c.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  effectiveCompareIds.includes(c.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          {effectiveCompareIds.length >= 2 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExport("PDF Comparativo", () => exportComparisonPDF(effectiveCompareIds, exportData))}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <FileDown className="h-4 w-4" />
                Exportar PDF Comparativo
              </button>
              <button
                onClick={() => handleExport("CSV Comparativo", () => exportComparisonReport(effectiveCompareIds, exportData))}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-4 w-4" />
                CSV Comparativo
              </button>
            </div>
          )}
          {effectiveCompareIds.length < 2 && (
            <p className="text-xs text-muted-foreground">Selecione pelo menos 2 empresas para gerar o comparativo.</p>
          )}
        </div>

        {/* ========== HEATMAP EXPORT ========== */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-primary" />
            Exportação de Heatmap por Pilar
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableSections.map(s => (
              <button
                key={s.id}
                onClick={() => handleExport(`Heatmap ${s.name}`, () => exportHeatmapData(s.id, exportData))}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-4 w-4" />
                {s.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* ========== RAW DATA ========== */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Dados Brutos Completos
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Exporta todas as {respondents.length} respostas com todas as {availableQuestionsList.length} perguntas em formato CSV.
          </p>
          <button
            onClick={() => handleExport("Dados Brutos", () => exportRawData(exportData))}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar Dados Brutos (CSV)
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
