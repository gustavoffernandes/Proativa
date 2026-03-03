import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { questions, sections, type Respondent, type Company } from "@/data/mockData";

export interface SurveyResponse {
  id: string;
  config_id: string;
  response_timestamp: string | null;
  respondent_name: string | null;
  sex: string | null;
  age: number | null;
  sector: string | null;
  answers: Record<string, number>;
}

export interface RealCompany {
  id: string;
  name: string;
  sector: string;
  employees: number;
  color: string;
}

const COMPANY_COLORS = [
  "hsl(217, 71%, 45%)", "hsl(170, 60%, 45%)", "hsl(38, 92%, 55%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(200, 80%, 50%)",
  "hsl(330, 65%, 50%)", "hsl(150, 55%, 45%)",
];

export function useSurveyData() {
  const { data: configs = [], isLoading: loadingConfigs } = useQuery({
    queryKey: ["google-forms-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_forms_config")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: rawResponses = [], isLoading: loadingResponses } = useQuery({
    queryKey: ["survey-responses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_responses")
        .select("*");
      if (error) throw error;
      return data as SurveyResponse[];
    },
  });

  const isLoading = loadingConfigs || loadingResponses;

  // Build companies from configs
  const companies: RealCompany[] = configs.map((c, i) => ({
    id: c.id,
    name: c.company_name,
    sector: "—",
    employees: rawResponses.filter(r => r.config_id === c.id).length,
    color: COMPANY_COLORS[i % COMPANY_COLORS.length],
  }));

  // Convert to Respondent-like format for compatibility
  const respondents: Respondent[] = rawResponses.map(r => ({
    id: r.id,
    companyId: r.config_id,
    name: r.respondent_name || "Anônimo",
    sex: (r.sex === "Masculino" || r.sex === "Feminino") ? r.sex : "Prefiro não declarar",
    age: r.age || 0,
    sector: r.sector || "Não informado",
    answers: r.answers || {},
    responseTimestamp: r.response_timestamp,
  }));

  const hasData = respondents.length > 0;

  // Utility functions
  function getCompanyRespondents(companyId: string): Respondent[] {
    return respondents.filter(r => r.companyId === companyId);
  }

  function getQuestionAverage(questionId: string, companyId?: string): number {
    const pool = companyId ? getCompanyRespondents(companyId) : respondents;
    const withAnswer = pool.filter(r => r.answers[questionId] !== undefined);
    if (withAnswer.length === 0) return 0;
    const sum = withAnswer.reduce((acc, r) => acc + (r.answers[questionId] || 0), 0);
    return Math.round((sum / withAnswer.length) * 100) / 100;
  }

  function getSectionAverage(sectionId: string, companyId?: string): number {
    const sectionQuestions = questions.filter(q => q.section === sectionId);
    if (sectionQuestions.length === 0) return 0;
    const pool = companyId ? getCompanyRespondents(companyId) : respondents;
    if (pool.length === 0) return 0;
    
    // Only average questions that have at least one answer
    const questionsWithData = sectionQuestions.filter(q => 
      pool.some(r => r.answers[q.id] !== undefined)
    );
    if (questionsWithData.length === 0) return 0;
    
    const avg = questionsWithData.reduce((acc, q) => acc + getQuestionAverage(q.id, companyId), 0) / questionsWithData.length;
    return Math.round(avg * 100) / 100;
  }

  function getAnswerDistribution(questionId: string, companyId?: string) {
    const pool = companyId ? getCompanyRespondents(companyId) : respondents;
    const withAnswer = pool.filter(r => r.answers[questionId] !== undefined);
    return [1, 2, 3, 4, 5].map(value => {
      const count = withAnswer.filter(r => r.answers[questionId] === value).length;
      return {
        value,
        count,
        percentage: withAnswer.length > 0 ? Math.round((count / withAnswer.length) * 100) : 0,
      };
    });
  }

  // Get which questions actually have data
  function getAvailableQuestions() {
    const available = new Set<string>();
    respondents.forEach(r => {
      Object.keys(r.answers).forEach(k => available.add(k));
    });
    return questions.filter(q => available.has(q.id));
  }

  function getAvailableSections() {
    const availableQs = getAvailableQuestions();
    const sectionIds = new Set(availableQs.map(q => q.section));
    return sections.filter(s => sectionIds.has(s.id));
  }

  return {
    isLoading,
    hasData,
    companies,
    respondents,
    getCompanyRespondents,
    getQuestionAverage,
    getSectionAverage,
    getAnswerDistribution,
    getAvailableQuestions,
    getAvailableSections,
  };
}
