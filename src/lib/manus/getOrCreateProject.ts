import { supabaseAdmin } from "@/lib/supabase/admin";
import { createProject } from "./client";
import { MANUS_PROJECT_INSTRUCTION } from "./prompt";

const CONFIG_KEY = "manus_project_id";

export async function getOrCreateManusProjectId(): Promise<string> {
  // DB에서 project_id 조회
  const { data } = await supabaseAdmin
    .from("manus_config")
    .select("value")
    .eq("key", CONFIG_KEY)
    .single();

  if (data?.value) return data.value;

  // 없으면 Manus에 프로젝트 생성
  const projectId = await createProject("TubeWatch Report Generator", MANUS_PROJECT_INSTRUCTION);

  await supabaseAdmin
    .from("manus_config")
    .upsert({ key: CONFIG_KEY, value: projectId });

  return projectId;
}
