import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSurveyData } from "@/hooks/useSurveyData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const COLORS = [
  "hsl(217, 71%, 45%)", "hsl(170, 60%, 45%)", "hsl(38, 92%, 55%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)",
];

export default function CompanyComparison() {
  const { isLoading, hasData, companies, getSectionAverage, getCompanyRespondents, getAvailableSections } = useSurveyData();
  const [selected, setSelected] = useState<string[]>([]);

  const availableSections = getAvailableSections();

  // Auto-select all when data loads
  const effectiveSelected = selected.length > 0 ? selected : companies.map(c => c.id);

  const toggle = (id: string) => {
    const current = effectiveSelected;
    setSelected(current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  };

  if (isLoading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  if (!hasData) {
    return <DashboardLayout><div className="flex flex-col items-center justify-center h-64 text-center"><p className="text-sm text-muted-foreground">Nenhum dado disponível. <a href="/integracoes" className="text-primary underline">Sincronize dados</a> primeiro.</p></div></DashboardLayout>;
  }

  const selectedCompanies = companies.filter(c => effectiveSelected.includes(c.id));

  const data = availableSections.map((s) => {
    const row: Record<string, string | number> = { name: s.shortName };
    selectedCompanies.forEach((c) => {
      row[c.name.split(" ")[0]] = getSectionAverage(s.id, c.id);
    });
    return row;
  });

  const overviewData = selectedCompanies.map((c, i) => {
    const avg = availableSections.length > 0
      ? availableSections.reduce((acc, s) => acc + getSectionAverage(s.id, c.id), 0) / availableSections.length
      : 0;
    return { name: c.name.split(" ")[0], média: Math.round(avg * 100) / 100, respostas: getCompanyRespondents(c.id).length, color: COLORS[i % COLORS.length] };
  }).sort((a, b) => b.média - a.média);

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comparação entre Empresas</h1>
          <p className="text-sm text-muted-foreground mt-1">Compare indicadores entre as empresas clientes</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {companies.map((c, i) => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all",
                effectiveSelected.includes(c.id)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">Comparativo por Pilar</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {selectedCompanies.map((c, i) => (
                    <Bar key={c.id} dataKey={c.name.split(" ")[0]} fill={COLORS[companies.indexOf(c) % COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">Tendência por Pilar</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {selectedCompanies.map((c, i) => (
                    <Line key={c.id} type="monotone" dataKey={c.name.split(" ")[0]}
                      stroke={COLORS[companies.indexOf(c) % COLORS.length]} strokeWidth={2.5}
                      dot={{ fill: COLORS[companies.indexOf(c) % COLORS.length], r: 4 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {overviewData.map((c, i) => (
            <div key={c.name} className="rounded-xl border border-border bg-card p-4 shadow-card text-center">
              <div className="text-3xl font-bold" style={{ color: c.color }}>#{i + 1}</div>
              <p className="mt-1 text-sm font-semibold text-foreground">{c.name}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{c.média.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{c.respostas} respostas</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
