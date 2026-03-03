import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { useSurveyData } from "@/hooks/useSurveyData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Building2, Users, ClipboardCheck, TrendingUp, Loader2 } from "lucide-react";

const COLORS = [
  "hsl(217, 71%, 45%)", "hsl(170, 60%, 45%)", "hsl(38, 92%, 55%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)",
];

export default function Index() {
  const {
    isLoading, hasData, companies, respondents,
    getSectionAverage, getCompanyRespondents, getAvailableSections,
  } = useSurveyData();

  const availableSections = getAvailableSections();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Nenhum dado sincronizado</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vá para <strong>Integrações</strong> (acesso administrativo) para configurar e sincronizar dados do Google Sheets.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const totalRespondents = respondents.length;
  const totalCompanies = companies.length;
  const overallAvg = availableSections.length > 0
    ? availableSections.reduce((acc, s) => acc + getSectionAverage(s.id), 0) / availableSections.length
    : 0;

  const companyRanking = companies.map((c) => {
    const avg = availableSections.length > 0
      ? availableSections.reduce((acc, s) => acc + getSectionAverage(s.id, c.id), 0) / availableSections.length
      : 0;
    return { ...c, average: Math.round(avg * 100) / 100, respondentCount: getCompanyRespondents(c.id).length };
  }).sort((a, b) => b.average - a.average);

  const benchmarkData = companies.map((c) => {
    const row: Record<string, string | number> = { name: c.name.split(" ")[0] };
    availableSections.forEach((s) => {
      row[s.shortName] = getSectionAverage(s.id, c.id);
    });
    return row;
  });

  const radarData = availableSections.map((s) => ({
    subject: s.shortName,
    ...Object.fromEntries(companies.map((c) => [c.name.split(" ")[0], getSectionAverage(s.id, c.id)])),
  }));

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
          <p className="text-sm text-muted-foreground mt-1">Benchmark consolidado de todas as empresas</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard title="Empresas Ativas" value={totalCompanies} subtitle="configuradas" sparkData={[totalCompanies]} color="hsl(217, 71%, 45%)" />
          <KPICard title="Total Respostas" value={totalRespondents} subtitle="respondentes" sparkData={[totalRespondents]} color="hsl(170, 60%, 45%)" />
          <KPICard title="Média Geral" value={overallAvg.toFixed(2)} subtitle="escala 1-5" sparkData={[overallAvg]} color="hsl(38, 92%, 55%)" />
          <KPICard title="Seções Ativas" value={availableSections.length} subtitle={`de ${4} pilares`} sparkData={[availableSections.length]} color="hsl(280, 60%, 55%)" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">Benchmark por Pilar</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarkData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {availableSections.map((s, i) => (
                    <Bar key={s.id} dataKey={s.shortName} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">Perfil Comparativo (Radar)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} />
                  {companies.map((c, i) => (
                    <Radar key={c.id} name={c.name.split(" ")[0]} dataKey={c.name.split(" ")[0]}
                      stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.1} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">Ranking de Empresas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Empresa</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Respostas</th>
                  {availableSections.map((s) => (
                    <th key={s.id} className="px-4 py-3 text-center font-semibold text-muted-foreground">{s.shortName}</th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Média</th>
                </tr>
              </thead>
              <tbody>
                {companyRanking.map((c, i) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{c.respondentCount}</td>
                    {availableSections.map((s) => (
                      <td key={s.id} className="px-4 py-3 text-center">
                        <span className="font-medium">{getSectionAverage(s.id, c.id).toFixed(1)}</span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {c.average.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
