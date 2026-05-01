import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // *** 보안 마스킹: 실제 키는 .env.local에만 존재 ***
  {
    auth: {
      persistSession: false,
    },
  }
);
