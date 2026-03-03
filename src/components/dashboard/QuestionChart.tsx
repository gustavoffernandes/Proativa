import { useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { BarChart3, PieChartIcon, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { scaleLabels } from "@/data/mockData";

type ChartType = "bar" | "pie" | "line" | "radar";

interface QuestionChartProps {
  questionId: string;
  questionText: string;
  companyId?: string;
  getAnswerDistribution?: (questionId: string, companyId?: string) => { value: number; count: number; percentage: number }[];
}

const COLORS = [
  "hsl(217, 71%, 45%)",
  "hsl(170, 60%, 45%)",
  "hsl(38, 92%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 72%, 55%)",
];

const chartTypes: { type: ChartType; icon: typeof BarChart3; label: string }[] = [
  { type: "bar", icon: BarChart3, label: "Barras" },
  { type: "pie", icon: PieChartIcon, label: "Pizza" },
  { type: "line", icon: TrendingUp, label: "Linha" },
  { type: "radar", icon: Target, label: "Radar" },
];

// Fallback import for backward compatibility
import { getAnswerDistribution as mockGetAnswerDistribution } from "@/data/mockData";

export function QuestionChart({ questionId, questionText, companyId, getAnswerDistribution }: QuestionChartProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const distFn = getAnswerDistribution || mockGetAnswerDistribution;
  const dist = distFn(questionId, companyId);
  const data = dist.map((d) => ({
    name: scaleLabels[d.value],
    value: d.count,
    percentage: d.percentage,
    score: d.value,
  }));

  const radarData = data.map(d => ({ subject: d.name, A: d.percentage, fullMark: 100 }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-sm font-semibold text-card-foreground leading-tight max-w-[75%]">{questionText}</h3>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {chartTypes.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              title={label}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                chartType === type
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : chartType === "pie" ? (
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percentage }) => `${name}: ${percentage}%`}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          ) : chartType === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2.5} dot={{ fill: COLORS[0], r: 4 }} />
            </LineChart>
          ) : (
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={75}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis tick={{ fontSize: 9 }} />
              <Radar dataKey="A" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.3} />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
