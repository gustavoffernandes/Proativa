import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Settings as SettingsIcon, User, Bell, Palette, Shield, Save, UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type TabId = "perfil" | "usuarios" | "notificacoes" | "aparencia" | "geral";

const allTabs: { id: TabId; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "usuarios", label: "Usuários", icon: UserPlus, adminOnly: true },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "aparencia", label: "Aparência", icon: Palette },
  { id: "geral", label: "Geral", icon: SettingsIcon },
];

export default function Settings() {
  const { user, role, isAdmin } = useAuth();
  const tabs = allTabs.filter(t => !t.adminOnly || isAdmin);
  const [activeTab, setActiveTab] = useState<TabId>("perfil");
  const [profile, setProfile] = useState({
    name: "Admin",
    email: user?.email ?? "",
    role: "Gestor SST",
    company: "PROATIVA Consultoria",
  });
  const [notifications, setNotifications] = useState({
    emailSync: true,
    emailReport: false,
    browserNotifications: true,
  });
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // New user form
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user");
  const [creatingUser, setCreatingUser] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: { email: newUserEmail, password: newUserPassword, role: newUserRole },
    });
    setCreatingUser(false);
    if (error || data?.error) {
      toast({ title: "Erro ao criar usuário", description: error?.message || data?.error, variant: "destructive" });
    } else {
      toast({ title: "Usuário criado!", description: `${newUserEmail} adicionado como ${newUserRole === "admin" ? "Administrador" : "Usuário"}.` });
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("user");
    }
  };

  const handleSave = () => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    toast({ title: "Configurações salvas!", description: "Suas alterações foram aplicadas com sucesso." });
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas preferências e configurações do sistema</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Tabs sidebar */}
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:w-[200px] shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 rounded-xl border border-border bg-card p-5 shadow-card">
            {activeTab === "usuarios" && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" /> Adicionar Novo Usuário
                </h3>
                <p className="text-xs text-muted-foreground">
                  Crie uma conta de acesso ao dashboard PROATIVA. O usuário poderá fazer login com as credenciais abaixo.
                </p>
                <form onSubmit={handleCreateUser} className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">E-mail do usuário</label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="usuario@empresa.com"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Senha inicial (mínimo 8 caracteres)</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Nível de acesso</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as "admin" | "user")}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="user">Usuário — acessa dashboards e relatórios</option>
                      <option value="admin">Administrador — acesso total incluindo configurações</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  >
                    {creatingUser ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</>
                    ) : (
                      <><UserPlus className="h-4 w-4" /> Criar Usuário</>
                    )}
                  </button>
                </form>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>Seu acesso atual:</strong> {role === "admin" ? "🔐 Administrador" : "👤 Usuário"}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "perfil" && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Informações do Perfil
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Nome</label>
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                    <input
                      value={profile.email}
                      onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Cargo</label>
                    <input
                      value={profile.role}
                      onChange={(e) => setProfile(p => ({ ...p, role: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Empresa</label>
                    <input
                      value={profile.company}
                      onChange={(e) => setProfile(p => ({ ...p, company: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notificacoes" && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" /> Preferências de Notificação
                </h3>
                <div className="space-y-4">
                  {[
                    { key: "emailSync" as const, label: "Notificar por e-mail quando sincronização concluir" },
                    { key: "emailReport" as const, label: "Enviar relatório semanal por e-mail" },
                    { key: "browserNotifications" as const, label: "Notificações no navegador" },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                      <div
                        className={cn(
                          "h-5 w-9 rounded-full transition-colors relative",
                          notifications[item.key] ? "bg-primary" : "bg-muted"
                        )}
                        onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                      >
                        <div
                          className={cn(
                            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                            notifications[item.key] ? "translate-x-4" : "translate-x-0.5"
                          )}
                        />
                      </div>
                      <span className="text-sm text-foreground">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "aparencia" && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" /> Tema e Aparência
                </h3>
                <div className="flex gap-3">
                  {(["light", "dark"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                        theme === t
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "h-16 w-24 rounded-lg border",
                        t === "light" ? "bg-card border-border" : "bg-sidebar border-sidebar-border"
                      )}>
                        <div className={cn(
                          "h-3 w-full rounded-t-lg",
                          t === "light" ? "bg-muted" : "bg-sidebar-accent"
                        )} />
                      </div>
                      <span className="text-xs font-medium text-foreground capitalize">
                        {t === "light" ? "Claro" : "Escuro"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "geral" && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Configurações Gerais
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Idioma</label>
                    <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm max-w-xs">
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Fuso Horário</label>
                    <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm max-w-xs">
                      <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                      <option value="America/Manaus">Manaus (GMT-4)</option>
                      <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
                    </select>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-1">Sobre</h4>
                    <p className="text-xs text-muted-foreground">
                      PROATIVA Dashboard Analítico v1.0
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Protocolo de Avaliação dos Riscos Psicossociais do Trabalho
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-border">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Save className="h-4 w-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
