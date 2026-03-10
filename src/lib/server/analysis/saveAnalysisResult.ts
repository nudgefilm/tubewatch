import { supabaseAdmin } from "@/lib/supabase/admin";

export async function saveAnalysisResult(payload: any) {
  const { data, error } = await supabaseAdmin
    .from("analysis_results")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}