# PROATIVA — Dashboard de Análise de Pesquisas

Sistema de dashboard para leitura, armazenamento e análise de respostas vindas do Google Forms (via Google Sheets).  
Desenvolvido com **React**, **Vite**, **TypeScript** e **Lovable Cloud** como back-end (Banco de dados PostgreSQL, Autenticação e Edge Functions).

---

## 🚀 Tecnologias Utilizadas

- **Frontend:** React (Vite), TypeScript, Tailwind CSS, shadcn/ui  
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, Edge Functions)  
- **Gerenciador de Pacotes:** NPM (ou Bun, opcional)  

---

## 📋 Pré-requisitos

Antes de começar, você precisará ter as seguintes ferramentas instaladas em sua máquina:

### 1️⃣ Node.js (Ambiente de Execução)

- **Windows:**  
  Baixe o instalador `.msi` no site oficial do Node.js (versão LTS recomendada) e siga o processo padrão de instalação.

- **Mac (usando Homebrew):**

```bash
brew install node
```

---

### 2️⃣ Git (Controle de Versão)

- **Windows:**  
  Baixe e instale o Git for Windows. Recomendamos usar o Git Bash para os comandos.

- **Mac:**  
  Geralmente já vem instalado. Caso não tenha:

```bash
brew install git
```

---

### 3️⃣ Supabase CLI

A CLI é essencial para enviar as tabelas (migrations) e funções para a nuvem.

- **Windows (PowerShell ou CMD como Administrador):**

```bash
npm install -g supabase
```

- **Mac (Homebrew):**

```bash
brew install supabase/tap/supabase
```

---

# 🛠️ Instalação e Configuração

## 🔹 Passo 1: Clonar o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd remix-of-data-insight-hub-1
```

---

## 🔹 Passo 2: Instalar as Dependências

Dentro da pasta do projeto:

```bash
npm install
```

> O projeto também suporta **Bun**, caso prefira:
>
> ```bash
> bun install
> ```

---

## 🔹 Passo 3: Configurando o Supabase (O Coração do Sistema)

1. Acesse: https://database.supabase.com  
2. Faça login ou crie uma conta  
3. Clique em **New Project**  
4. Escolha uma organização  
5. Defina:
   - Nome do projeto (ex: `data-insight-hub`)
   - Senha forte para o banco
6. Clique em **Create new project**
7. Aguarde o provisionamento

---

## 🔹 Passo 4: Configurando Variáveis de Ambiente (.env)

O projeto precisa da **Project URL** e da **Anon/Public Key**.

### Como encontrar:

1. Acesse seu projeto no painel Supabase  
2. Vá em **Project Settings (ícone de engrenagem)**  
3. Clique na aba **API**  
4. Copie:
   - **Project URL**
   - **anon public key**

### Configure o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seucodigo.supabase.co
VITE_SUPABASE_ANON_KEY=cole_sua_chave_anon_aqui
```

---

## 🔹 Passo 5: Criando as Tabelas (Migrations)

O projeto já possui as migrations na pasta:

```
/supabase/migrations
```

### 1️⃣ Login na CLI:

```bash
supabase login
```

### 2️⃣ Vincular ao projeto na nuvem:

Copie o **Project Reference ID** (presente na URL do projeto).

```bash
supabase link --project-ref <SEU_PROJECT_REF_AQUI>
```

> Será solicitada a senha do banco criada no Passo 3.

### 3️⃣ Enviar as migrations:

```bash
supabase db push
```

---

## 🔹 Passo 6: Deploy das Edge Functions

As funções estão em:

```
/supabase/functions
```

Faça o deploy:

```bash
supabase functions deploy auto-sync
supabase functions deploy create-user
supabase functions deploy sync-google-sheets
```

---

### ⚠️ Configuração Extra: Google Sheets API

Para funcionar a sincronização com Google Sheets:

1. Gere uma API Key no Google Cloud com acesso à Google Sheets API.
2. Salve a chave como segredo no Supabase:

```bash
supabase secrets set GOOGLE_SHEETS_API_KEY=cole_sua_chave_do_google_aqui
```

3. Faça o deploy novamente:

```bash
supabase functions deploy sync-google-sheets
```

---

## 🔹 Passo 7: Rodando a Aplicação

```bash
npm run dev
```

Saída esperada:

```
VITE v5.x.x ready in 500 ms
➜ Local: http://localhost:8080/
```

Abra no navegador:

```
http://localhost:8080/
```

🎉 Pronto! O app já estará conectado ao Supabase.

---

# 📂 Estrutura do Projeto

```
/src/components          → Componentes reutilizáveis (UI, gráficos, tabelas)
/src/pages               → Páginas (Dashboard, Login, Relatórios, Configurações)
/src/hooks               → Hooks customizados (ex: useSurveyData.ts)
/src/integrations        → Cliente Supabase + tipagens TS
/supabase/migrations     → Estrutura SQL do banco
/supabase/functions      → Edge Functions serverless
```

---

# 🆘 Troubleshooting

## ❌ "Command not found: supabase"

**Motivo:** CLI não instalada corretamente.

### Windows:
- Execute como Administrador
- Reinicie o terminal

### Mac:
```bash
brew update
```

---

## ❌ Erro no `supabase db push`

- Use a **senha do banco de dados**, não a senha da conta Supabase.
- Para redefinir:
  - Vá em **Project Settings > Database > Database Password**

---

## ❌ Telas em branco / "Cannot connect to Supabase"

- Verifique se o `.env` está correto
- Não deixe espaços extras nas variáveis
- Reinicie o servidor:

```bash
Ctrl + C
npm run dev
```

---

# 🎯 Conclusão

O **Data Insight Hub** está pronto para uso local e produção, utilizando arquitetura moderna com React + Supabase, incluindo autenticação, banco PostgreSQL, RLS e funções serverless.

Bom desenvolvimento! 🚀

---

## 📄 Licença

© 2026 PROATIVA. Todos os direitos reservados.
