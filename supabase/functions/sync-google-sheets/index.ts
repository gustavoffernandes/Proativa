import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Question IDs in order matching spreadsheet columns (after metadata columns)
const QUESTION_IDS = [
  "c1","c2","c3","c4","c5","c6","c7","c8","c9","c10","c11","c12","c13","c14","c15","c16","c17","c18","c19",
  "g1","g2","g3","g4","g5","g6","g7","g8","g9","g10","g11","g12","g13","g14","g15","g16","g17","g18","g19","g20","g21",
  "v1","v2","v3","v4","v5","v6","v7","v8","v9","v10","v11","v12","v13","v14","v15","v16","v17","v18","v19","v20","v21","v22","v23","v24","v25","v26","v27","v28",
  "s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13","s14","s15","s16","s17","s18","s19","s20","s21","s22","s23",
];

const METADATA_COLUMNS = 5; // timestamp, name, sex, age, sector

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  // Format: DD/MM/YYYY HH:MM:SS
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, min, sec] = match;
    return `${year}-${month}-${day}T${hour}:${min}:${sec}`;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleApiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- INÍCIO DA NOVA VERIFICAÇÃO DE ADMIN ---
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas administradores podem sincronizar planilhas." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // --- FIM DA NOVA VERIFICAÇÃO ---

    const { configId } = await req.json();
    // --- FIM DA VERIFICAÇÃO ---


    const { data: config, error: configError } = await supabase
      .from("google_forms_config")
      .select("*")
      .eq("id", configId)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: "Configuração não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!googleApiKey) {
      await supabase.from("sync_logs").insert({
        config_id: configId,
        status: "error",
        error_message: "GOOGLE_SHEETS_API_KEY não configurada.",
        finished_at: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ error: "API Key do Google não configurada." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: log } = await supabase.from("sync_logs").insert({
      config_id: configId,
      status: "running",
    }).select().single();

    try {
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheet_id}/values/${encodeURIComponent(config.sheet_name)}?key=${googleApiKey}`;
      const sheetRes = await fetch(sheetUrl);

      if (!sheetRes.ok) {
        const errBody = await sheetRes.text();
        throw new Error(`Google Sheets API error: ${sheetRes.status} - ${errBody}`);
      }

      const sheetData = await sheetRes.json();
      const rows = sheetData.values || [];

      if (rows.length < 2) {
        throw new Error("Planilha vazia ou sem dados de resposta.");
      }

      // Skip header row, parse data rows
      const dataRows = rows.slice(1);

      // Delete existing responses for this config (full replace sync)
      await supabase.from("survey_responses").delete().eq("config_id", configId);

      // Parse and insert responses in batches
      const responses = dataRows.map((row: string[], idx: number) => {
        const answers: Record<string, number> = {};
        const numQuestionCols = Math.min(row.length - METADATA_COLUMNS, QUESTION_IDS.length);
        
        for (let i = 0; i < numQuestionCols; i++) {
          const val = parseInt(row[METADATA_COLUMNS + i], 10);
          if (!isNaN(val) && val >= 1 && val <= 5) {
            answers[QUESTION_IDS[i]] = val;
          }
        }

        return {
          config_id: configId,
          response_timestamp: parseDate(row[0]),
          respondent_name: row[1] || null,
          sex: row[2] || null,
          age: row[3] ? parseInt(row[3], 10) || null : null,
          sector: row[4] || null,
          answers,
          raw_row_index: idx,
        };
      });

      // Insert in batches of 50
      const batchSize = 50;
      for (let i = 0; i < responses.length; i += batchSize) {
        const batch = responses.slice(i, i + batchSize);
        const { error: insertError } = await supabase.from("survey_responses").insert(batch);
        if (insertError) throw new Error(`Erro ao inserir respostas: ${insertError.message}`);
      }

      // Update sync log
      await supabase.from("sync_logs").update({
        status: "success",
        rows_synced: responses.length,
        finished_at: new Date().toISOString(),
      }).eq("id", log?.id);

      // Update last sync
      await supabase.from("google_forms_config").update({
        last_sync_at: new Date().toISOString(),
      }).eq("id", configId);

      return new Response(
        JSON.stringify({
          success: true,
          rows_synced: responses.length,
          questions_mapped: Math.min(dataRows[0]?.length - METADATA_COLUMNS || 0, QUESTION_IDS.length),
          message: `${responses.length} respostas sincronizadas com sucesso.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (syncError) {
      await supabase.from("sync_logs").update({
        status: "error",
        error_message: (syncError as Error).message,
        finished_at: new Date().toISOString(),
      }).eq("id", log?.id);
      throw syncError;
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
