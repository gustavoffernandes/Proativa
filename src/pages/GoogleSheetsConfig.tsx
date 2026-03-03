import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus, Trash2, RefreshCw, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface FormConfig {
  id: string;
  company_name: string;
  spreadsheet_id: string;
  sheet_name: string;
  form_url: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

export default function GoogleSheetsConfig() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    spreadsheet_id: "",
    sheet_name: "Form Responses 1",
    form_url: "",
  });

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["google-forms-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_forms_config")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FormConfig[];
    },
  });

  const addConfig = useMutation({
    mutationFn: async (newConfig: typeof formData) => {
      const { error } = await supabase.from("google_forms_config").insert({
        company_name: newConfig.company_name,
        spreadsheet_id: newConfig.spreadsheet_id,
        sheet_name: newConfig.sheet_name,
        form_url: newConfig.form_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-forms-config"] });
      setShowForm(false);
      setFormData({ company_name: "", spreadsheet_id: "", sheet_name: "Form Responses 1", form_url: "" });
      toast({ title: "Formulário adicionado!", description: "A configuração foi salva com sucesso." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("google_forms_config").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-forms-config"] });
      toast({ title: "Removido", description: "Configuração excluída." });
    },
  });

  const syncNow = useMutation({
    mutationFn: async (configId: string) => {
      const res = await supabase.functions.invoke("sync-google-sheets", {
        body: { configId },
      });
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-forms-config"] });
      toast({ title: "Sincronização concluída!", description: "Os dados foram atualizados." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro na sincronização", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Integração Google Sheets</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Configure a sincronização automática de dados do Google Forms
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" />
            Novo Formulário
          </button>
        </div>

        {/* Setup guide */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            Como configurar a integração
          </h3>
          <ol className="space-y-2 text-xs text-muted-foreground list-decimal pl-4">
            <li>Crie um Google Form com as perguntas do PROATIVA</li>
            <li>Vincule as respostas a uma planilha Google Sheets</li>
            <li>Compartilhe a planilha com acesso de <strong>leitura</strong> para a conta de serviço</li>
            <li>Copie o <strong>ID da planilha</strong> (parte da URL entre /d/ e /edit)</li>
            <li>Adicione a configuração abaixo informando a empresa e o ID</li>
          </ol>
          <div className="mt-3 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Status:</strong> A chave de API do Google ainda não foi configurada. 
              Adicione o secret <code className="bg-muted px-1 rounded">GOOGLE_SHEETS_API_KEY</code> nas configurações do backend para ativar a sincronização.
            </p>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-primary/30 bg-card p-5 shadow-card animate-fade-in">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Adicionar Formulário</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome da Empresa</label>
                <input
                  value={formData.company_name}
                  onChange={e => setFormData(p => ({ ...p, company_name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Ex: TechSol Ltda"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">ID da Planilha</label>
                <input
                  value={formData.spreadsheet_id}
                  onChange={e => setFormData(p => ({ ...p, spreadsheet_id: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Ex: 1BxiMV..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome da Aba</label>
                <input
                  value={formData.sheet_name}
                  onChange={e => setFormData(p => ({ ...p, sheet_name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">URL do Formulário (opcional)</label>
                <input
                  value={formData.form_url}
                  onChange={e => setFormData(p => ({ ...p, form_url: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="https://docs.google.com/forms/..."
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => addConfig.mutate(formData)}
                disabled={!formData.company_name || !formData.spreadsheet_id}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Config list */}
        <div className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && configs.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <Link2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum formulário configurado ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Clique em "Novo Formulário" para começar</p>
            </div>
          )}
          {configs.map(config => (
            <div key={config.id} className="rounded-xl border border-border bg-card p-4 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{config.company_name}</p>
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    config.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  )}>
                    {config.is_active ? <><CheckCircle2 className="h-2.5 w-2.5" /> Ativo</> : <><XCircle className="h-2.5 w-2.5" /> Inativo</>}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Planilha: {config.spreadsheet_id.slice(0, 20)}... | Aba: {config.sheet_name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {config.last_sync_at
                    ? `Última sync: ${new Date(config.last_sync_at).toLocaleString("pt-BR")}`
                    : "Nunca sincronizado"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {config.form_url && (
                  <a href={config.form_url} target="_blank" rel="noopener" className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => syncNow.mutate(config.id)}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:text-primary transition-colors"
                  title="Sincronizar agora"
                >
                  <RefreshCw className={cn("h-4 w-4", syncNow.isPending && "animate-spin")} />
                </button>
                <button
                  onClick={() => deleteConfig.mutate(config.id)}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive transition-colors"
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
