import { questions, type Question } from "@/data/mockData";
import type { RealCompany } from "@/hooks/useSurveyData";

function getColor(value: number, isNegative: boolean): string {
  const v = isNegative ? 6 - value : value;
  if (v >= 4) return "bg-success/80 text-success-foreground";
  if (v >= 3) return "bg-warning/70 text-warning-foreground";
  return "bg-destructive/70 text-destructive-foreground";
}

interface HeatmapProps {
  sectionId: string;
  companies: RealCompany[];
  getQuestionAverage: (questionId: string, companyId?: string) => number;
  getAvailableQuestions: () => Question[];
}

export function HeatmapTable({ sectionId, companies, getQuestionAverage, getAvailableQuestions }: HeatmapProps) {
  const availableQuestions = getAvailableQuestions();
  const sectionQuestions = availableQuestions.filter((q) => q.section === sectionId);
  const isNegative = sectionId === "vivencias" || sectionId === "saude";

  if (sectionQuestions.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma pergunta com dados nesta seção.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="sticky left-0 z-10 bg-secondary/90 px-4 py-3 text-left font-semibold text-foreground min-w-[200px]">
              Pergunta
            </th>
            {companies.map((c) => (
              <th key={c.id} className="px-3 py-3 text-center font-semibold text-foreground min-w-[100px]">
                <span className="block truncate max-w-[100px]" title={c.name}>{c.name.split(' ')[0]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sectionQuestions.map((q, i) => (
            <tr key={q.id} className={i % 2 === 0 ? "" : "bg-muted/30"}>
              <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium text-foreground border-r border-border">
                {q.number}. {q.text}
              </td>
              {companies.map((c) => {
                const avg = getQuestionAverage(q.id, c.id);
                return (
                  <td key={c.id} className="px-3 py-2.5 text-center">
                    <span className={`inline-flex h-8 w-12 items-center justify-center rounded-md text-xs font-bold ${avg > 0 ? getColor(avg, isNegative) : 'bg-muted text-muted-foreground'}`}>
                      {avg > 0 ? avg.toFixed(1) : "—"}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
