import { ENV } from "@/config/environment";
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  return createBrowserClient(ENV.supabaseUrl!, ENV.supabaseKey!);
};
